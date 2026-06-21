import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import TextInputField from '@/components/TextInputField';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import SocialButton from '@/components/SocialButton';
import AuthDivider from '@/components/AuthDivider';
import AuthLegalText from '@/components/AuthLegalText';

const LOGO_SOURCE = require('@/assets/images/come-get-it-logo-white.png');

const CYAN = '#00C8E8' as const;
const TEXT_MUTED = 'rgba(255, 255, 255, 0.68)' as const;
const TEXT_SOFT = 'rgba(255, 255, 255, 0.45)' as const;

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
      <LinearGradient
        colors={['#02080C', '#000000', '#000000']}
        style={StyleSheet.absoluteFill}
      />
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

            {/* Fields */}
            <View style={styles.fieldGroup}>
              <TextInputField
                ref={emailRef}
                testID="auth-email"
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail cím"
                leftIcon={<Mail size={18} color={focusedField === 'email' ? CYAN : TEXT_SOFT} />}
                focused={focusedField === 'email'}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <TextInputField
                ref={passwordRef}
                testID="auth-password"
                value={password}
                onChangeText={setPassword}
                placeholder="Jelszó"
                leftIcon={<LockKeyhole size={18} color={focusedField === 'password' ? CYAN : TEXT_SOFT} />}
                rightIcon={
                  showPassword ? (
                    <EyeOff size={18} color={TEXT_SOFT} />
                  ) : (
                    <Eye size={18} color={TEXT_SOFT} />
                  )
                }
                onRightIconPress={() => setShowPassword((prev) => !prev)}
                focused={focusedField === 'password'}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />

              {/* Forgot password */}
              <Pressable style={styles.forgotWrap}>
                <Text style={styles.forgotText}>Elfelejtetted a jelszavad?</Text>
              </Pressable>
            </View>

            {/* Primary CTA */}
            <PrimaryButton
              testID="auth-submit"
              label={primaryLabel}
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={loading}
            />

            {/* Secondary / register button */}
            <View style={styles.secondarySpacer}>
              <SecondaryButton
                testID="auth-switch-mode"
                label={secondaryLabel}
                onPress={switchMode}
                disabled={loading}
              />
            </View>

            {/* Divider */}
            <View style={styles.dividerSpacer}>
              <AuthDivider />
            </View>

            {/* Social login buttons */}
            <View style={styles.socialGroup}>
              <SocialButton
                testID="auth-apple"
                icon={<Apple size={20} color="#FFFFFF" />}
                label="Folytatás az Apple-lel"
                onPress={onApple}
                disabled={loading}
              />
              <SocialButton
                testID="auth-google"
                icon={<Chrome size={20} color="#FFFFFF" />}
                label="Folytatás a Google-lel"
                onPress={onGoogle}
                disabled={loading}
              />
            </View>

            {/* Legal text */}
            <View style={styles.legalWrap}>
              <AuthLegalText />
            </View>

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
    marginTop: 56,
    marginBottom: 36,
  },
  logo: {
    width: 220,
    height: 110,
  },

  // Welcome text
  heading: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subheading: {
    color: TEXT_MUTED,
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 40,
  },

  // Fields
  fieldGroup: {
    width: '100%',
    gap: 14,
    marginBottom: 4,
  },
  forgotWrap: {
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 28,
  },
  forgotText: {
    color: CYAN,
    fontSize: 15,
    fontWeight: '600' as const,
  },

  // Buttons
  secondarySpacer: {
    width: '100%',
    marginTop: 16,
  },
  dividerSpacer: {
    width: '100%',
    marginTop: 32,
    marginBottom: 22,
  },

  // Social
  socialGroup: {
    width: '100%',
    gap: 12,
  },

  // Legal
  legalWrap: {
    marginTop: 28,
    alignItems: 'center',
  },

  // Bottom spacer
  bottomSpacer: {
    height: 24,
  },
});
