import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { X, RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { RedemptionToken, FreeDrinkWindow, VenueDrink } from '@/types/venue';
import {
  issueRedemptionToken,
  generateMockToken,
  generateQRCodeUrl,
  getTimeRemainingMs,
  formatTimeRemaining,
  checkLocalEligibility,
  getDayLabel,
} from '@/lib/redemptionService';

type RedeemQRModalProps = {
  visible: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  drink: VenueDrink | null;
  freeDrinkWindows: FreeDrinkWindow[];
  userId?: string;
};

type ModalState = 
  | 'confirm_location'
  | 'loading'
  | 'qr_display'
  | 'not_eligible'
  | 'rate_limited'
  | 'error';

const TOKEN_TTL_MS = 120 * 1000;

export default function RedeemQRModal({
  visible,
  onClose,
  venueId,
  venueName,
  drink,
  freeDrinkWindows,
  userId = 'anonymous_user',
}: RedeemQRModalProps) {
  const [state, setState] = useState<ModalState>('confirm_location');
  const [token, setToken] = useState<RedemptionToken | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(TOKEN_TTL_MS);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [nextWindow, setNextWindow] = useState<{ day: number; start: string; end: string } | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const clearTokenTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearTokenTimer();
    setToken(null);
    setTimeRemaining(TOKEN_TTL_MS);
    setErrorMessage('');
    setNextWindow(null);
    setCooldownUntil(null);
    setState('confirm_location');
  }, [clearTokenTimer]);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  useEffect(() => {
    if (state === 'qr_display') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const startTokenTimer = useCallback((expiresAt: string, onExpire: () => void) => {
    clearTokenTimer();
    
    const updateTimer = () => {
      const remaining = getTimeRemainingMs(expiresAt);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearTokenTimer();
        console.log('[RedeemQRModal] Token expired, auto-refreshing...');
        onExpire();
      }
    };
    
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
  }, [clearTokenTimer]);

  const requestNewToken = useCallback(async () => {
    if (!drink) return;
    
    console.log('[RedeemQRModal] Requesting new token...');
    setIsRefreshing(true);
    setState('loading');
    
    try {
      const eligibility = checkLocalEligibility(freeDrinkWindows, drink.id);
      
      if (!eligibility.eligible) {
        console.log('[RedeemQRModal] Not eligible locally, next window:', eligibility.nextWindow);
        setNextWindow(eligibility.nextWindow ?? null);
        setState('not_eligible');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      const useMock = !process.env.EXPO_PUBLIC_SUPABASE_URL;
      
      if (useMock) {
        console.log('[RedeemQRModal] Using mock token (no backend configured)');
        const mockToken = generateMockToken(venueId, drink.id);
        setToken(mockToken);
        setState('qr_display');
        startTokenTimer(mockToken.expires_at, () => {
          setToken(null);
          setState('loading');
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const response = await issueRedemptionToken(venueId, drink.id, userId);
        
        if (response.success) {
          setToken(response.data);
          setState('qr_display');
          startTokenTimer(response.data.expires_at, () => {
            setToken(null);
            setState('loading');
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          const error = response.error;
          setErrorMessage(error.error);
          
          if (error.code === 'NOT_ELIGIBLE') {
            setNextWindow(error.next_available_window ?? null);
            setState('not_eligible');
          } else if (error.code === 'RATE_LIMITED') {
            setCooldownUntil(error.cooldown_until ?? null);
            setState('rate_limited');
          } else {
            setState('error');
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.error('[RedeemQRModal] Error requesting token:', error);
      setErrorMessage('Hálózati hiba történt. Próbáld újra.');
      setState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRefreshing(false);
    }
  }, [drink, venueId, userId, freeDrinkWindows, startTokenTimer]);

  const handleConfirmLocation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requestNewToken();
  }, [requestNewToken]);

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestNewToken();
  }, [requestNewToken]);

  const handleClose = useCallback(() => {
    clearTokenTimer();
    onClose();
  }, [clearTokenTimer, onClose]);

  const renderContent = () => {
    switch (state) {
      case 'confirm_location':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.drinkEmoji}>🍺</Text>
            </View>
            <Text style={styles.title}>
              Legyél a vendéglátóhelyen,{'\n'}
              hogy igényelhesed az{'\n'}
              ingyen italod
            </Text>
            <Text style={styles.venueName}>{venueName}</Text>
            {drink && <Text style={styles.drinkName}>{drink.drinkName}</Text>}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmLocation}
                activeOpacity={0.8}
                testID="confirm-location-button"
              >
                <Text style={styles.confirmButtonText}>Itt vagyok</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.8}
                testID="cancel-button"
              >
                <Text style={styles.cancelButtonText}>Vissza</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 'loading':
        return (
          <View style={styles.contentContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>QR kód generálása...</Text>
          </View>
        );
      
      case 'qr_display':
        if (!token) return null;
        
        const qrUrl = generateQRCodeUrl(token.qr_payload, 280);
        const formattedTime = formatTimeRemaining(timeRemaining);
        const isLowTime = timeRemaining < 30000;
        
        return (
          <View style={styles.contentContainer}>
            <View style={styles.qrHeader}>
              <CheckCircle size={24} color={Colors.dark.primary} />
              <Text style={styles.qrTitle}>Mutasd meg a pultosnak</Text>
            </View>
            
            <Animated.View style={[styles.qrContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Image
                source={{ uri: qrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
                testID="qr-code-image"
              />
            </Animated.View>
            
            <View style={[styles.timerContainer, isLowTime && styles.timerContainerWarning]}>
              <Clock size={18} color={isLowTime ? '#FF6B6B' : Colors.dark.text} />
              <Text style={[styles.timerText, isLowTime && styles.timerTextWarning]}>
                Érvényes: {formattedTime}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={isRefreshing}
              activeOpacity={0.7}
              testID="refresh-qr-button"
            >
              <RefreshCw 
                size={18} 
                color={Colors.dark.primary} 
                style={isRefreshing ? styles.refreshingIcon : undefined}
              />
              <Text style={styles.refreshButtonText}>
                {isRefreshing ? 'Frissítés...' : 'Új QR kód'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.drinkInfoText}>{drink?.drinkName}</Text>
            
            <TouchableOpacity
              style={styles.closeBottomButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBottomButtonText}>Bezárás</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'not_eligible':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.errorTitle}>Most nem elérhető</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || 'Az ingyen ital most nem igényelhető ezen a helyszínen.'}
            </Text>
            
            {nextWindow && (
              <View style={styles.nextWindowContainer}>
                <Text style={styles.nextWindowLabel}>Következő elérhető időpont:</Text>
                <Text style={styles.nextWindowTime}>
                  {getDayLabel(nextWindow.day)} {nextWindow.start}-{nextWindow.end}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Rendben</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'rate_limited':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.errorIconContainer}>
              <Clock size={48} color="#FFA500" />
            </View>
            <Text style={styles.errorTitle}>Túl sok próbálkozás</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || 'Kérjük, várj egy kicsit, mielőtt újra próbálkoznál.'}
            </Text>
            
            {cooldownUntil && (
              <Text style={styles.cooldownText}>
                Próbáld újra: {new Date(cooldownUntil).toLocaleTimeString('hu-HU')}
              </Text>
            )}
            
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Rendben</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'error':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.errorTitle}>Hiba történt</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || 'Valami hiba történt. Próbáld újra.'}
            </Text>
            
            <View style={styles.errorButtonsContainer}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRefresh}
                activeOpacity={0.8}
              >
                <RefreshCw size={18} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Újrapróbálás</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Bezárás</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="close-modal-button"
          >
            <X size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: Colors.dark.card,
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  drinkEmoji: {
    fontSize: 40,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 16,
  },
  venueName: {
    color: Colors.dark.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  drinkName: {
    color: Colors.dark.subtext,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.dark.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelButtonText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '500',
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 16,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  qrTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 16,
  },
  timerContainerWarning: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  timerText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
  },
  timerTextWarning: {
    color: '#FF6B6B',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    marginBottom: 16,
  },
  refreshingIcon: {
    opacity: 0.5,
  },
  refreshButtonText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  drinkInfoText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: 20,
  },
  closeBottomButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  closeBottomButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorMessage: {
    color: Colors.dark.subtext,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  nextWindowContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  nextWindowLabel: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: 8,
  },
  nextWindowTime: {
    color: Colors.dark.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cooldownText: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorButtonsContainer: {
    width: '100%',
    gap: 12,
  },
});
