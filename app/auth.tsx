import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, Chrome, Mail } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

type Mode = 'login' | 'signup';

const LOGO_SOURCE = {
  uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6o5hpbimnv4oml44hjmiv',
};

function AuthScreen() {
  const router = useRouter();
  const { session, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !loading;
  }, [email, loading, password]);

  useEffect(() => {
    if (!session) return;
    console.log('[AuthScreen] session detected -> navigate to /(tabs)/home');
    router.replace('/(tabs)/home');
  }, [router, session]);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
        await signInWithEmail(email.trim(), password);
      }
    } finally {
      setLoading(false);
    }
  }, [canSubmit, email, mode, password, signInWithEmail, signUpWithEmail]);

  const onGoogle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  }, [loading, signInWithGoogle]);

  const onApple = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithApple();
    } finally {
      setLoading(false);
    }
  }, [loading, signInWithApple]);

  return (
    <View style={styles.root} testID="auth-root">
      <LinearGradient colors={['#061114', '#030607', '#000000']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.overlay} />
      <View pointerEvents="none" style={styles.glowA} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safe}
        >
          <View style={styles.content} testID="auth-content">
            <View style={styles.brand} testID="auth-header">
              <View style={styles.logoWrap} testID="auth-logo">
                <Image source={LOGO_SOURCE} style={styles.logo} contentFit="contain" />
              </View>
            </View>

            <View style={styles.card} testID="auth-card">
            <View style={styles.segment} testID="auth-segment">
              <Pressable
                testID="auth-mode-login"
                onPress={() => setMode('login')}
                style={[styles.segmentBtn, mode === 'login' && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Bejelentkezés</Text>
              </Pressable>
              <Pressable
                testID="auth-mode-signup"
                onPress={() => setMode('signup')}
                style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>Regisztráció</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Mail size={16} color="rgba(255,255,255,0.7)" />
                <TextInput
                  testID="auth-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@példa.hu"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Jelszó</Text>
              <View style={styles.inputRow}>
                <View style={styles.dot} />
                <TextInput
                  testID="auth-password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Legalább 6 karakter"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              testID="auth-submit"
              onPress={onSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.primaryBtn,
                !canSubmit && styles.primaryBtnDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#001014" />
              ) : (
                <Text style={styles.primaryText}>
                  {mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
                </Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>vagy</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              testID="auth-apple"
              onPress={onApple}
              style={({ pressed }) => [styles.oauthBtnLight, pressed && styles.pressed]}
              disabled={loading}
            >
              <View style={styles.oauthRow}>
                <Apple size={18} color="#000000" />
                <Text style={styles.oauthTextDark}>Bejelentkezés Apple-lel</Text>
              </View>
            </Pressable>

            <Pressable
              testID="auth-google"
              onPress={onGoogle}
              style={({ pressed }) => [styles.oauthBtn, pressed && styles.pressed]}
              disabled={loading}
            >
              <View style={styles.oauthRow}>
                <Chrome size={18} color="#FFFFFF" />
                <Text style={styles.oauthText}>Folytatás Google-lel</Text>
              </View>
            </Pressable>
            </View>

            <Text style={styles.footnote} testID="auth-footnote">
              Belépéssel elfogadod a feltételeket és az adatkezelési tájékoztatót.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default memo(AuthScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    opacity: 0.25,
  },
  glowA: {
    position: 'absolute',
    top: -140,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(0,209,255,0.12)',
  },

  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  brand: {
    flex: 1,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  logoWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 560,
    height: 240,
    maxWidth: '92%',
  },
  subtitle: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.74)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(14,14,16,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(0,209,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.35)',
  },
  segmentText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  field: {
    gap: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,209,255,0.75)',
  },
  primaryBtn: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryText: {
    color: '#001014',
    fontSize: 15,
    fontWeight: '900',
  },
  dividerRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '800',
  },
  oauthBtnLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  oauthText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  oauthTextDark: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  footnote: {
    marginTop: 12,
    paddingHorizontal: 8,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
