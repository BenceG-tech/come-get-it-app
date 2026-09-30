import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';

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

      if (Platform.OS !== 'web') {
        requestAnimationFrame(() => {
          SplashScreen.hideAsync().catch((error) => {
            console.warn('[SplashScreen] hideAsync failed:', error);
          });
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthReady, router, session]);

  return (
    <View style={styles.container} testID="entry-loading" />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
