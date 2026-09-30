import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
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
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthReady, router, session]);

  return (
    <View style={styles.container} testID="entry-loading">
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Betöltés…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
