import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, Chrome, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

const LOGO_SOURCE = require('@/assets/images/come-get-it-logo-white.png');

const CYAN = '#00C8E8' as const;
const BLUE = '#0877D8' as const;
const SURFACE_DARK = 'rgba(10, 16, 22, 0.72)' as const;
const SURFACE_BORDER = 'rgba(255, 255, 255, 0.16)' as const;
const TEXT_MUTED = 'rgba(255, 255, 255, 0.68)' as const;
const TEXT_SOFT = 'rgba(255, 255, 255, 0.45)' as const;
const TEXT_WHITE = '#FFFFFF' as const;

type Mode = 'login' | 'signup';

function AuthScreen() {
  const router = useRouter();
  const { session, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

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

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
  }, []);

  const primaryLabel = mode === 'login' ? 'Bejelentkezés' : 'Regisztráció';
  const secondaryLabel = mode === 'login' ? 'Regisztráció' : 'Bejelentkezés';

  return (
    <View style={styles.root} testID="auth-root">
      {/* Background layers */}
      <LinearGradient
        colors={['#02080C', '#000000', '#000000']}
        style={StyleSheet.absoluteFill}
      />
      {/* Top-right cyan glow */}
      <View pointerEvents="none" style={styles.glowTopRight} />
      {/* Subtle center ambient */}
      <View pointerEvents="none" style={styles.glowCenter} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Logo */}
            <View style={styles.logoWrap}>
              <Image
                source={LOGO_SOURCE}
                style={styles.logo}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>

            {/* Welcome text */}
            <Text style={styles.heading}>Üdv újra!</Text>
            <Text style={styles.subheading}>
              Jelentkezz be, és fedezd fel partnereinket és a napi ingyen italokat.
            </Text>

            {/* Email field */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'email' && styles.inputWrapFocused,
                ]}
              >
                <Mail size={18} color={focusedField === 'email' ? CYAN : TEXT_SOFT} style={styles.inputIcon} />
                <TextInput
                  ref={emailRef}
                  testID="auth-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="E-mail cím"
                  placeholderTextColor="rgba(255,255,255,0.48)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.input}
                />
              </View>

              {/* Password field */}
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'password' && styles.inputWrapFocused,
                ]}
              >
                <LockKeyhole size={18} color={focusedField === 'password' ? CYAN : TEXT_SOFT} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  testID="auth-password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Jelszó"
                  placeholderTextColor="rgba(255,255,255,0.48)"
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={12}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={TEXT_SOFT} />
                  ) : (
                    <Eye size={18} color={TEXT_SOFT} />
                  )}
                </Pressable>
              </View>

              {/* Forgot password */}
              <Pressable style={styles.forgotWrap}>
                <Text style={styles.forgotText}>Elfelejtetted a jelszavad?</Text>
              </Pressable>
            </View>

            {/* Primary CTA */}
            <Pressable
              testID="auth-submit"
              onPress={onSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.primaryBtnOuter,
                !canSubmit && styles.primaryBtnDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={[CYAN, BLUE]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#001014" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
                )}
              </LinearGradient>
              {/* Glow shadow */}
              {canSubmit && (
                <View pointerEvents="none" style={styles.primaryGlow} />
              )}
            </Pressable>

            {/* Secondary / register button */}
            <Pressable
              testID="auth-switch-mode"
              onPress={switchMode}
              disabled={loading}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && !loading && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryBtnText}>{secondaryLabel}</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>vagy</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social login buttons */}
            <Pressable
              testID="auth-apple"
              onPress={onApple}
              disabled={loading}
              style={({ pressed }) => [
                styles.socialBtn,
                pressed && !loading && styles.pressed,
              ]}
            >
              <Apple size={20} color={TEXT_WHITE} />
              <Text style={styles.socialBtnText}>Folytatás az Apple-lel</Text>
            </Pressable>

            <Pressable
              testID="auth-google"
              onPress={onGoogle}
              disabled={loading}
              style={({ pressed }) => [
                styles.socialBtn,
                pressed && !loading && styles.pressed,
              ]}
            >
              <Chrome size={20} color={TEXT_WHITE} />
              <Text style={styles.socialBtnText}>Folytatás a Google-lel</Text>
            </Pressable>

            {/* Legal text */}
            <Text style={styles.legal} testID="auth-footnote">
              A folytatással elfogadod az{' '}
              <Text style={styles.legalLink}>Általános Szerződési Feltételeket</Text>
              {' '}és az{' '}
              <Text style={styles.legalLink}>Adatvédelmi Szabályzatot</Text>.
            </Text>

            {/* Bottom spacer for safe area */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
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
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },

  // Background glows
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: 'rgba(0,200,232,0.10)',
  },
  glowCenter: {
    position: 'absolute',
    top: '30%' as unknown as number,
    left: '20%' as unknown as number,
    right: '20%' as unknown as number,
    height: 200,
    borderRadius: 200,
    backgroundColor: 'rgba(0,200,232,0.04)',
  },

  // Scroll content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%' as unknown as number,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 52,
    marginBottom: 32,
  },
  logo: {
    width: 220,
    height: 110,
  },

  // Welcome text
  heading: {
    color: TEXT_WHITE,
    fontSize: 36,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 10,
  },
  subheading: {
    color: TEXT_MUTED,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 36,
  },

  // Fields
  fieldGroup: {
    width: '100%',
    gap: 14,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 22,
    backgroundColor: SURFACE_DARK,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    paddingHorizontal: 20,
  },
  inputWrapFocused: {
    borderColor: CYAN,
    shadowColor: CYAN,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: TEXT_WHITE,
    fontSize: 16,
    fontWeight: '600' as const,
    padding: 0,
  },
  eyeBtn: {
    marginLeft: 10,
    padding: 4,
  },

  // Forgot password
  forgotWrap: {
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 28,
  },
  forgotText: {
    color: CYAN,
    fontSize: 15,
    fontWeight: '600' as const,
  },

  // Primary button
  primaryBtnOuter: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: CYAN,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#001014',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,200,232,0.30)',
  },

  // Secondary button
  secondaryBtn: {
    width: '100%',
    height: 58,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1.5,
    borderColor: CYAN,
  },
  secondaryBtnText: {
    color: TEXT_WHITE,
    fontSize: 19,
    fontWeight: '600' as const,
  },

  // Divider
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontWeight: '600' as const,
  },

  // Social buttons
  socialBtn: {
    width: '100%',
    height: 58,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE_DARK,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    marginBottom: 12,
    gap: 10,
  },
  socialBtnText: {
    color: TEXT_WHITE,
    fontSize: 17,
    fontWeight: '600' as const,
  },

  // Legal
  legal: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 330,
    marginTop: 24,
  },
  legalLink: {
    color: CYAN,
    fontWeight: '600' as const,
  },

  // Pressed state
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  // Bottom spacer
  bottomSpacer: {
    height: 20,
  },
});
