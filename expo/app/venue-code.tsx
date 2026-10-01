import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { claimVenueCode } from '@/lib/spendPointsService';

const CYAN = '#00C8E8' as const;

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE: 'Ezt a kódot nem ismerjük. Nézd meg újra az asztali táblán.',
  ALREADY_CLASSIFIED: 'A kódot az első italod beváltása előtt lehet megadni.',
  TOO_LATE: 'A helykódot a regisztrációt követő 24 órában lehet megadni.',
  NOT_AUTHENTICATED: 'Előbb jelentkezz be vagy regisztrálj.',
  ERROR: 'Valami hiba történt, próbáld újra.',
};

// The venue's table tent shows a short code next to its QR. Opening comegetit://venue-code?code=XXXX
// pre-fills it; a fresh App Store install loses the link, so the code can also be typed in.
export default function VenueCodeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(typeof params.code === 'string' ? params.code.toUpperCase() : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof params.code === 'string') setCode(params.code.toUpperCase());
  }, [params.code]);

  const submit = useCallback(async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    const result = await claimVenueCode(code);
    setBusy(false);
    if (result.success) {
      setVenueName(result.venue_name);
    } else {
      setError(ERROR_MESSAGES[result.code] ?? ERROR_MESSAGES.ERROR);
    }
  }, [busy, code]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Helykód', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />

      <View style={styles.content}>
        <Text style={styles.title}>Egy partnerhelyen vagy?</Text>
        <Text style={styles.sub}>Írd be az asztali táblán látható helykódot, hogy tudjuk, hol ismerted meg a Come Get It-et.</Text>

        {venueName ? (
          <View style={styles.success}>
            <Check size={20} color={CYAN} />
            <Text style={styles.successText}>Köszönjük! Rögzítettük: {venueName}</Text>
          </View>
        ) : (
          <>
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!!session}
              maxLength={12}
              onChangeText={(value) => setCode(value.toUpperCase())}
              onSubmitEditing={submit}
              placeholder="pl. FIRST24"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
              value={code}
              testID="venue-code-input"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!session ? <Text style={styles.error}>{ERROR_MESSAGES.NOT_AUTHENTICATED}</Text> : null}
            <TouchableOpacity
              disabled={busy || !session || !code.trim()}
              onPress={submit}
              style={[styles.button, (busy || !session || !code.trim()) && styles.buttonDisabled]}
            >
              {busy ? <ActivityIndicator color="#001014" /> : <Text style={styles.buttonText}>Kód rögzítése</Text>}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.back()} style={styles.skip}>
          <Text style={styles.skipText}>{venueName ? 'Tovább' : 'Most kihagyom'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingTop: 24 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 6 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 19, marginBottom: 20 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
    textAlign: 'center',
  },
  error: { color: '#FF6B6B', fontSize: 13, marginBottom: 10 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYAN,
    borderRadius: 25,
    padding: 14,
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 15, fontWeight: '800', color: '#001014' },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,200,232,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,232,0.35)',
  },
  successText: { color: Colors.text, fontSize: 14, fontWeight: '700', flex: 1 },
  skip: { alignItems: 'center', paddingVertical: 18 },
  skipText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '700' },
});
