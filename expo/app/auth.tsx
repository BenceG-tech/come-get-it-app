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
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, Chrome, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AuthDivider from '@/components/AuthDivider';
import AuthLegalText from '@/components/AuthLegalText';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import SocialButton from '@/components/SocialButton';
import TextInputField from '@/components/TextInputField';
import { useAuth } from '@/context/AuthContext';

const LOGO_SOURCE = require('@/assets/images/come-get-it-logo-white.png');
const BACKGROUND_SOURCE = require('@/assets/images/auth-background.png');

const CYAN = '#00C8E8' as const;
const TEXT_MUTED = 'rgba(255, 255, 255, 0.72)' as const;
const TEXT_SOFT = 'rgba(255, 255, 255, 0.48)' as const;

type Mode = 'login' | 'signup';
type FocusedField = 'email' | 'password' | null;

function AuthScreen() {
  const router = useRouter();
  const { session, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = useMemo<boolean>(() => {
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
      const normalizedEmail = email.trim();
      if (mode === 'login') {
        await signInWithEmail(normalizedEmail, password);
      } else {
        await signUpWithEmail(normalizedEmail, password);
        await signInWithEmail(normalizedEmail, password);
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
    setMode((previousMode) => (previousMode === 'login' ? 'signup' : 'login'));
  }, []);

  const focusEmail = useCallback(() => setFocusedField('email'), []);
  const focusPassword = useCallback(() => setFocusedField('password'), []);
  const clearFocus = useCallback(() => setFocusedField(null), []);
  const togglePasswordVisibility = useCallback(() => setShowPassword((isVisible) => !isVisible), []);

  const primaryLabel = mode === 'login' ? 'Bejelentkezés' : 'Regisztráció';
  const secondaryLabel = mode === 'login' ? 'Regisztráció' : 'Bejelentkezés';

  return (
    <View style={styles.root} testID="auth-root">
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <Image
        source={BACKGROUND_SOURCE}
        style={styles.backgroundImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={160}
      />
      <View pointerEvents="none" style={styles.backgroundDim} />
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(0,0,0,0.76)',
          'rgba(0,0,0,0.58)',
          'rgba(0,0,0,0.78)',
          '#000000',
        ]}
        locations={[0, 0.34, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Image
                source={LOGO_SOURCE}
                style={styles.logo}
                contentFit="contain"
                cachePolicy="memory-disk"
                accessibilityLabel="Come Get It"
              />

              <View style={styles.heroTextBlock}>
                <Text style={styles.heading}>Üdv újra!</Text>
                <Text style={styles.subheading}>
                  Jelentkezz be, és fedezd fel partnereinket és a napi ingyen italokat.
                </Text>
              </View>

              <View style={styles.formBlock}>
                <TextInputField
                  ref={emailRef}
                  testID="auth-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="E-mail cím"
                  leftIcon={<Mail size={19} color={focusedField === 'email' ? CYAN : TEXT_SOFT} />}
                  focused={focusedField === 'email'}
                  onFocus={focusEmail}
                  onBlur={clearFocus}
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
                  leftIcon={<LockKeyhole size={19} color={focusedField === 'password' ? CYAN : TEXT_SOFT} />}
                  rightIcon={
                    showPassword ? (
                      <EyeOff size={19} color={TEXT_SOFT} />
                    ) : (
                      <Eye size={19} color={TEXT_SOFT} />
                    )
                  }
                  onRightIconPress={togglePasswordVisibility}
                  focused={focusedField === 'password'}
                  onFocus={focusPassword}
                  onBlur={clearFocus}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />

                <Pressable hitSlop={10} style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Elfelejtetted a jelszavad?</Text>
                </Pressable>
              </View>

              <View style={styles.actionsBlock}>
                <PrimaryButton
                  testID="auth-submit"
                  label={primaryLabel}
                  onPress={onSubmit}
                  disabled={!canSubmit}
                  loading={loading}
                />

                <SecondaryButton
                  testID="auth-switch-mode"
                  label={secondaryLabel}
                  onPress={switchMode}
                  disabled={loading}
                />
              </View>

              <View style={styles.dividerBlock}>
                <AuthDivider />
              </View>

              <View style={styles.socialBlock}>
                <SocialButton
                  testID="auth-apple"
                  icon={<Apple size={21} color="#FFFFFF" />}
                  label="Folytatás az Apple-lel"
                  onPress={onApple}
                  disabled={loading}
                />
                <SocialButton
                  testID="auth-google"
                  icon={<Chrome size={21} color="#00C8E8" />}
                  label="Folytatás a Google-lel"
                  onPress={onGoogle}
                  disabled={loading}
                />
              </View>

              <View style={styles.legalBlock}>
                <AuthLegalText />
              </View>
            </View>
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
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 34,
    paddingBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  logo: {
    width: 226,
    height: 92,
    marginBottom: 28,
  },
  heroTextBlock: {
    alignItems: 'center',
    marginBottom: 34,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800' as const,
    textAlign: 'center',
    letterSpacing: -0.7,
    marginBottom: 12,
  },
  subheading: {
    color: TEXT_MUTED,
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    maxWidth: 326,
    fontWeight: '500' as const,
  },
  formBlock: {
    width: '100%',
    gap: 15,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 1,
    marginBottom: 12,
  },
  forgotText: {
    color: CYAN,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  actionsBlock: {
    width: '100%',
    gap: 16,
    marginTop: 12,
  },
  dividerBlock: {
    width: '100%',
    marginTop: 30,
    marginBottom: 20,
  },
  socialBlock: {
    width: '100%',
    gap: 12,
  },
  legalBlock: {
    marginTop: 28,
    alignItems: 'center',
  },
});
