import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Redirect, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Landmark, Link2, Unlink } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BANK_PREVIEW_ENABLED } from '@/lib/releaseFeatures';
import {
  type SpendPointsStatus,
  disconnectBank,
  getSpendPointsStatus,
  startBankConnection,
} from '@/lib/spendPointsService';

const CYAN = '#00C8E8' as const;
const RETURN_URL = 'comegetit://spend-points';

const STATUS_LABELS: Record<string, string> = {
  awarded: 'Jóváírva',
  capped: 'Napi plafon',
  pending: 'Könyvelésre vár',
  below_minimum: '500 Ft alatt',
  before_link: 'Csatolás előtti',
  not_participating: 'Nem gyűjt pontot',
  refund_deducted: 'Visszatérítés',
  review: 'Ellenőrzés alatt',
};

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '–';

export default function SpendPointsScreen() {
  const [status, setStatus] = useState<SpendPointsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setStatus(await getSpendPointsStatus());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = useCallback(async () => {
    setBusy(true);
    try {
      const result = await startBankConnection();
      if (result.connect_url) {
        await WebBrowser.openAuthSessionAsync(result.connect_url, RETURN_URL);
      }
      await load();
    } catch {
      Alert.alert('Nem sikerült a csatolás', 'Próbáld újra később.');
    } finally {
      setBusy(false);
    }
  }, [load]);

  const handleDisconnect = useCallback(
    (connectionId: string) => {
      Alert.alert('Bank leválasztása', 'A leválasztás után a költéseidért nem kapsz pontot, a már jóváírt pontok megmaradnak.', [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Leválasztás',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await disconnectBank(connectionId);
              await load();
            } catch {
              Alert.alert('Nem sikerült leválasztani', 'Próbáld újra később.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]);
    },
    [load]
  );

  const connections = status?.connections ?? [];
  const recent = status?.recent ?? [];

  if (!BANK_PREVIEW_ENABLED) return <Redirect href="/(tabs)/profile" />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Költésből pont', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={CYAN} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Költésből pont</Text>
          <Text style={styles.headerSub}>
            Csatold a bankszámládat, és minden partnerhelyen fizetett 100 Ft után 1 pontot kapsz. 10 000 Ft = 100 pont.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={CYAN} style={styles.loader} />
        ) : !status?.enabled ? (
          <View style={styles.section}>
            <Text style={styles.muted}>Ez a funkció hamarosan érkezik.</Text>
          </View>
        ) : (
          <>
            {status.mode === 'mock' || status.mode === 'sandbox' ? (
              <View style={styles.testBanner}>
                <Text style={styles.testBannerText}>Tesztüzem: valódi bank nem kapcsolódik.</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mit látunk?</Text>
              <Text style={styles.body}>
                A bankod jóváhagyásával a Salt Edge (engedélyezett szolgáltató) átadja nekünk a számlád tranzakcióit. Csak a
                Come Get It partnerhelyeken történt fizetéseket tároljuk, minden mást eldobunk. A hozzájárulás 180 napig
                érvényes, és bármikor visszavonhatod.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Csatolt bankok</Text>
              {connections.length === 0 ? <Text style={styles.muted}>Még nincs csatolt bankod.</Text> : null}
              {connections.map((connection) => (
                <View key={connection.id} style={styles.card}>
                  <Landmark size={18} color={CYAN} />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{connection.provider_name ?? 'Bank'}</Text>
                    <Text style={styles.cardSub}>Érvényes eddig: {formatDate(connection.consent_expires_at)}</Text>
                  </View>
                  <TouchableOpacity
                    disabled={busy}
                    onPress={() => handleDisconnect(connection.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Bank leválasztása"
                    style={styles.iconButton}
                  >
                    <Unlink size={17} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                disabled={busy}
                onPress={handleConnect}
                style={[styles.primaryButton, busy && styles.buttonDisabled]}
                testID="connect-bank-button"
              >
                {busy ? <ActivityIndicator color="#001014" /> : <Link2 size={18} color="#001014" />}
                <Text style={styles.primaryButtonText}>{connections.length ? 'Másik bank csatolása' : 'Bank csatolása'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Költéseid partnerhelyeken</Text>
              {recent.length === 0 ? (
                <Text style={styles.muted}>A partnerhelyen fizetett összeg 1–3 napon belül jelenik meg itt.</Text>
              ) : null}
              {recent.map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{tx.venue_name}</Text>
                    <Text style={styles.cardSub}>
                      {formatDate(tx.made_on)} · {tx.is_refund ? '−' : ''}
                      {tx.amount_huf.toLocaleString('hu-HU')} Ft · {STATUS_LABELS[tx.points_status] ?? tx.points_status}
                    </Text>
                  </View>
                  <Text style={[styles.txPoints, tx.points < 0 && styles.txPointsNegative]}>
                    {tx.points > 0 ? '+' : ''}
                    {tx.points} p
                  </Text>
                </View>
              ))}
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
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 18 },
  loader: { marginVertical: 48 },
  section: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  body: { fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 19 },
  muted: { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 18, marginBottom: 12 },
  testBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,152,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.35)',
  },
  testBannerText: { color: Colors.warning, fontSize: 12.5, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  primaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYAN,
    borderRadius: 25,
    padding: 14,
    marginTop: 4,
    gap: 7,
  },
  buttonDisabled: { opacity: 0.55 },
  primaryButtonText: { fontSize: 15, fontWeight: '800', color: '#001014' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  txPoints: { fontSize: 15, fontWeight: '800', color: CYAN },
  txPointsNegative: { color: '#FF6B6B' },
});
