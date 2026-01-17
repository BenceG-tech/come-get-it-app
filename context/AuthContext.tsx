import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  session: Session | null;
  isAuthReady: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

function toUserMessage(err: unknown): string {
  if (!err) return 'Ismeretlen hiba történt.';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Ismeretlen hiba történt.';
  }
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const supabase = useMemo(() => getSupabase(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        console.log('[Auth] getSession init');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Auth] getSession error', error);
        }
        if (!mounted) return;
        setSession(data.session ?? null);
      } finally {
        if (mounted) setIsAuthReady(true);
      }
    };

    init().catch((e) => {
      console.error('[Auth] init failed', e);
      if (mounted) setIsAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('[Auth] onAuthStateChange', { event, hasSession: Boolean(nextSession) });
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        console.log('[Auth] signInWithEmail');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } catch (e) {
        console.error('[Auth] signInWithEmail failed', e);
        Alert.alert('Nem sikerült bejelentkezni', toUserMessage(e));
        throw e;
      }
    },
    [supabase]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        console.log('[Auth] signUpWithEmail');
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Sikeres regisztráció', 'Ellenőrizd az emailed a megerősítéshez (ha szükséges).');
      } catch (e) {
        console.error('[Auth] signUpWithEmail failed', e);
        Alert.alert('Nem sikerült regisztrálni', toUserMessage(e));
        throw e;
      }
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const appOwnership = Constants.appOwnership ?? 'unknown';
      const useProxy = appOwnership === 'expo';
      console.log('[Auth] signInWithGoogle start', { platform: Platform.OS, appOwnership, useProxy });

      if (Platform.OS === 'web') {
        const redirectTo = AuthSession.makeRedirectUri();
        console.log('[Auth] web redirectTo', redirectTo);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: false,
          },
        });

        if (error) throw error;
        console.log('[Auth] web signInWithOAuth started', { hasUrl: Boolean(data?.url) });
        return;
      }

      const redirectTo = AuthSession.makeRedirectUri();

      console.log('[Auth] native redirectTo', { redirectTo, appOwnership, useProxy });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      const authUrl = data?.url;
      if (!authUrl) throw new Error('Hiányzó OAuth URL');

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
      console.log('[Auth] openAuthSessionAsync result', { type: result.type });

      if (result.type !== 'success') {
        if (result.type === 'cancel' || result.type === 'dismiss') return;
        throw new Error(`OAuth flow failed (${result.type})`);
      }

      const callbackUrl = result.url;
      console.log('[Auth] OAuth callback url received', { hasUrl: Boolean(callbackUrl) });

      const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(callbackUrl);
      if (exchangeError) throw exchangeError;

      console.log('[Auth] exchangeCodeForSession ok', { hasSession: Boolean(exchangeData?.session) });
    } catch (e) {
      console.error('[Auth] signInWithGoogle failed', e);

      const redirectTo = AuthSession.makeRedirectUri();

      Alert.alert(
        'Nem sikerült Google bejelentkezés',
        `${toUserMessage(e)}\n\n1) Supabase → Authentication → Providers → Google: legyen Enabled.\n2) Supabase → Authentication → URL Configuration → Redirect URLs: add hozzá ezt: ${redirectTo}`
      );
      throw e;
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      console.log('[Auth] signOut');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error('[Auth] signOut failed', e);
      Alert.alert('Nem sikerült kijelentkezni', toUserMessage(e));
      throw e;
    }
  }, [supabase]);

  return {
    session,
    isAuthReady,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };
});
