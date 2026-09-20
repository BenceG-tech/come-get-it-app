import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LockKeyhole } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';

const CYAN = '#00C8E8' as const;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => password.length >= 8 && password === confirmation && !loading,
    [confirmation, loading, password]
  );

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await updatePassword(password);
      Alert.alert('Jelszó módosítva', 'Most már az új jelszóval tudsz belépni.', [
        { text: 'Rendben', onPress: () => router.replace('/(tabs)/home') },
      ]);
    } finally {
      setLoading(false);
    }
  }, [canSubmit, password, router, updatePassword]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
          <View style={styles.iconWrap}>
            <LockKeyhole size={28} color={CYAN} />
          </View>
          <Text style={styles.title}>Új jelszó</Text>
          <Text style={styles.subtitle}>Adj meg egy legalább 8 karakteres új jelszót.</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            onChangeText={setPassword}
            placeholder="Új jelszó"
            placeholderTextColor="rgba(255,255,255,0.36)"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={password}
          />
          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            onChangeText={setConfirmation}
            onSubmitEditing={onSubmit}
            placeholder="Új jelszó még egyszer"
            placeholderTextColor="rgba(255,255,255,0.36)"
            returnKeyType="done"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={confirmation}
          />

          {confirmation.length > 0 && password !== confirmation ? (
            <Text style={styles.error}>A két jelszó nem egyezik.</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={onSubmit}
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
          >
            {loading ? <ActivityIndicator color="#001014" /> : <Text style={styles.buttonText}>Jelszó mentése</Text>}
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,200,232,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,232,0.28)',
    marginBottom: 18,
  },
  title: { color: Colors.text, fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.58)', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  input: {
    color: Colors.text,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  error: { color: '#FF7676', fontSize: 13, marginBottom: 8 },
  button: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYAN,
  },
  buttonDisabled: { opacity: 0.42 },
  buttonText: { color: '#001014', fontSize: 15, fontWeight: '900' },
});
