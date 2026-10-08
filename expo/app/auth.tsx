import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Apple, Chrome, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { getSupabase } from '@/lib/supabaseClient';
import { completeEmailConfirmation } from '@/lib/email-confirmation';
import AuthDivider from '@/components/AuthDivider';
import AuthLegalText from '@/components/AuthLegalText';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import SocialButton from '@/components/SocialButton';
import TextInputField from '@/components/TextInputField';
import { useAuth } from '@/context/AuthContext';

const LOGO_SOURCE = require('@/assets/images/login-logo-attached.png');
const BG_SOURCE = require('@/assets/images/login-bg-budapest-arcs.png');

const CYAN = '#00C8E8' as const;
const TEXT_MUTED = 'rgba(255, 255, 255, 0.68)' as const;
const TEXT_SOFT = 'rgba(255, 255, 255, 0.44)' as const;
const ENABLE_GOOGLE_AUTH = process.env.EXPO_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
const ENABLE_APPLE_AUTH = process.env.EXPO_PUBLIC_ENABLE_APPLE_AUTH === 'true';

type Mode = 'login' | 'signup';
type FocusedField = 'email' | 'password' | null;

function AuthScreen() {
  const router = useRouter();
  const { session, isAuthReady, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, requestPasswordReset } = useAuth();
  const callbackUrl = Linking.useLinkingURL();
  const confirmationOperation = useRef<{ url: string; promise: Promise<boolean> } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const resendAfter = useRef(0);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = useMemo<boolean>(() => {
    const passwordIsValid = mode === 'login' ? password.length > 0 : password.length >= 8;
    return email.trim().length > 3 && passwordIsValid && !loading && !confirming;
  }, [email, loading, mode, password, confirming]);

  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthReady || !callbackUrl) return;
    if (confirmationOperation.current?.url !== callbackUrl) {
      confirmationOperation.current = { url: callbackUrl, promise: completeEmailConfirmation(getSupabase().auth, callbackUrl) };
    }
    let active = true;
    setConfirming(true);
    confirmationOperation.current.promise.catch(() => {
      if (active) Alert.alert('Nem sikerült megerősíteni az e-mail címet', 'A link lejárt, vagy másik eszközön indult a regisztráció. Kérj új megerősítő e-mailt, és nyisd meg ezen a telefonon.');
    }).finally(() => { if (active) setConfirming(false); });
    return () => { active = false; };
  }, [callbackUrl, isAuthReady]);

  useEffect(() => {
    if (!session || confirming) return;
    router.replace('/(tabs)/home');
  }, [router, session, confirming]);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const normalizedEmail = email.trim();
      if (mode === 'login') {
        await signInWithEmail(normalizedEmail, password);
      } else {
        // Ha a megerősítés kikapcsolt, a regisztráció azonnal session-t ad — nincs külön bejelentkezés.
        const signedIn = await signUpWithEmail(normalizedEmail, password);
        if (!signedIn) {
          Alert.alert(
            'Erősítsd meg az e-mail címed',
            'Elküldtük a megerősítő linket. Nyisd meg az e-mailt, majd jelentkezz be.'
          );
          setMode('login');
        }
      }
    } catch {
      // AuthContext already presents the localized error to the user.
    } finally {
      setLoading(false);
    }
  }, [canSubmit, email, mode, password, signInWithEmail, signUpWithEmail]);

  const onForgotPassword = useCallback(async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail.includes('@')) {
      Alert.alert('Add meg az e-mail címed', 'Írd be a regisztrációhoz használt e-mail címet.');
      emailRef.current?.focus();
      return;
    }
    if (loading || confirming) return;
    setLoading(true);
    try {
      await requestPasswordReset(normalizedEmail);
      Alert.alert('E-mail elküldve', 'A jelszó módosításához nyisd meg az e-mailben kapott linket.');
    } catch {
      // AuthContext already presents the localized error to the user.
    } finally {
      setLoading(false);
    }
  }, [email, loading, confirming, requestPasswordReset]);

  const onGoogle = useCallback(async () => {
    if (loading || confirming) return;
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // AuthContext already presents the localized error to the user.
    } finally {
      setLoading(false);
    }
  }, [loading, confirming, signInWithGoogle]);

  const onApple = useCallback(async () => {
    if (loading || confirming) return;
    setLoading(true);
    try {
      await signInWithApple();
    } catch {
      // AuthContext already presents the localized error to the user.
    } finally {
      setLoading(false);
    }
  }, [loading, confirming, signInWithApple]);

  const onResendConfirmation = useCallback(async () => {
    if (loading || confirming) return;
    if (!email.trim().includes('@')) {
      Alert.alert('Add meg az e-mail címed', 'Írd be a regisztrációhoz használt e-mail címet.');
      emailRef.current?.focus();
      return;
    }
    if (Date.now() < resendAfter.current) {
      Alert.alert('Kérlek, várj egy kicsit', 'Egy percen belül csak egyszer kérhetsz új megerősítő levelet.');
      return;
    }
    setLoading(true);
    try {
      const emailRedirectTo = Platform.OS === 'web'
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth`
        : Linking.createURL('auth');
      const { error } = await getSupabase().auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo } });
      if (error) throw error;
      resendAfter.current = Date.now() + 60_000;
      Alert.alert('Ellenőrizd a postaládádat', 'Ha a fiókod megerősítésre vár, elküldtük az új linket. Nyisd meg ezen a telefonon. Nézd meg a levélszemét mappát is.');
    } catch {
      Alert.alert('Nem sikerült elküldeni a levelet', 'Ellenőrizd az internetkapcsolatot, majd egy perc múlva próbáld újra.');
    } finally { setLoading(false); }
  }, [email, loading, confirming]);

  const switchMode = useCallback(() => {
    setMode((previousMode) => (previousMode === 'login' ? 'signup' : 'login'));
  }, []);

  const focusEmail = useCallback(() => setFocusedField('email'), []);
  const focusPassword = useCallback(() => setFocusedField('password'), []);
  const clearFocus = useCallback(() => setFocusedField(null), []);
  const togglePasswordVisibility = useCallback(() => setShowPassword((isVisible) => !isVisible), []);

  const primaryLabel = confirming ? 'E-mail megerősítése…' : mode === 'login' ? 'Bejelentkezés' : 'Regisztráció';
  const secondaryLabel = mode === 'login' ? 'Regisztráció' : 'Bejelentkezés';
  const showAppleAuth = Platform.OS === 'ios' && ENABLE_APPLE_AUTH;
  const showSocialAuth = showAppleAuth || ENABLE_GOOGLE_AUTH;

  return (
    <View style={styles.root} testID="auth-root">
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <Image
        source={BG_SOURCE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={300}
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(0, 0, 0, 0.38)',
          'rgba(0, 0, 0, 0.20)',
          'rgba(0, 0, 0, 0.48)',
          'rgba(0, 0, 0, 0.84)',
        ]}
        locations={[0, 0.28, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.staticContent}>
            <View style={styles.logoBlock}>
              <Image
                source={LOGO_SOURCE}
                style={styles.logo}
                contentFit="contain"
                contentPosition="center"
                cachePolicy="memory-disk"
                accessibilityLabel="Come Get It"
                testID="auth-logo"
              />
            </View>

            <View style={styles.content}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heading}>{mode === 'login' ? 'Üdv újra!' : 'Csatlakozz!'}</Text>
                <Text style={styles.subheading}>
                  Fedezd fel a partnerhelyeket és az aktuális ajánlatokat.
                </Text>
              </View>

              <BlurView intensity={26} tint="dark" style={styles.glassCard}>
              <View style={styles.formBlock}>
                <TextInputField
                  ref={emailRef}
                  testID="auth-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="E-mail cím"
                  autoFocus
                  leftIcon={<Mail size={17} color={focusedField === 'email' ? CYAN : TEXT_SOFT} />}
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
                  leftIcon={<LockKeyhole size={17} color={focusedField === 'password' ? CYAN : TEXT_SOFT} />}
                  rightIcon={
                    showPassword ? (
                      <EyeOff size={17} color={TEXT_SOFT} />
                    ) : (
                      <Eye size={17} color={TEXT_SOFT} />
                    )
                  }
                  onRightIconPress={togglePasswordVisibility}
                  focused={focusedField === 'password'}
                  onFocus={focusPassword}
                  onBlur={clearFocus}
                  secureTextEntry={!showPassword}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  textContentType={mode === 'login' ? 'password' : 'newPassword'}
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />

                <Pressable hitSlop={10} style={styles.forgotButton} onPress={onForgotPassword} disabled={loading || confirming}>
                  <Text style={styles.forgotText}>Elfelejtetted a jelszavad?</Text>
                </Pressable>
                {mode === 'login' ? (
                  <Pressable accessibilityRole="button" style={styles.forgotButton} onPress={onResendConfirmation} disabled={loading || confirming}>
                    <Text style={styles.forgotText}>Megerősítő e-mail újraküldése</Text>
                  </Pressable>
                ) : null}
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
                  disabled={loading || confirming}
                />
              </View>
              </BlurView>

              {showSocialAuth ? (
                <>
                  <View style={styles.dividerBlock}>
                    <AuthDivider />
                  </View>

                  <View style={styles.socialBlock}>
                    {showAppleAuth ? (
                      <SocialButton
                        testID="auth-apple"
                        icon={<Apple size={19} color="#FFFFFF" />}
                        label="Folytatás az Apple-lel"
                        onPress={onApple}
                        disabled={loading}
                      />
                    ) : null}
                    {ENABLE_GOOGLE_AUTH ? (
                      <SocialButton
                        testID="auth-google"
                        icon={<Chrome size={19} color="#00C8E8" />}
                        label="Folytatás a Google-lel"
                        onPress={onGoogle}
                        disabled={loading}
                      />
                    ) : null}
                  </View>
                </>
              ) : null}

              <View style={styles.legalBlock}>
                <AuthLegalText />
              </View>
            </View>
          </View>
          </TouchableWithoutFeedback>
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
  staticContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoBlock: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 2,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  logo: {
    width: 285,
    height: 126,
    alignSelf: 'center',
  },
  heroTextBlock: {
    alignItems: 'center',
    marginBottom: 10,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800' as const,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  subheading: {
    color: TEXT_MUTED,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 280,
    fontWeight: '500' as const,
  },
  glassCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(10, 16, 24, 0.38)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  formBlock: {
    width: '100%',
    gap: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 0,
    marginBottom: 2,
  },
  forgotText: {
    color: CYAN,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
  actionsBlock: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  dividerBlock: {
    width: '100%',
    marginTop: 10,
    marginBottom: 8,
  },
  socialBlock: {
    width: '100%',
    gap: 7,
  },
  legalBlock: {
    marginTop: 8,
    alignItems: 'center',
  },
});
