import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AlertCircle, CheckCircle2, Clock3, Heart, MapPin, Waves, X } from 'lucide-react-native';
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

type FlowState = 'intro' | 'checking' | 'countdown' | 'confirming' | 'success' | 'not_eligible' | 'expired' | 'error';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const MAX_DISTANCE_METERS = 100;
const WINDOW_SECONDS = 120;

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
  const [state, setState] = useState<FlowState>('intro');
  const [windowToken, setWindowToken] = useState<RedemptionWindow | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(WINDOW_SECONDS * 1000);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [distance, setDistance] = useState<number | null>(null);
  const [impactMessage, setImpactMessage] = useState<string>('+1 ember kap ma tiszta vizet');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waterScale = useRef(new Animated.Value(0.7)).current;
  const waterOpacity = useRef(new Animated.Value(0)).current;

  const selectedDrinkName = drink?.drinkName ?? 'Ingyen ital';

  const nextWindowText = useMemo(() => {
    if (!drink) return null;
    const local = checkLocalEligibility(freeDrinkWindows, drink.id);
    if (local.eligible || !local.nextWindow) return null;
    return `${getDayLabel(local.nextWindow.day)} ${local.nextWindow.start}-${local.nextWindow.end}`;
  }, [drink, freeDrinkWindows]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setState('intro');
    setWindowToken(null);
    setTimeRemaining(WINDOW_SECONDS * 1000);
    setErrorMessage('');
    setDistance(null);
    setImpactMessage('+1 ember kap ma tiszta vizet');
    waterScale.setValue(0.7);
    waterOpacity.setValue(0);
  }, [clearTimer, waterOpacity, waterScale]);

  useEffect(() => {
    if (!visible) reset();
  }, [reset, visible]);

  useEffect(() => {
    if (state !== 'success') return;
    Animated.parallel([
      Animated.spring(waterScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 9,
        stiffness: 90,
      }),
      Animated.timing(waterOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [state, waterOpacity, waterScale]);

  const startCountdown = useCallback((expiresAt: string) => {
    clearTimer();

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
  }, [clearTimer]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

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

      if (!DEMO_MODE) {
        if (!venueCoordinates) {
          setErrorMessage('A hely koordinátája hiányzik, ezért most nem tudjuk ellenőrizni a közelségedet.');
          setState('error');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }

        const current = await getCurrentLocation();
        if (!current?.coords) {
          setErrorMessage('Nem sikerült lekérni a helyzetedet. Engedélyezd a helymeghatározást és próbáld újra.');
          setState('error');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }

        userCoordinates = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };

        const measured = distanceMeters(userCoordinates, venueCoordinates);
        setDistance(measured);
        if (measured > MAX_DISTANCE_METERS) {
          setErrorMessage(`Most kb. ${Math.round(measured)} méterre vagy. A beváltáshoz 100 méteren belül kell lenned.`);
          setState('not_eligible');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return;
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
      return;
    }

    const response = await confirmRedemption(windowToken.token);
    if (response.success) {
      setImpactMessage(response.data.impact_message || '+1 ember kap ma tiszta vizet');
      setState('success');
      queryClient.invalidateQueries({ queryKey: ['csr-impact'] });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (DEMO_MODE) {
      setImpactMessage('+1 ember kap ma tiszta vizet');
      setState('success');
      queryClient.invalidateQueries({ queryKey: ['csr-impact'] });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setErrorMessage(getFriendlyError(response.error.error));
    setState(response.error.code === 'EXPIRED' ? 'expired' : 'error');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [clearTimer, queryClient, windowToken]);

  const renderBody = () => {
    if (state === 'checking' || state === 'confirming') {
      return (
        <View style={styles.body}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingTitle}>{state === 'checking' ? 'Beváltási ablak nyitása...' : 'Beváltás rögzítése...'}</Text>
          <Text style={styles.helperText}>Egy pillanat, ellenőrizzük az ingyen ital jogosultságot.</Text>
        </View>
      );
    }

    if (state === 'countdown') {
      const lowTime = timeRemaining <= 30_000;
      return (
        <View style={styles.body}>
          <View style={styles.readyBadge}>
            <CheckCircle2 size={18} color="#041015" />
            <Text style={styles.readyBadgeText}>Ablak megnyitva</Text>
          </View>
          <Text style={styles.title}>Mutasd ezt a pultosnak</Text>
          <Text style={styles.subtitle}>A pultos a te telefonodon nyomja meg a gombot.</Text>

          <View style={[styles.timerRing, lowTime && styles.timerRingWarning]}>
            <Clock3 size={24} color={lowTime ? '#FF6B6B' : Colors.dark.primary} />
            <Text style={[styles.timerValue, lowTime && styles.timerValueWarning]}>{formatTimeRemaining(timeRemaining)}</Text>
            <Text style={styles.timerLabel}>maradt</Text>
          </View>

          <Text style={styles.drinkName}>{selectedDrinkName}</Text>
          <Text style={styles.venueName}>{venueName}</Text>

          <Pressable
            onPress={handleConfirm}
            testID="redeem-now-button"
            accessibilityRole="button"
            accessibilityLabel="Beváltom"
            style={({ pressed }) => [styles.redeemButton, pressed && styles.redeemButtonPressed]}
          >
            <Text style={styles.redeemButtonText}>BEVÁLTOM</Text>
          </Pressable>

          {DEMO_MODE && (
            <TouchableOpacity style={styles.demoConfirmButton} onPress={handleConfirm} testID="demo-staff-confirm-button" activeOpacity={0.82}>
              <Text style={styles.demoConfirmText}>DEMO: Pultos confirmed</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (state === 'success') {
      return (
        <View style={styles.body}>
          <View style={styles.successHalo}>
            <Text style={styles.cheersEmoji}>🍻</Text>
          </View>
          <Text style={styles.successTitle}>Egészségedre!</Text>
          <Text style={styles.successSubtitle}>{selectedDrinkName} sikeresen beváltva.</Text>

          <Animated.View style={[styles.impactCard, { opacity: waterOpacity, transform: [{ scale: waterScale }] }]}>
            <View style={styles.waveIcon}>
              <Waves size={28} color="#041015" />
            </View>
            <Text style={styles.impactPlus}>+1</Text>
            <Text style={styles.impactText}>{impactMessage.replace(/^\+1\s*/, '')}</Text>
          </Animated.View>

          <View style={styles.successActions}>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => {
              handleClose();
              router.push('/my-impact');
            }} activeOpacity={0.84}>
              <Heart size={18} color={Colors.dark.primary} />
              <Text style={styles.secondaryActionText}>Hatásom megtekintése</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryAction} onPress={handleClose} activeOpacity={0.84}>
              <Text style={styles.primaryActionText}>Bezárás</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (state === 'not_eligible' || state === 'error' || state === 'expired') {
      return (
        <View style={styles.body}>
          <View style={styles.errorIcon}>
            <AlertCircle size={42} color={state === 'expired' ? '#FFB020' : '#FF6B6B'} />
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
          {distance !== null && (
            <Text style={styles.nextWindowText}>Mért távolság: {Math.round(distance)} m</Text>
          )}
          <TouchableOpacity style={styles.primaryAction} onPress={handleCreateWindow} activeOpacity={0.84}>
            <Text style={styles.primaryActionText}>Újrapróbálás</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostAction} onPress={handleClose} activeOpacity={0.84}>
            <Text style={styles.ghostActionText}>Vissza</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.body}>
        <View style={styles.iconStack}>
          <Text style={styles.drinkEmoji}>🍺</Text>
          <View style={styles.locationDot}>
            <MapPin size={18} color="#041015" />
          </View>
        </View>
        <Text style={styles.title}>Kérd ingyen italod</Text>
        <Text style={styles.subtitle}>Nyiss egy 120 másodperces beváltási ablakot, majd add oda a telefonod a pultosnak.</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Hely</Text>
          <Text style={styles.summaryValue}>{venueName}</Text>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryLabel}>Ital</Text>
          <Text style={styles.summaryValue}>{selectedDrinkName}</Text>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryNote}>{DEMO_MODE ? 'Demo mód aktív: GPS és napi limit nem blokkol.' : 'Éles módban 100 méteren belül kell lenned.'}</Text>
        </View>
        <Pressable
          onPress={handleCreateWindow}
          testID="start-redemption-window-button"
          accessibilityRole="button"
          accessibilityLabel="Kérd ingyen italod"
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
        >
          <Text style={styles.startButtonText}>Kérd ingyen italod</Text>
        </Pressable>
        <TouchableOpacity style={styles.ghostAction} onPress={handleClose} activeOpacity={0.84}>
          <Text style={styles.ghostActionText}>Mégsem</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <X size={22} color={Colors.dark.text} />
          </TouchableOpacity>
          {renderBody()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.86)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 34,
    backgroundColor: '#071014',
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.28)',
    overflow: 'hidden',
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 34,
    elevation: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 5,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 24,
    paddingTop: 66,
    alignItems: 'center',
  },
  iconStack: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,209,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  drinkEmoji: {
    fontSize: 44,
  },
  locationDot: {
    position: 'absolute',
    right: -2,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: Colors.dark.subtext,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.065)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  summaryLabel: {
    color: Colors.dark.subtext,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  summaryNote: {
    color: Colors.dark.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  startButton: {
    width: '100%',
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  startButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
  startButtonText: {
    color: '#041015',
    fontSize: 18,
    fontWeight: '900',
  },
  ghostAction: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    marginTop: 6,
  },
  ghostActionText: {
    color: Colors.dark.subtext,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
  },
  helperText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: Colors.dark.primary,
    marginBottom: 18,
  },
  readyBadgeText: {
    color: '#041015',
    fontSize: 13,
    fontWeight: '900',
  },
  timerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(0,209,255,0.42)',
    backgroundColor: 'rgba(0,209,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  timerRingWarning: {
    borderColor: 'rgba(255,107,107,0.7)',
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  timerValue: {
    color: Colors.dark.text,
    fontSize: 38,
    fontWeight: '900',
    marginTop: 8,
  },
  timerValueWarning: {
    color: '#FF6B6B',
  },
  timerLabel: {
    color: Colors.dark.subtext,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  drinkName: {
    color: Colors.dark.primary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 2,
  },
  venueName: {
    color: Colors.dark.subtext,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 22,
  },
  redeemButton: {
    width: '100%',
    minHeight: 88,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.dark.primary,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  redeemButtonPressed: {
    transform: [{ scale: 0.975 }],
  },
  redeemButtonText: {
    color: '#041015',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  demoConfirmButton: {
    marginTop: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  demoConfirmText: {
    color: Colors.dark.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  successHalo: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cheersEmoji: {
    fontSize: 52,
  },
  successTitle: {
    color: Colors.dark.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    color: Colors.dark.subtext,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  impactCard: {
    width: '100%',
    borderRadius: 26,
    padding: 20,
    backgroundColor: 'rgba(0,209,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.38)',
    alignItems: 'center',
    marginBottom: 20,
  },
  waveIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  impactPlus: {
    color: Colors.dark.primary,
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 50,
  },
  impactText: {
    color: Colors.dark.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  successActions: {
    width: '100%',
    gap: 10,
  },
  secondaryAction: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.32)',
    backgroundColor: 'rgba(0,209,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: Colors.dark.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  primaryAction: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  primaryActionText: {
    color: '#041015',
    fontSize: 16,
    fontWeight: '900',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorText: {
    color: Colors.dark.subtext,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  nextWindowText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
});
