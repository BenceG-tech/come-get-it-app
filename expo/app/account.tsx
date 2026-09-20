import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { ExternalLink, Save, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';

const CYAN = '#00C8E8' as const;
const PRIVACY_URL = 'https://github.com/BenceG-tech/come-get-it-app/blob/main/PRIVACY.md';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export default function AccountScreen() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabase(), []);
  const { session, requestPasswordReset, deleteAccount } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const email = session?.user.email ?? '';

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!session?.user.id) {
        if (mounted) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        Alert.alert('Nem sikerült betölteni a profilt', error.message);
      } else {
        const row = data as { name?: string | null; phone?: string | null } | null;
        setName(row?.name ?? '');
        setPhone(row?.phone ?? '');
      }
      setLoading(false);
    };
    loadProfile().catch((error) => {
      if (mounted) {
        setLoading(false);
        Alert.alert('Nem sikerült betölteni a profilt', error instanceof Error ? error.message : 'Ismeretlen hiba');
      }
    });
    return () => {
      mounted = false;
    };
  }, [session?.user.id, supabase]);

  const handleSave = useCallback(async () => {
    const userId = session?.user.id;
    const trimmedName = name.trim();
    if (!userId || !trimmedName || saving) {
      if (!trimmedName) Alert.alert('A név kötelező', 'Adj meg egy megjelenítendő nevet.');
      return;
    }
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: trimmedName, phone: phone.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({ data: { full_name: trimmedName } });
      if (authError) throw authError;
      Alert.alert('Mentve', 'A fiókadataid frissültek.');
    } catch (error) {
      Alert.alert('Nem sikerült menteni', error instanceof Error ? error.message : 'Ismeretlen hiba');
    } finally {
      setSaving(false);
    }
  }, [name, phone, saving, session?.user.id, supabase]);

  const handlePasswordReset = useCallback(async () => {
    if (!email) return;
    try {
      await requestPasswordReset(email);
      Alert.alert('E-mail elküldve', 'A jelszó módosításához nyisd meg az e-mailben kapott linket.');
    } catch {
      // A részletes hibaüzenetet az auth réteg jeleníti meg.
    }
  }, [email, requestPasswordReset]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Fiók végleges törlése',
      'A profilod és a hozzá tartozó személyes adatok végleg törlődnek. Ez nem vonható vissza.',
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Fiók törlése',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              router.replace('/auth');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [deleteAccount, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Fiók', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fiókadatok</Text>
          <Text style={styles.headerSub}>Kezeld személyes adataidat és biztonsági beállításaidat.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={CYAN} style={styles.loader} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Személyes adatok</Text>
              <Text style={styles.inputLabel}>Név</Text>
              <TextInput
                autoComplete="name"
                onChangeText={setName}
                placeholder="Teljes név"
                placeholderTextColor="rgba(255,255,255,0.40)"
                style={styles.input}
                textContentType="name"
                value={name}
              />

              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput editable={false} style={[styles.input, styles.inputDisabled]} value={email} />
              <Text style={styles.fieldHint}>Az e-mail cím a bejelentkezési fiókodhoz tartozik.</Text>

              <Text style={styles.inputLabel}>Telefonszám (opcionális)</Text>
              <TextInput
                autoComplete="tel"
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder="+36 70 585 2053"
                placeholderTextColor="rgba(255,255,255,0.40)"
                style={styles.input}
                textContentType="telephoneNumber"
                value={phone}
              />
            </View>

            <TouchableOpacity disabled={saving} onPress={handleSave} style={[styles.saveButton, saving && styles.buttonDisabled]}>
              {saving ? <ActivityIndicator color="#001014" /> : <Save size={18} color="#001014" />}
              <Text style={styles.saveButtonText}>Mentés</Text>
            </TouchableOpacity>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Biztonság és jogi információk</Text>
              <View style={styles.menuCard}>
                <TouchableOpacity onPress={handlePasswordReset} style={styles.menuRow}>
                  <Text style={styles.menuText}>Jelszó módosítása</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.menuRow}>
                  <Text style={styles.menuText}>Adatvédelmi szabályzat</Text>
                  <ExternalLink size={16} color={CYAN} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} style={styles.menuRow}>
                  <Text style={styles.menuText}>Használati feltételek</Text>
                  <ExternalLink size={16} color={CYAN} />
                </TouchableOpacity>
                <TouchableOpacity disabled={deleting} onPress={confirmDelete} style={[styles.menuRow, styles.menuRowLast]}>
                  {deleting ? <ActivityIndicator color="#FF6B6B" /> : <Trash2 size={17} color="#FF6B6B" />}
                  <Text style={[styles.menuText, styles.dangerText]}>Fiók törlése</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 4, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 18 },
  loader: { marginVertical: 48 },
  section: { paddingHorizontal: 16, paddingBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12, letterSpacing: 0.1 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.68)', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  inputDisabled: { opacity: 0.62, marginBottom: 5 },
  fieldHint: { color: 'rgba(255,255,255,0.38)', fontSize: 11.5, marginBottom: 16 },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuRowLast: { borderBottomWidth: 0, justifyContent: 'flex-start' },
  menuText: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  dangerText: { color: '#FF6B6B' },
  saveButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYAN,
    borderRadius: 25,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 7,
  },
  buttonDisabled: { opacity: 0.55 },
  saveButtonText: { fontSize: 15, fontWeight: '800', color: '#001014' },
});
