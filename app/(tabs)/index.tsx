import { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Platform, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Search, MapPin, Filter } from "lucide-react-native";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { useAppContext } from "@/context/AppContext";
import Colors from "@/constants/colors";
import VenueCard from "@/components/VenueCard";
import { rest } from "@/lib/supabaseRest";
import { Venue } from '@/types/venue';

type SupaVenue = Pick<Venue, 'id' | 'name' | 'address' | 'image_url' | 'plan' | 'created_at'> & { website_url?: string | null; is_paused?: boolean | null; };

export default function BarsScreen() {
  const router = useRouter();
  const { locationEnabled, setLocationEnabled } = useAppContext();

  useEffect(() => {
    if (locationEnabled && Platform.OS !== 'web') {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          console.log('User location:', location.coords);
        }
      })();
    }
  }, [locationEnabled]);

  const enableLocation = () => {
    setLocationEnabled(true);
  };



  const renderHeader = () => (
    <View style={styles.header}>
      {/* Logo row */}
      <View style={styles.logoRow}>
        <Image 
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h0zjszxjz77aaoy53fi9j' }}
          style={styles.logoImage}
          contentFit="contain"
        />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MapPin size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Filter buttons row */}
      <View style={styles.filterRow}>
        <View style={styles.locationBadge}>
          <MapPin size={14} color={Colors.text} />
          <Text style={styles.locationBadgeText}>Budapest</Text>
        </View>
        
        <TouchableOpacity style={styles.filterPill}>
          <Text style={styles.filterPillText}>NYITVA</Text>
          <Text style={styles.filterPillSubText}>+22:00</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.filterPill}>
          <Filter size={14} color={Colors.text} />
          <Text style={styles.filterPillText}>Ingyen Ital Elérhető</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLocationPrompt = () => (
    !locationEnabled && (
      <View style={styles.locationPrompt}>
        <Text style={styles.locationPromptText}>
          Bars are sorted at random - turn on location to show the best bars near you
        </Text>
        <TouchableOpacity style={styles.locationButton} onPress={enableLocation}>
          <Text style={styles.locationButtonText}>Turn me on</Text>
        </TouchableOpacity>
      </View>
    )
  );

  const [list, setList] = useState<SupaVenue[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const load = useCallback(async () => {
    console.info('[SupabaseMobile] Load venues list');
    setLoading(true);
    setError(null);
    try {
      const res = await rest('/venues?select=id,name,address,image_url,plan,created_at,website_url,is_paused&order=created_at.desc&limit=50');
      const venues = (await res.json()) as SupaVenue[];
      setList(Array.isArray(venues) ? venues : []);
      console.info('[SupabaseMobile] Loaded venues', Array.isArray(venues) ? venues.length : 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[SupabaseMobile] Load error', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderHeader()}
      
      <View style={styles.content}>
        {renderLocationPrompt()}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Hiba történt a betöltés során</Text>
          </View>
        ) : null}
        {!loading && list.length === 0 && !error ? (
          <Text style={styles.locationPromptText}>Nincs még helyszín</Text>
        ) : null}
        <FlatList
          data={list}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <VenueCard
              venue={{
                id: String(item.id),
                name: item.name ?? '-',
                address: item.address ?? '-',
                image_url: item.image_url ?? null,
                plan: (item.plan as 'basic' | 'standard' | 'premium' | undefined) ?? undefined,
                created_at: item.created_at ?? undefined,
              } as Venue}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.venueList}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
    height: 60,
  },
  logoImage: {
    width: 200,
    height: 60,
    resizeMode: 'contain' as const,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "300",
    color: Colors.text,
    fontStyle: "italic",
    marginRight: 8,
  },
  logoSubText: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text,
    letterSpacing: 2,
  },
  headerRight: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    gap: 12,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  locationBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "500",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterPillText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "500",
  },
  filterPillSubText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  locationPrompt: {
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: "center",
  },
  locationPromptText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 10,
  },
  locationButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  locationButtonText: {
    color: Colors.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  venueList: {
    paddingBottom: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
  },
});