import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { postAuthenticatedFunction } from '@/lib/edgeRequest';
import { withDataTimeout } from '@/lib/supabaseRequest';

const KEY = 'cgi:campaign-push:v1';
type Preference = { userId: string; enabled: boolean; token: string; pending?: boolean; previousTokens?: string[] };
let work: Promise<unknown> = Promise.resolve();
function serialize<T>(action: () => Promise<T>): Promise<T> {
  const result = work.then(action, action);
  work = result.catch(() => undefined);
  return result;
}
async function read(): Promise<Preference | null> {
  try {
    const value = JSON.parse(await AsyncStorage.getItem(KEY) ?? 'null');
    return value && typeof value.userId === 'string' && typeof value.token === 'string' && typeof value.enabled === 'boolean'
      ? value : null;
  } catch { return null; }
}
export async function campaignNotificationPreference(userId: string) {
  const value = await read();
  return value?.userId === userId ? { enabled: value.enabled, pending: Boolean(value.pending) } : { enabled: false, pending: false };
}
async function unregister(userId: string) {
  const saved = await read();
  if (!saved || saved.userId !== userId) return;
  // Remember a failed opt-out and retry it on the next foreground transition.
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...saved, enabled: false, pending: true }));
  const result = await postAuthenticatedFunction('register-push-token', { token: saved.token, previous_tokens: saved.previousTokens ?? [], marketing_opt_in: false }, 12_000, userId);
  if (result.success !== true) throw new Error('Az értesítések kikapcsolását még nem sikerült menteni. Próbáld újra internetkapcsolattal.');
  await AsyncStorage.removeItem(KEY);
}
export function disableCampaignNotifications(userId: string) {
  return serialize(() => unregister(userId));
}
async function register(userId: string, requestPermission: boolean, devicePushToken?: Notifications.DevicePushToken) {
  if (Platform.OS === 'web') throw new Error('Az ajánlatértesítések a mobilalkalmazásban érhetők el.');
  const saved = await read();
  if (!requestPermission && (!saved || saved.userId !== userId || !saved.enabled)) {
    if (saved?.userId === userId && saved.pending) await unregister(userId);
    return;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('offers', { name: 'Ajánlatok és jutalmak', importance: Notifications.AndroidImportance.DEFAULT });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestPermission) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    if (saved?.userId === userId) await unregister(userId);
    if (requestPermission) throw new Error('Engedélyezd az értesítéseket a telefon Beállítások menüjében.');
    return;
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Az értesítések beállítása hiányos.');
  const token = (await withDataTimeout(Notifications.getExpoPushTokenAsync({ projectId, devicePushToken }), 'Értesítések beállítása', 10_000)).data;
  const previousTokens = saved?.userId === userId
    ? [...new Set([saved.token, ...(saved.previousTokens ?? [])])].filter(value => value !== token) : [];
  // Store the token before the network request so a timeout can still be undone.
  await AsyncStorage.setItem(KEY, JSON.stringify({ userId, enabled: true, token, previousTokens, pending: true }));
  const result = await postAuthenticatedFunction('register-push-token', {
    token, previous_tokens: previousTokens,
    platform: Platform.OS, app_version: Constants.expoConfig?.version, marketing_opt_in: true,
  }, 12_000, userId);
  if (result.success !== true) throw new Error('Az értesítési beállítást nem sikerült menteni.');
  await AsyncStorage.setItem(KEY, JSON.stringify({ userId, enabled: true, token, pending: false }));
}
/** Only this explicit user action is allowed to ask for OS permission. */
export function enableCampaignNotifications(userId: string) {
  return serialize(() => register(userId, true));
}
export function syncCampaignNotifications(userId: string, devicePushToken?: Notifications.DevicePushToken) {
  return serialize(() => register(userId, false, devicePushToken));
}
