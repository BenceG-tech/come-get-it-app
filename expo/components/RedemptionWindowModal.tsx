import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Heart,
  MapPin,
  Smartphone,
  Waves,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLocation } from '@/context/LocationContext';
import { VenueDrink, FreeDrinkWindow } from '@/types/venue';
import {
  checkLocalEligibility,
  confirmRedemption,
  createRedemptionWindow,
  formatTimeRemaining,
  generateMockRedemptionWindow,
  getDayLabel,
  getTimeRemainingMs,
  RedemptionWindow,
} from '@/lib/redemptionService';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type RedemptionWindowModalProps = {
  visible: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  venueCoordinates?: Coordinates | null;
  drink: VenueDrink | null;
  freeDrinkWindows: FreeDrinkWindow[];
};

type FlowState =
  | 'step1_arrive'
  | 'step2_show'
  | 'checking'
  | 'countdown'
  | 'confirming'
  | 'success'
  | 'not_eligible'
  | 'expired'
  | 'error';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const MAX_DISTANCE_METERS = 100;
const WINDOW_SECONDS = 120;
const CYAN = '#00C8E8' as const;

const RING_SIZE = 156;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STEP_LABELS = ['Érkezés', 'Mutasd', 'Beváltás'] as const;

/** Schedules a local "Egészségedre!" notification a few seconds after a successful redemption. */
async function scheduleCheersNotification(drinkName: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) {
      console.log('[RedemptionWindowModal] Notification permission not granted, skipping cheers notification');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Egészségedre! 🍻',
        body: `Élvezd az italod: ${drinkName}. Fogyaszd felelősségteljesen!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 4,
      },
    });
    console.log('[RedemptionWindowModal] Cheers notification scheduled');
  } catch (error) {
    console.log('[RedemptionWindowModal] Failed to schedule cheers notification', error);
  }
}

function distanceMeters(a: Coordinates, b: Coordinates): number {
  const radius = 6371e3;
  const phi1 = (a.latitude * Math.PI) / 180;
  const phi2 = (b.latitude * Math.PI) / 180;
  const deltaPhi = ((b.latitude - a.latitude) * Math.PI) / 180;
  const deltaLambda = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getFriendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('distance') || lower.includes('gps') || lower.includes('location') || lower.includes('too_far')) {
    return 'Túl messze vagy a helytől. A beváltáshoz 100 méteren belül kell lenned.';
  }
  if (lower.includes('window') || lower.includes('active')) {
    return 'Most nincs aktív ingyen ital idősáv ezen a helyen.';
  }
  if (lower.includes('drink')) {
    return 'Ehhez a helyhez még nincs ingyen ital beállítva.';
  }
  return message;
}

export default function RedemptionWindowModal({
  visible,
  onClose,
  venueId,
  venueName,
  venueCoordinates,
  drink,
  freeDrinkWindows,
}: RedemptionWindowModalProps) {
  const queryClient = useQueryClient();
  const { getCurrentLocation } = useLocation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [state, setState] = useState<FlowState>('step1_arrive');
  const isCompactImageState = state === 'countdown' || state === 'success';
  const imageHeight = isCompactImageState
    ? Math.max(140, Math.round(screenHeight * 0.18))
    : Math.max(200, Math.round(screenHeight * 0.28));
  const [windowToken, setWindowToken] = useState<RedemptionWindow | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(WINDOW_SECONDS * 1000);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [distance, setDistance] = useState<number | null>(null);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [impactMessage, setImpactMessage] = useState<string>('+1 ember kap ma tiszta vizet');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;
  const phoneShake = useRef(new Animated.Value(0)).current;
  const phoneScale = useRef(new Animated.Value(1)).current;
  const waterScale = useRef(new Animated.Value(0.7)).current;
  const waterOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringProgress = useRef(new Animated.Value(1)).current;
  const haloScale = useRef(new Animated.Value(0.4)).current;

  const selectedDrinkName = drink?.drinkName ?? 'Ingyen ital';
  const drinkImageUrl = drink?.imageUrl ?? null;

  const localEligibility = useMemo(
    () => (drink ? checkLocalEligibility(freeDrinkWindows, drink.id) : null),
    [drink, freeDrinkWindows]
  );

  const alwaysAvailable = localEligibility?.alwaysAvailable === true;

  const nextWindowText = useMemo(() => {
    if (!localEligibility || localEligibility.eligible || !localEligibility.nextWindow) return null;
    return `${getDayLabel(localEligibility.nextWindow.day)} ${localEligibility.nextWindow.start}-${localEligibility.nextWindow.end}`;
  }, [localEligibility]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopAnimations = useCallback(() => {
    pulseScale.stopAnimation();
    pulseOpacity.stopAnimation();
    phoneShake.stopAnimation();
    phoneScale.stopAnimation();
  }, [pulseScale, pulseOpacity, phoneShake, phoneScale]);

  const reset = useCallback(() => {
    clearTimer();
    stopAnimations();
    setState('step1_arrive');
    setWindowToken(null);
    setTimeRemaining(WINDOW_SECONDS * 1000);
    setErrorMessage('');
    setDistance(null);
    setLocationWarning(null);
    setImpactMessage('+1 ember kap ma tiszta vizet');
    waterScale.setValue(0.7);
    waterOpacity.setValue(0);
    fadeAnim.setValue(0);
    ringProgress.stopAnimation();
    ringProgress.setValue(1);
    haloScale.setValue(0.4);
  }, [clearTimer, stopAnimations, waterOpacity, waterScale, fadeAnim, ringProgress, haloScale]);

  useEffect(() => {
    if (!visible) {
      reset();
      return;
    }
    // Fresh start on every open — the state may already be 'step1_arrive',
    // so the state-based fade effect would not re-run and the content would
    // stay invisible (opacity 0). Reset and animate explicitly.
    reset();
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [reset, visible, fadeAnim]);

  // Pulsing location icon animation for step 1
  useEffect(() => {
    if (state !== 'step1_arrive') return;
    pulseScale.setValue(1);
    pulseOpacity.setValue(0.4);
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.35, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.85, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulseScale, pulseOpacity]);

  // Animated phone icon for step 2 — gentle wobble + scale pulse
  useEffect(() => {
    if (state !== 'step2_show') return;
    phoneShake.setValue(0);
    phoneScale.setValue(1);
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(phoneShake, { toValue: 0.08, duration: 600, useNativeDriver: true }),
          Animated.timing(phoneShake, { toValue: -0.08, duration: 600, useNativeDriver: true }),
          Animated.timing(phoneShake, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(phoneScale, { toValue: 1.08, duration: 700, useNativeDriver: true }),
          Animated.timing(phoneScale, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [state, phoneShake, phoneScale]);

  // Fade-in for step transitions
  useEffect(() => {
    if (state === 'step1_arrive' || state === 'step2_show' || state === 'countdown' || state === 'success') {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [state, fadeAnim]);

  // Success animation
  useEffect(() => {
    if (state !== 'success') return;
    haloScale.setValue(0.4);
    Animated.parallel([
      Animated.spring(haloScale, { toValue: 1, useNativeDriver: true, damping: 7, stiffness: 120 }),
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.spring(waterScale, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 90 }),
          Animated.timing(waterOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [state, waterOpacity, waterScale, haloScale]);

  const startCountdown = useCallback(
    (expiresAt: string) => {
      clearTimer();
      const totalMs = WINDOW_SECONDS * 1000;
      const remainingMs = getTimeRemainingMs(expiresAt);
      ringProgress.setValue(Math.min(1, Math.max(0, remainingMs / totalMs)));
      Animated.timing(ringProgress, {
        toValue: 0,
        duration: remainingMs,
        useNativeDriver: false,
      }).start();
      const tick = () => {
        const remaining = getTimeRemainingMs(expiresAt);
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          clearTimer();
          setState('expired');
          setWindowToken(null);
        }
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    },
    [clearTimer, ringProgress]
  );

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const goToStep2 = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState('step2_show');
  }, []);

  const handleCreateWindow = useCallback(async () => {
    if (!drink) {
      setErrorMessage('Ehhez a helyhez még nincs ingyen ital beállítva.');
      setState('not_eligible');
      return;
    }

    setState('checking');
    setErrorMessage('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let userCoordinates: Coordinates | null = null;
      setLocationWarning(null);

      if (!DEMO_MODE) {
        if (!venueCoordinates) {
          // Flexible: missing venue coordinates should not block the flow.
          console.log('[RedemptionWindowModal] Venue coordinates missing — proceeding without proximity check');
          setLocationWarning('A hely koordinátája hiányzik, a közelséged most nem ellenőrizhető.');
        } else {
          const current = await getCurrentLocation().catch(() => null);
          if (!current?.coords) {
            // Flexible: location fetch failure should not block the flow.
            console.log('[RedemptionWindowModal] Location unavailable — proceeding without proximity check');
            setLocationWarning('A helyzeted most nem ellenőrizhető, de folytathatod a beváltást.');
          } else {
            userCoordinates = { latitude: current.coords.latitude, longitude: current.coords.longitude };
            const measured = distanceMeters(userCoordinates, venueCoordinates);
            setDistance(measured);
            if (measured > MAX_DISTANCE_METERS) {
              setErrorMessage(`Most kb. ${Math.round(measured)} méterre vagy. A beváltáshoz 100 méteren belül kell lenned.`);
              setState('not_eligible');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              return;
            }
          }
        }
      }

      const localEligibility = checkLocalEligibility(freeDrinkWindows, drink.id);
      if (!DEMO_MODE && !localEligibility.eligible) {
        setErrorMessage('Most nincs aktív ingyen ital idősáv ezen a helyen.');
        setState('not_eligible');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      const response = await createRedemptionWindow({
        venue_id: venueId,
        drink_id: drink.id,
        user_latitude: userCoordinates?.latitude ?? null,
        user_longitude: userCoordinates?.longitude ?? null,
        demo_mode: DEMO_MODE,
      });

      if (response.success) {
        setWindowToken(response.data);
        setState('countdown');
        startCountdown(response.data.expires_at);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      if (DEMO_MODE) {
        const mockWindow = generateMockRedemptionWindow(venueId, drink.id);
        setWindowToken(mockWindow);
        setState('countdown');
        startCountdown(mockWindow.expires_at);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      setErrorMessage(getFriendlyError(response.error.error));
      setState(response.error.code === 'EXPIRED' ? 'expired' : 'error');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.error('[RedemptionWindowModal] Failed to create window', error);
      if (DEMO_MODE) {
        const mockWindow = generateMockRedemptionWindow(venueId, drink.id);
        setWindowToken(mockWindow);
        setState('countdown');
        startCountdown(mockWindow.expires_at);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      setErrorMessage('Átmeneti hálózati hiba történt. Próbáld újra.');
      setState('error');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [drink, freeDrinkWindows, getCurrentLocation, startCountdown, venueCoordinates, venueId]);

  const handleConfirm = useCallback(async () => {
    if (!windowToken) return;
    clearTimer();
    setState('confirming');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (DEMO_MODE && windowToken.demo_mode) {
      setImpactMessage('+1 ember kap ma tiszta vizet');
      setState('success');
      queryClient.invalidateQueries({ queryKey: ['csr-impact'] });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scheduleCheersNotification(selectedDrinkName);
      return;
    }

    const response = await confirmRedemption(
      windowToken.token,
      windowToken.fallback_mode
        ? { venue_id: venueId, drink_id: drink?.id ?? null, drink_name: selectedDrinkName }
        : undefined
    );
    if (response.success) {
      setImpactMessage(response.data.impact_message || '+1 ember kap ma tiszta vizet');
      setState('success');
      queryClient.invalidateQueries({ queryKey: ['csr-impact'] });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scheduleCheersNotification(selectedDrinkName);
      return;
    }

    if (DEMO_MODE) {
      setImpactMessage('+1 ember kap ma tiszta vizet');
      setState('success');
      queryClient.invalidateQueries({ queryKey: ['csr-impact'] });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scheduleCheersNotification(selectedDrinkName);
      return;
    }

    setErrorMessage(getFriendlyError(response.error.error));
    setState(response.error.code === 'EXPIRED' ? 'expired' : 'error');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [clearTimer, queryClient, windowToken, selectedDrinkName, venueId, drink]);

  const renderDrinkImage = () => (
    <View style={[styles.drinkImageSection, { height: imageHeight }]}>
      {drinkImageUrl ? (
        <Image source={{ uri: drinkImageUrl }} style={styles.drinkImage} resizeMode="cover" />
      ) : (
        <View style={[styles.drinkImage, styles.drinkImageFallback]}>
          <Text style={styles.drinkImageEmoji}>🍺</Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(7,16,20,0.55)', '#071014']}
        style={styles.drinkImageGradient}
        pointerEvents="none"
      />
      <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
        <X size={22} color={Colors.dark.text} />
      </TouchableOpacity>
      <View style={styles.drinkNameChip}>
        <Text style={styles.drinkNameChipText}>{selectedDrinkName}</Text>
      </View>
      {alwaysAvailable && (
        <View style={styles.anytimeChip}>
          <Clock3 size={12} color="#001014" />
          <Text style={styles.anytimeChipText}>Bármikor</Text>
        </View>
      )}
    </View>
  );

  const renderStepIndicator = (currentStep: 1 | 2 | 3) => {
    const steps = [1, 2, 3];
    return (
      <View style={styles.stepIndicatorRow}>
        {steps.map((s, idx) => (
          <View key={s} style={styles.stepIndicatorItem}>
            <View style={styles.stepColumn}>
              <View style={[styles.stepDot, s <= currentStep && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, s <= currentStep && styles.stepDotTextActive]}>{s}</Text>
              </View>
              <Text style={[styles.stepLabel, s <= currentStep && styles.stepLabelActive]}>{STEP_LABELS[s - 1]}</Text>
            </View>
            {idx < steps.length - 1 && <View style={[styles.stepConnector, s < currentStep && styles.stepConnectorActive]} />}
          </View>
        ))}
      </View>
    );
  };

  const renderBody = () => {
    if (state === 'checking' || state === 'confirming') {
      return (
        <View style={styles.body}>
          {renderDrinkImage()}
          <View style={styles.bodyContent}>
            <ActivityIndicator size="large" color={CYAN} />
            <Text style={styles.loadingTitle}>{state === 'checking' ? 'Beváltási ablak nyitása...' : 'Beváltás rögzítése...'}</Text>
            <Text style={styles.helperText}>Egy pillanat, ellenőrizzük az ingyen ital jogosultságot.</Text>
          </View>
        </View>
      );
    }

    if (state === 'countdown') {
      const lowTime = timeRemaining <= 30_000;
      const ringColor = lowTime ? '#FF6B6B' : CYAN;
      return (
        <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
          {renderDrinkImage()}
          <View style={styles.countdownContent}>
            <View style={styles.countdownTop}>
              {renderStepIndicator(3)}
              <View style={styles.readyBadge}>
                <CheckCircle2 size={15} color="#001014" />
                <Text style={styles.readyBadgeText}>Ablak megnyitva — mutasd a pultosnak</Text>
              </View>
              {windowToken?.fallback_mode && (
                <View style={styles.fallbackChip} testID="fallback-mode-chip">
                  <AlertCircle size={12} color="#FFB020" />
                  <Text style={styles.fallbackChipText}>Teszt mód — a szerveroldali rögzítés még nincs telepítve</Text>
                </View>
              )}
              {locationWarning && (
                <Text style={styles.locationWarningText}>{locationWarning}</Text>
              )}
            </View>

            <View style={styles.countdownMiddle}>
              <View style={[styles.timerWrap, styles.timerGlow, lowTime && styles.timerGlowWarning]}>
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.timerSvg}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={ringColor}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={ringProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [RING_CIRCUMFERENCE, 0],
                  })}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              </Svg>
                <View style={styles.timerInner} pointerEvents="none">
                  <Clock3 size={20} color={ringColor} />
                  <Text style={[styles.timerValue, lowTime && styles.timerValueWarning]}>{formatTimeRemaining(timeRemaining)}</Text>
                  <Text style={styles.timerLabel}>maradt</Text>
                </View>
              </View>

              <Text style={styles.drinkName}>{selectedDrinkName}</Text>
              <Text style={styles.venueName}>{venueName}</Text>
            </View>

            <View style={styles.countdownBottom}>
              <Text style={styles.confirmHint}>A pultos a te telefonodon nyomja meg a gombot.</Text>
              <Pressable
                onPress={handleConfirm}
                testID="redeem-now-button"
                accessibilityRole="button"
                accessibilityLabel="Beváltom"
                style={({ pressed }) => [styles.redeemButtonWrap, pressed && styles.redeemButtonPressed]}
              >
                <LinearGradient
                  colors={lowTime ? ['#FF8A7A', '#E8443A'] : ['#00E0FF', '#0090B8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.redeemButtonGradient}
                >
                  <Text style={styles.redeemButtonText}>BEVÁLTOM</Text>
                </LinearGradient>
              </Pressable>

              {DEMO_MODE && (
                <TouchableOpacity style={styles.demoConfirmButton} onPress={handleConfirm} testID="demo-staff-confirm-button" activeOpacity={0.82}>
                  <Text style={styles.demoConfirmText}>DEMO: Pultos confirmed</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      );
    }

    if (state === 'success') {
      return (
        <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
          {renderDrinkImage()}
          <View style={styles.bodyContent}>
            <Animated.View style={[styles.successHalo, { transform: [{ scale: haloScale }] }]}>
              <Text style={styles.cheersEmoji}>🍻</Text>
            </Animated.View>
            <Text style={styles.successTitle}>Egészségedre!</Text>
            <Text style={styles.successDrinkName}>{selectedDrinkName}</Text>
            <Text style={styles.successSubtitle}>sikeresen beváltva</Text>
            {windowToken?.fallback_mode && (
              <View style={styles.fallbackChip} testID="fallback-mode-chip-success">
                <AlertCircle size={12} color="#FFB020" />
                <Text style={styles.fallbackChipText}>Teszt mód — a szerveroldali rögzítés még nincs telepítve</Text>
              </View>
            )}

            <Animated.View style={[styles.impactCard, { opacity: waterOpacity, transform: [{ scale: waterScale }] }]}>
              <View style={styles.waveIcon}>
                <Waves size={26} color="#041015" />
              </View>
              <Text style={styles.impactPlus}>+1</Text>
              <Text style={styles.impactText}>{impactMessage.replace(/^\+1\s*/, '')}</Text>
            </Animated.View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => {
                  handleClose();
                  router.push('/my-impact');
                }}
                activeOpacity={0.84}
              >
                <Heart size={18} color={CYAN} />
                <Text style={styles.secondaryActionText}>Hatásom megtekintése</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryAction} onPress={handleClose} activeOpacity={0.84}>
                <Text style={styles.primaryActionText}>Bezárás</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      );
    }

    if (state === 'not_eligible' || state === 'error' || state === 'expired') {
      return (
        <View style={styles.body}>
          {renderDrinkImage()}
          <View style={styles.bodyContent}>
            <View style={styles.errorIcon}>
              <AlertCircle size={40} color={state === 'expired' ? '#FFB020' : '#FF6B6B'} />
            </View>
            <Text style={styles.errorTitle}>{state === 'expired' ? 'Lejárt az ablak' : 'Most nem indítható'}</Text>
            <Text style={styles.errorText}>
              {state === 'expired'
                ? 'A 120 másodperces beváltási ablak lejárt. Kérj újat a folytatáshoz.'
                : errorMessage || 'Valami hiba történt. Próbáld újra.'}
            </Text>
            {nextWindowText && state === 'not_eligible' && (
              <Text style={styles.nextWindowText}>Következő idősáv: {nextWindowText}</Text>
            )}
            {distance !== null && <Text style={styles.nextWindowText}>Mért távolság: {Math.round(distance)} m</Text>}
            <TouchableOpacity style={styles.primaryAction} onPress={handleCreateWindow} activeOpacity={0.84}>
              <Text style={styles.primaryActionText}>Újrapróbálás</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostAction} onPress={handleClose} activeOpacity={0.84}>
              <Text style={styles.ghostActionText}>Vissza</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Step 2: Mutasd a pultosnak
    if (state === 'step2_show') {
      return (
        <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
          {renderDrinkImage()}
          <View style={styles.bodyContent}>
            {renderStepIndicator(2)}
            <Animated.View
              style={[
                styles.phoneIconWrap,
                {
                  transform: [
                    { rotate: phoneShake.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] }) },
                    { scale: phoneScale },
                  ],
                },
              ]}
            >
              <Smartphone size={44} color={CYAN} strokeWidth={1.6} />
            </Animated.View>
            <Text style={styles.stepTitle}>Mutasd a következő oldalt a pultosnak</Text>
            <Text style={styles.stepSubtitle}>Tartsd a képernyőt a pultosnak — ő nyitja meg a beváltási ablakot.</Text>

            <View style={styles.stepButtons}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setState('step1_arrive')} activeOpacity={0.84}>
                <ArrowLeft size={17} color="rgba(255,255,255,0.6)" />
                <Text style={styles.backBtnText}>Vissza</Text>
              </TouchableOpacity>
              <Pressable
                onPress={handleCreateWindow}
                testID="start-redemption-window-button"
                accessibilityRole="button"
                accessibilityLabel="Mutat"
                style={({ pressed }) => [styles.primaryStepButton, pressed && styles.primaryStepButtonPressed]}
              >
                <Text style={styles.primaryStepButtonText}>Mutat</Text>
              </Pressable>
            </View>
            <Text style={styles.responsibleText}>18+ • Fogyaszt felelősségteljesen</Text>
          </View>
        </Animated.View>
      );
    }

    // Step 1: Legyél a vendéglátóhelyen (default)
    return (
      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        {renderDrinkImage()}
        <View style={styles.bodyContent}>
          {renderStepIndicator(1)}
          <Animated.View style={[styles.pulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
          <View style={styles.locationIconWrap}>
            <MapPin size={38} color={CYAN} strokeWidth={1.6} />
          </View>
          <Text style={styles.stepTitle}>Legyél a vendéglátóhelyen</Text>
          <Text style={styles.stepSubtitle}>
            Látogass el a partnerhelyre, hogy igényelhesd az ingyen italodat. {DEMO_MODE ? '(Demo mód aktív)' : '100 méteren belül kell lenned.'}
          </Text>
          {alwaysAvailable && (
            <Text style={styles.anytimeNote}>Ehhez az italhoz nincs időkorlát — bármikor beváltható.</Text>
          )}

          <View style={styles.stepButtons}>
            <TouchableOpacity style={styles.backBtn} onPress={handleClose} activeOpacity={0.84}>
              <Text style={styles.backBtnText}>Mégsem</Text>
            </TouchableOpacity>
            <Pressable
              onPress={goToStep2}
              testID="im-here-button"
              accessibilityRole="button"
              accessibilityLabel="Itt vagyok"
              style={({ pressed }) => [styles.primaryStepButton, pressed && styles.primaryStepButtonPressed]}
            >
              <Text style={styles.primaryStepButtonText}>Itt vagyok</Text>
            </Pressable>
          </View>
          <Text style={styles.responsibleText}>18+ • Fogyaszt felelősségteljesen</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { width: Math.min(screenWidth, 440) }]}>{renderBody()}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    height: '92%',
    borderRadius: 28,
    backgroundColor: '#071014',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 232, 0.22)',
    overflow: 'hidden',
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 18,
  },
  body: {
    flex: 1,
  },
  drinkImageSection: {
    width: '100%',
    backgroundColor: '#050709',
    position: 'relative',
  },
  drinkImage: {
    width: '100%',
    height: '100%',
  },
  drinkImageFallback: {
    backgroundColor: 'rgba(0, 200, 232, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drinkImageEmoji: {
    fontSize: 56,
  },
  drinkImageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
  },
  anytimeChip: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: CYAN,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  anytimeChipText: {
    color: '#001014',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  fallbackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,176,32,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.3)',
    marginTop: 2,
    marginBottom: 6,
    maxWidth: 320,
  },
  fallbackChipText: {
    color: '#FFB020',
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  locationWarningText: {
    color: '#FFB020',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -14,
    marginBottom: 14,
    maxWidth: 300,
  },
  anytimeNote: {
    color: CYAN,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  drinkNameChip: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 232, 0.3)',
  },
  drinkNameChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bodyContent: {
    flex: 1,
    padding: 24,
    paddingTop: 22,
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 0,
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepColumn: {
    alignItems: 'center',
    gap: 4,
    width: 62,
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stepLabelActive: {
    color: CYAN,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: CYAN,
    borderColor: CYAN,
  },
  stepDotText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '900',
  },
  stepDotTextActive: {
    color: '#001014',
  },
  stepConnector: {
    width: 22,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 12,
    marginHorizontal: -8,
  },
  stepConnectorActive: {
    backgroundColor: CYAN,
  },
  pulseRing: {
    position: 'absolute',
    top: 80,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: CYAN,
  },
  locationIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0, 200, 232, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 232, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  phoneIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0, 200, 232, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 232, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stepTitle: {
    color: Colors.dark.text,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 9,
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
    maxWidth: 300,
  },
  stepButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 340,
  },
  backBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryStepButton: {
    flex: 1.4,
    height: 52,
    borderRadius: 16,
    backgroundColor: CYAN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CYAN,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryStepButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
  primaryStepButtonText: {
    color: '#001014',
    fontSize: 16,
    fontWeight: '900',
  },
  responsibleText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 16,
  },
  loadingTitle: {
    color: Colors.dark.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
  },
  helperText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: CYAN,
    marginBottom: 10,
    shadowColor: CYAN,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  readyBadgeText: {
    color: '#001014',
    fontSize: 12,
    fontWeight: '900',
  },
  countdownContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
    alignItems: 'center',
  },
  countdownTop: {
    alignItems: 'center',
    width: '100%',
  },
  countdownMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  countdownBottom: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    alignSelf: 'center',
  },
  confirmHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  timerWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  timerGlow: {
    borderRadius: RING_SIZE / 2,
    shadowColor: CYAN,
    shadowOpacity: 0.45,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    backgroundColor: 'rgba(0, 200, 232, 0.04)',
  },
  timerGlowWarning: {
    shadowColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  timerSvg: {
    position: 'absolute',
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerValue: {
    color: Colors.dark.text,
    fontSize: 36,
    fontWeight: '900',
    marginTop: 6,
  },
  timerValueWarning: {
    color: '#FF6B6B',
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  drinkName: {
    color: CYAN,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  venueName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  redeemButtonWrap: {
    width: '100%',
    borderRadius: 24,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  redeemButtonGradient: {
    width: '100%',
    minHeight: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  redeemButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  redeemButtonText: {
    color: '#001014',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  demoConfirmButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  demoConfirmText: {
    color: CYAN,
    fontSize: 13,
    fontWeight: '800',
  },
  successHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cheersEmoji: {
    fontSize: 46,
  },
  successTitle: {
    color: Colors.dark.text,
    fontSize: 29,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 5,
  },
  successDrinkName: {
    color: CYAN,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 2,
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  impactCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(0, 200, 232, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 232, 0.35)',
    alignItems: 'center',
    marginBottom: 18,
  },
  waveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CYAN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  impactPlus: {
    color: CYAN,
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 44,
  },
  impactText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  successActions: {
    width: '100%',
    maxWidth: 340,
    gap: 9,
  },
  secondaryAction: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 232, 0.3)',
    backgroundColor: 'rgba(0, 200, 232, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: CYAN,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryAction: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: CYAN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
    width: '100%',
    maxWidth: 340,
  },
  primaryActionText: {
    color: '#001014',
    fontSize: 15,
    fontWeight: '900',
  },
  errorIcon: {
    marginBottom: 14,
  },
  errorTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 9,
  },
  errorText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 14,
  },
  nextWindowText: {
    color: CYAN,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  ghostAction: {
    paddingVertical: 13,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  ghostActionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '700',
  },
});
