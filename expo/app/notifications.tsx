import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';
import { campaignNotificationPreference, disableCampaignNotifications, enableCampaignNotifications } from '@/lib/campaignNotifications';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const currentUserRef = useRef(userId);
  currentUserRef.current = userId;
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const refresh = useCallback(async () => {
    if (!userId) return;
    const value = await campaignNotificationPreference(userId);
    if (currentUserRef.current !== userId) return;
    setEnabled(value.enabled);
    setMessage(value.pending ? 'A beállítás szerveroldali mentése még nem igazolt. Internetkapcsolattal próbáld újra.' : '');
  }, [userId]);
  useEffect(() => {
    setEnabled(false); setMessage(''); setBusy(false);
    void refresh();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => sub.remove();
  }, [refresh]);
  const toggle = async (next: boolean) => {
    if (!userId || busy) return;
    setBusy(true); setMessage('');
    try {
      await (next ? enableCampaignNotifications(userId) : disableCampaignNotifications(userId));
      if (currentUserRef.current !== userId) return;
      setEnabled(next);
      setMessage(next ? 'Az ajánlatértesítések be vannak kapcsolva.' : 'Az ajánlatértesítéseket kikapcsoltuk.');
    } catch (error) {
      if (currentUserRef.current !== userId) return;
      setMessage(error instanceof Error ? error.message : 'A beállítást nem sikerült menteni.');
    } finally { if (currentUserRef.current === userId) setBusy(false); }
  };
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Stack.Screen options={{ title: 'Ajánlatértesítések', headerShown: true, headerTintColor: Colors.text, headerStyle: { backgroundColor: Colors.background } }} />
    <Text style={styles.title}>Ajánlatok és jutalmak</Text>
    <Text style={styles.copy}>Kérhetsz értesítéseket a Come Get It ajánlatairól, jutalmairól és újdonságairól. Ez külön beállítás a közeli ingyen italok helyalapú jelzéseitől.</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Kérek ajánlatértesítéseket</Text>
      {busy ? <ActivityIndicator color="#00C8E8" /> : <Switch value={enabled} disabled={!userId} onValueChange={toggle} trackColor={{ true: '#00C8E8' }} accessibilityLabel="Ajánlatértesítések engedélyezése" />}
    </View>
    <Text style={styles.copy}>Nem kötelező bekapcsolnod az app használatához. Itt bármikor visszavonhatod az engedélyt; ehhez internetkapcsolat szükséges.</Text>
    {!userId && <Text style={styles.copy}>A beállításhoz jelentkezz be.</Text>}
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
    <TouchableOpacity onPress={() => void Linking.openSettings()} style={styles.button}><Text style={styles.label}>Telefon értesítési beállításai</Text></TouchableOpacity>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background }, content: { padding: 24, gap: 20 },
  title: { color: Colors.text, fontSize: 27, fontWeight: '700' }, copy: { color: '#BFC3CA', fontSize: 15, lineHeight: 23 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 18, borderRadius: 16, backgroundColor: '#15191E' },
  label: { color: Colors.text, fontSize: 15, flexShrink: 1 }, message: { color: '#00C8E8', lineHeight: 22 },
  button: { padding: 18, borderWidth: 1, borderColor: '#35414A', borderRadius: 16 },
});
