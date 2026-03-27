import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
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
  signInWithApple: () => Promise<void>;
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

  const ensureProfileRow = useCallback(
    async (nextSession: Session | null) => {
      const userId = nextSession?.user?.id;
      if (!userId) return;

      try {
        console.log('[Auth] ensureProfileRow start', { userId });
        const payload = {
          id: userId,
          points: 0,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>;

        const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
        if (error) {
          console.warn('[Auth] ensureProfileRow failed', {
            message: (error as { message?: unknown })?.message,
            error,
          });
          return;
        }

        console.log('[Auth] ensureProfileRow ok');
      } catch (e) {
        console.warn('[Auth] ensureProfileRow threw', e);
      }
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        console.log('[Auth] getSession init starting...');
        const { data, error } = await supabase.auth.getSession();
        console.log('[Auth] getSession completed', { hasSession: Boolean(data?.session), error: error?.message });
        if (error) {
          console.warn('[Auth] getSession error', error);
        }
        if (!mounted) return;
        setSession(data?.session ?? null);
        ensureProfileRow(data?.session ?? null).catch((e) => {
          console.warn('[Auth] ensureProfileRow after getSession failed', e);
        });
      } catch (e) {
        console.error('[Auth] getSession threw', e);
        if (mounted) setSession(null);
      } finally {
        console.log('[Auth] Setting isAuthReady to true');
        if (mounted) setIsAuthReady(true);
      }
    };

    init().catch((e) => {
      console.error('[Auth] init failed completely', e);
      if (mounted) {
        setSession(null);
        setIsAuthReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('[Auth] onAuthStateChange', { event, hasSession: Boolean(nextSession) });
      setSession(nextSession ?? null);
      ensureProfileRow(nextSession ?? null).catch((e) => {
        console.warn('[Auth] ensureProfileRow in listener failed', e);
      });
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [ensureProfileRow, supabase]);

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

  const getRedirectTo = useCallback((): string => {
    const redirectTo = AuthSession.makeRedirectUri({ scheme: 'myapp' });
    console.log('[Auth] computed redirectTo', { redirectTo, platform: Platform.OS });
    return redirectTo;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const appOwnership = Constants.appOwnership ?? 'unknown';
      const useProxy = appOwnership === 'expo';
      console.log('[Auth] signInWithGoogle start', { platform: Platform.OS, appOwnership, useProxy });

      const redirectTo = getRedirectTo();

      if (Platform.OS === 'web') {
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

      const redirectTo = getRedirectTo();

      Alert.alert(
        'Nem sikerült Google bejelentkezés',
        `${toUserMessage(e)}\n\n1) Supabase → Authentication → Providers → Google: legyen Enabled.\n2) Supabase → Authentication → URL Configuration → Redirect URLs: add hozzá ezt: ${redirectTo}`
      );
      throw e;
    }
  }, [getRedirectTo, supabase]);

  const signInWithApple = useCallback(async () => {
    try {
      console.log('[Auth] signInWithApple start', { platform: Platform.OS });

      if (Platform.OS !== 'ios') {
        Alert.alert('Apple bejelentkezés', 'Az Apple bejelentkezés csak iPhone-on elérhető.');
        return;
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('[Auth] AppleAuthentication availability', { isAvailable });
      if (!isAvailable) {
        Alert.alert('Apple bejelentkezés', 'Az Apple bejelentkezés ezen az eszközön nem elérhető.');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) throw new Error('Hiányzó Apple identityToken');

      console.log('[Auth] Apple credential received', {
        hasIdentityToken: Boolean(identityToken),
        hasEmail: Boolean(credential.email),
      });

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) throw error;

      console.log('[Auth] signInWithApple ok', { hasSession: Boolean(data?.session) });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in (e as Record<string, unknown>)) {
        const code = (e as { code?: string }).code;
        if (code === 'ERR_CANCELED') {
          console.log('[Auth] Apple sign-in cancelled');
          return;
        }
      }

      console.error('[Auth] signInWithApple failed', e);
      Alert.alert('Nem sikerült Apple bejelentkezés', toUserMessage(e));
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
    signInWithApple,
    signOut,
  };
});
