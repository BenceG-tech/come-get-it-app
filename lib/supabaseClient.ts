import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('[SupabaseClient] Missing env vars', {
    hasUrl: Boolean(SUPABASE_URL),
    hasAnon: Boolean(SUPABASE_ANON),
  });
}

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const storage: StorageAdapter =
  Platform.OS === 'web'
    ? {
        getItem: async (key: string) => {
          try {
            return globalThis?.localStorage?.getItem(key) ?? null;
          } catch (e) {
            console.warn('[SupabaseClient] localStorage getItem failed', e);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            globalThis?.localStorage?.setItem(key, value);
          } catch (e) {
            console.warn('[SupabaseClient] localStorage setItem failed', e);
          }
        },
        removeItem: async (key: string) => {
          try {
            globalThis?.localStorage?.removeItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] localStorage removeItem failed', e);
          }
        },
      }
    : {
        getItem: async (key: string) => {
          try {
            return await AsyncStorage.getItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage getItem failed', e);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            await AsyncStorage.setItem(key, value);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage setItem failed', e);
          }
        },
        removeItem: async (key: string) => {
          try {
            await AsyncStorage.removeItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage removeItem failed', e);
          }
        },
      };

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  console.log('[SupabaseClient] Creating supabase client');
  client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
      storage,
    },
  });

  return client;
}
