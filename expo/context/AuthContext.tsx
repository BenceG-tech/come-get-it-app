import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import type { Session } from '@supabase/supabase-js';
import { clearPersistedSupabaseSession, getSupabase } from '@/lib/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  session: Session | null;
  isAuthReady: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
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

/** Gyakori auth-hibák fordítása érthető, teendőt adó magyar üzenetre. */
function mapAuthError(err: unknown): string {
  const raw = toUserMessage(err);
  const msg = raw.toLowerCase();
  if (msg.includes('email_not_confirmed') || msg.includes('email not confirmed')) {
    return 'Az e-mail cím még nincs megerősítve. Nyisd meg a regisztráció után kapott e-mailt, és kattints a megerősítő linkre.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'Hibás e-mail cím vagy jelszó.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'Ezzel az e-mail címmel már van fiókod — jelentkezz be.';
  }
  if (msg.includes('password should be')) {
    return 'A jelszó túl rövid — legalább 8 karakter legyen.';
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('unable to connect')) {
    return 'Nem sikerült elérni a szervert. Ellenőrizd az internetkapcsolatot, és próbáld újra.';
  }
  return raw;
}

function isInvalidRefreshToken(err: unknown): boolean {
  const message = toUserMessage(err).toLowerCase();
  return message.includes('invalid refresh token') || message.includes('refresh token not found');
}

type OAuthCallbackParams = {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
};

