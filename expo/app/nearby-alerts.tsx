import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { BellRing } from 'lucide-react-native';
import Colors from '@/constants/colors';
import {
  NEARBY_ALERT_RADIUS_M,
  disableNearbyAlerts,
  enableNearbyAlerts,
  getNearbyAlertsPermission,
  isNearbyAlertsEnabled,
  isNearbyAlertsSupported,
  type NearbyAlertsPermission,
} from '@/lib/nearbyAlerts';

const CYAN = '#00C8E8' as const;

const PERMISSION_HELP: Record<Exclude<NearbyAlertsPermission, 'granted'>, string> = {
  notifications_denied: 'Az értesítések ki vannak kapcsolva. A Beállítások → Come Get It → Értesítések menüben engedélyezheted.',
  location_denied: 'A helymeghatározás ki van kapcsolva. A Beállítások → Come Get It → Helyzet menüben engedélyezheted.',
  background_denied:
    'Ehhez a helyhozzáférést „Mindig” értékre kell állítani, mert az app ilyenkor zárva van. Beállítások → Come Get It → Helyzet → Mindig.',
};

// Opt-in screen for "free drink nearby" notifications. Nothing is requested until the user flips the switch,
// and the copy states what is sent, when, and that location stays on the device (App Review 4.5.4, 5.1.1).
export default function NearbyAlertsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NearbyAlertsPermission | null>(null);
  const [busy, setBusy] = useState(true);
  // Help text only after the user tried to turn it on (or it was on and a permission was revoked since).
  const [attempted, setAttempted] = useState(false);

  const refresh = useCallback(async () => {
    const [isOn, perm] = await Promise.all([isNearbyAlertsEnabled(), getNearbyAlertsPermission().catch(() => null)]);
    setEnabled(isOn && perm === 'granted');
    if (isOn && perm !== 'granted') setAttempted(true);
    setPermission(perm);
    setBusy(false);
  }, []);

  useEffect(() => {
    refresh();
    // Coming back from the Settings app may have changed a permission.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const toggle = useCallback(
    async (next: boolean) => {
      setBusy(true);
      try {
        if (next) {
          setAttempted(true);
          const result = await enableNearbyAlerts();
          setPermission(result);
          setEnabled(result === 'granted');
        } else {
          await disableNearbyAlerts();
          setEnabled(false);
        }
      } catch (error) {
        console.warn('[NearbyAlertsScreen] toggle failed', error);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const help = attempted && !enabled && permission && permission !== 'granted' ? PERMISSION_HELP[permission] : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Közeli ingyen ital', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <BellRing size={28} color={CYAN} />
        </View>
        <Text style={styles.title}>Szólunk, ha ingyen ital van a közelben</Text>
        <Text style={styles.sub}>
          Ha egy partnerhely {NEARBY_ALERT_RADIUS_M} méteres körzetébe érsz, és ott éppen beváltható ingyen ital, küldünk egy
          értesítést. Akkor is, ha az app nincs megnyitva.
        </Text>

        {isNearbyAlertsSupported ? (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Értesítés a közeli ingyen italokról</Text>
            {busy ? (
              <ActivityIndicator color={CYAN} />
            ) : (
              <Switch
                value={enabled}
                onValueChange={toggle}
                trackColor={{ true: CYAN, false: 'rgba(255,255,255,0.2)' }}
                accessibilityLabel="Értesítés a közeli ingyen italokról"
                testID="nearby-alerts-switch"
              />
            )}
          </View>
        ) : (
          <Text style={styles.help}>Ez a funkció jelenleg csak iPhone-on érhető el.</Text>
        )}

        {help ? (
          <View style={styles.helpBox}>
            <Text style={styles.help}>{help}</Text>
            <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.settingsButton} activeOpacity={0.85}>
              <Text style={styles.settingsButtonText}>Beállítások megnyitása</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Amit érdemes tudni</Text>
        <Text style={styles.bullet}>• A bekapcsoláskor az iPhone engedélyt kér az értesítésekre és a helyhozzáférésre („Mindig”).</Text>
        <Text style={styles.bullet}>• A helyedet a telefonod figyeli; nem küldjük el és nem tároljuk a szerverünkön.</Text>
        <Text style={styles.bullet}>• Működéséhez a helyhozzáférésnél a „Pontos hely” kapcsolónak is bekapcsolva kell lennie.</Text>
        <Text style={styles.bullet}>• Helyenként legfeljebb napi egy, összesen napi két értesítés. Ha aznap már beváltottad az italod, nem zavarunk.</Text>
        <Text style={styles.bullet}>• Az iOS energiatakarékos körzetfigyelését használjuk, folyamatos GPS-követés nincs.</Text>
        <Text style={styles.bullet}>• Bármikor kikapcsolhatod itt vagy az iPhone Beállításaiban.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingTop: 24, paddingBottom: 40 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,200,232,0.12)',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 6 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 20, marginBottom: 20 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  switchLabel: { flex: 1, color: Colors.text, fontSize: 15, fontWeight: '700' },
  helpBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  help: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19 },
  settingsButton: {
    marginTop: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: CYAN,
  },
  settingsButtonText: { color: CYAN, fontSize: 14, fontWeight: '800' },
  sectionTitle: { marginTop: 28, marginBottom: 8, color: Colors.text, fontSize: 15, fontWeight: '800' },
  bullet: { color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 20, marginBottom: 6 },
});
