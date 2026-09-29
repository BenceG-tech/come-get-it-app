import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';

const LOGO_SOURCE = require('@/assets/images/come-get-it-logo-white.png');

export default function EntryScreen() {
  const router = useRouter();
  const { session, isAuthReady } = useAuth();

  useEffect(() => {
    console.log('[Entry] useEffect triggered', { isAuthReady, hasSession: Boolean(session) });
    if (!isAuthReady) {
      console.log('[Entry] Auth not ready yet, waiting...');
      return;
    }

    const timer = setTimeout(() => {
      if (session) {
        console.log('[Entry] session exists -> go /(tabs)/home');
        router.replace('/(tabs)/home');
      } else {
        console.log('[Entry] no session -> go /auth');
        router.replace('/auth');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthReady, router, session]);

  return (
    <View style={styles.container} testID="entry-loading">
      <View style={styles.brandBlock}>
        <Image
          source={LOGO_SOURCE}
          style={styles.logo}
          contentFit="contain"
          contentPosition="center"
          accessibilityLabel="Come Get It"
        />
        <Text style={styles.tagline}>BUDAPEST ESTÉI, EGY HELYEN</Text>
      </View>
      <View style={styles.loadingBlock}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.text}>Betöltés…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandBlock: {
    alignItems: 'center',
  },
  logo: {
    width: 248,
    height: 125,
  },
  tagline: {
    marginTop: 6,
    color: Colors.primary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  loadingBlock: {
    position: 'absolute',
    bottom: 72,
    alignItems: 'center',
    gap: 10,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