/** A visszatérési URL-ből kinyeri a PKCE code-ot vagy az implicit tokeneket (query + fragment). */
function parseOAuthCallbackParams(urlString: string): OAuthCallbackParams {
  const result: OAuthCallbackParams = {};

  const collect = (segment: string): void => {
    for (const pair of segment.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      if (eq < 0) continue;
      const key = pair.slice(0, eq);
      let value = pair.slice(eq + 1);
      try {
        value = decodeURIComponent(value);
      } catch {
        // ha nem dekódolható, nyers értéket használunk
      }
      if (key === 'code') result.code = value;
      else if (key === 'access_token') result.accessToken = value;
      else if (key === 'refresh_token') result.refreshToken = value;
    }
  };

  try {
    const hashIndex = urlString.indexOf('#');
    const queryIndex = urlString.indexOf('?');

    if (queryIndex >= 0) {
      const queryEnd = hashIndex > queryIndex ? hashIndex : urlString.length;
      collect(urlString.slice(queryIndex + 1, queryEnd));
    }
    if (hashIndex >= 0) {
      collect(urlString.slice(hashIndex + 1));
    }
  } catch (e) {
    console.warn('[Auth] parseOAuthCallbackParams failed', e);
  }

  return result;
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
        const email = nextSession.user.email ?? null;
        const metadata = nextSession.user.user_metadata as Record<string, unknown> | undefined;
        const metadataName = metadata?.full_name ?? metadata?.name;
        const fallbackName = email?.split('@')[0] || 'Come Get It tag';
        const payload = {
          id: userId,
          name: typeof metadataName === 'string' && metadataName.trim() ? metadataName.trim() : fallbackName,
          email,
          points: 0,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>;

        // Meglévő profilnál soha ne írjuk felül a pontokat vagy a felhasználó adatait.
        const { error } = await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
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
          if (isInvalidRefreshToken(error)) {
            console.warn('[Auth] Removing invalid persisted session');
            await clearPersistedSupabaseSession();
          } else {
            console.warn('[Auth] getSession error', error);
          }
        }
        if (!mounted) return;
        setSession(data?.session ?? null);
        ensureProfileRow(data?.session ?? null).catch((e) => {
          console.warn('[Auth] ensureProfileRow after getSession failed', e);
        });
      } catch (e) {
        if (isInvalidRefreshToken(e)) {
          console.warn('[Auth] Removing invalid persisted session after exception');
          await clearPersistedSupabaseSession();
        } else {
          console.error('[Auth] getSession threw', e);
        }
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
        Alert.alert('Nem sikerült bejelentkezni', mapAuthError(e));
        throw e;
      }
    },
    [supabase]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        console.log('[Auth] signUpWithEmail');
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Ha a megerősítés kikapcsolt, signUp azonnal session-t ad — így azonnal be tudunk lépni.
        return Boolean(data?.session);
      } catch (e) {
        console.error('[Auth] signUpWithEmail failed', e);
        Alert.alert('Nem sikerült regisztrálni', mapAuthError(e));
        throw e;
      }
    },
    [supabase]
  );

  /**
   * Környezetenként pontos visszatérési cím:
   * - web: az oldal origin-je (a session a URL-ből detektálva)
   * - Expo Go / preview: az aktuális exp:// URL (Supabase Redirect URLs-be ezt kell felvenni)
   * - önálló build: myapp:// sémás cím
   */
  const getRedirectTo = useCallback((): string => {
    if (Platform.OS === 'web') {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      console.log('[Auth] web redirectTo', origin);
      return origin;
    }
    const url = Linking.createURL('');
    console.log('[Auth] native redirectTo', { url, appOwnership: Constants.appOwnership });
    return url;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    let redirectTo = '';
    try {
      const appOwnership = Constants.appOwnership ?? 'unknown';
      console.log('[Auth] signInWithGoogle start', { platform: Platform.OS, appOwnership });

      redirectTo = getRedirectTo();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          // natívan magunk nyitjuk meg és zárjuk le a folyamatot
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) throw error;
      const authUrl = data?.url;
      if (!authUrl) throw new Error('Hiányzó OAuth URL');

      if (Platform.OS === 'web') {
        console.log('[Auth] web signInWithOAuth started, redirecting browser', { hasUrl: Boolean(authUrl) });
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
      console.log('[Auth] openAuthSessionAsync result', { type: result.type });

      if (result.type !== 'success') {
        if (result.type === 'cancel' || result.type === 'dismiss') {
          console.log('[Auth] Google sign-in cancelled by user');
          return;
        }
        throw new Error(`A bejelentkezési ablak nem fejeződött be (${result.type})`);
      }

      const callbackUrl = result.url;
      console.log('[Auth] OAuth callback url received', { hasUrl: Boolean(callbackUrl) });

      const params = parseOAuthCallbackParams(callbackUrl);

      if (params.code) {
        // PKCE flow: code cseréje session-re
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exchangeError) throw exchangeError;
        console.log('[Auth] exchangeCodeForSession ok');
        return;
      }

      if (params.accessToken && params.refreshToken) {
        // implicit flow fallback
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });
        if (sessionError) throw sessionError;
        console.log('[Auth] setSession ok (implicit fallback)');
        return;
      }

      throw new Error('A bejelentkezés válaszában nem volt munkamenet-adat. Ellenőrizd a Supabase redirect beállításokat.');
    } catch (e) {
      console.error('[Auth] signInWithGoogle failed', e);
      Alert.alert(
        'Nem sikerült a Google bejelentkezés',
        `${mapAuthError(e)} Próbáld újra, vagy jelentkezz be e-mail címmel.`
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
      Alert.alert('Nem sikerült Apple bejelentkezés', mapAuthError(e));
      throw e;
    }
  }, [supabase]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      try {
        const redirectTo = Platform.OS === 'web'
          ? `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`
          : Linking.createURL('reset-password');
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (error) throw error;
      } catch (e) {
        Alert.alert('Nem sikerült elküldeni', mapAuthError(e));
        throw e;
      }
    },
    [supabase]
  );

  const updatePassword = useCallback(
    async (password: string) => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      } catch (e) {
        Alert.alert('Nem sikerült módosítani a jelszót', mapAuthError(e));
        throw e;
      }
    },
    [supabase]
  );

  const deleteAccount = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      await clearPersistedSupabaseSession();
      setSession(null);
    } catch (e) {
      Alert.alert('Nem sikerült törölni a fiókot', mapAuthError(e));
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
      // Visszavont refresh token esetén a helyi munkamenet törlése a helyes helyreállítás.
      if (!isInvalidRefreshToken(e)) {
        Alert.alert('Nem sikerült kijelentkezni', toUserMessage(e));
        throw e;
      }
      await clearPersistedSupabaseSession();
      setSession(null);
    }
  }, [supabase]);

  return {
    session,
    isAuthReady,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    requestPasswordReset,
    updatePassword,
    deleteAccount,
    signOut,
  };
});
