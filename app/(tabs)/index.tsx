import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Search, MapPin, Filter } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import VenueCard from "@/components/VenueCard";
import { Venue } from "@/types/venue";
import { rest } from "@/lib/supabaseRest";
import { useAppContext } from "@/context/AppContext";
import { venues as fallbackVenues } from "@/data/venues";

export default function BarsScreen() {
  const router = useRouter();
  const { selectedFilters, setSelectedFilters } = useAppContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const logoUri = useMemo(() => (
    "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/hyz5pz2ymzhnjwx3w67to"
  ), []);
  const iconSize = width <= 375 ? 20 : 22;
  const headerHeight = Math.max(56, 44 + insets.top);

  const loadingRef = useRef(true);
  loadingRef.current = loading;

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && loadingRef.current) {
        console.warn('[BarsScreen] Fetch timeout, using fallback venues');
        setVenues(fallbackVenues);
        setLoading(false);
      }
    }, 10000);

    const fetchVenues = async () => {
      try {
        console.log('[BarsScreen] Fetching venues from Supabase...');
        const response = await rest('/venues?select=*');
        
        if (!isMounted) return;
        
        if (!response.ok) {
          console.error('[BarsScreen] Response not ok:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('[BarsScreen] Raw response text:', responseText.substring(0, 200));
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('[BarsScreen] JSON parse error:', parseError);
          throw new Error('Failed to parse response as JSON');
        }
        
        if (!isMounted) return;
        
        console.log('[BarsScreen] Venues fetched:', data?.length || 0);
        if (data && data.length > 0) {
          const venuesWithImages = await Promise.all(
            data.map(async (venue: Venue) => {
              try {
                if (venue.image_url || venue.hero_image_url) {
                  return venue;
                }
                
                const imagesResponse = await rest(`/venue_images?venue_id=eq.${venue.id}&select=url,is_cover&order=is_cover.desc,created_at.asc&limit=1`);
                const imagesText = await imagesResponse.text();
                const images = JSON.parse(imagesText);
                
                if (images && images.length > 0) {
                  return { ...venue, image_url: images[0].url };
                }
                
                return venue;
              } catch (imgError) {
                console.error(`[BarsScreen] Error fetching images for venue ${venue.id}:`, imgError);
                return venue;
              }
            })
          );
          
          if (isMounted) {
            setVenues(venuesWithImages);
          }
        } else {
          console.log('[BarsScreen] No venues from API, using fallback');
          if (isMounted) {
            setVenues(fallbackVenues);
          }
        }
      } catch (error) {
        console.error('[BarsScreen] Error fetching venues:', error);
        if (isMounted) {
          setVenues(fallbackVenues);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVenues();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const filteredVenues = venues.filter(venue => {
    if (selectedFilters.length === 0) return true;
    let passesFilters = true;
    if (selectedFilters.includes('nyitva')) {
      passesFilters = passesFilters && true;
    }
    if (selectedFilters.includes('ingyen-ital')) {
      passesFilters = passesFilters && true;
    }
    return passesFilters;
  });

  const openFilter = () => {
    router.push('/filter');
  };

  const openMap = () => {
    router.push('/map');
  };

  const openSearch = () => {
    router.push('/search');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>        
        <View style={styles.headerCenter}>
          <Image
            source={{ uri: logoUri }}
            accessibilityLabel="Come Get It logo"
            style={[styles.brandLogo, { height: width <= 375 ? 40 : 44 }]}
          />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            testID="home-search"
            onPress={openSearch}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Search size={iconSize} color="#EAEAEA" />
          </TouchableOpacity>
          <TouchableOpacity
            testID="home-map"
            onPress={openMap}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <MapPin size={iconSize} color="#EAEAEA" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filtersContent}>          
          <TouchableOpacity 
            testID="chip-nyitva"
            style={[
              styles.filterPill,
              selectedFilters.includes('nyitva') && styles.filterPillActive
            ]}
            onPress={() => {
              const newFilters = selectedFilters.includes('nyitva') 
                ? selectedFilters.filter(f => f !== 'nyitva')
                : [...selectedFilters, 'nyitva'];
              setSelectedFilters(newFilters);
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterPillText,
              selectedFilters.includes('nyitva') && styles.filterPillTextActive
            ]}>NYITVA</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            testID="chip-free"
            style={[
              styles.filterPill,
              selectedFilters.includes('ingyen-ital') && styles.filterPillActive
            ]}
            onPress={() => {
              const newFilters = selectedFilters.includes('ingyen-ital') 
                ? selectedFilters.filter(f => f !== 'ingyen-ital')
                : [...selectedFilters, 'ingyen-ital'];
              setSelectedFilters(newFilters);
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterPillText,
              selectedFilters.includes('ingyen-ital') && styles.filterPillTextActive
            ]}>Ingyen ital elérhető</Text>
          </TouchableOpacity>
          
          <TouchableOpacity testID="chip-filters" style={styles.filterButton} onPress={openFilter} activeOpacity={0.7}>
            <Filter size={width <= 375 ? 16 : 18} color="rgba(234,234,234,0.7)" />
            <Text style={styles.filterButtonText}>Szűrők</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Betöltés...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.venuesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.venuesContent}
        >
          {filteredVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
          
          {filteredVenues.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nincs találat</Text>
              <Text style={styles.emptyStateSubtext}>Próbálj meg más szűrőket vagy keresési kifejezést</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const pillRadius = 9999 as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderBottomWidth: 0,
    paddingHorizontal: 12,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    width: undefined as unknown as number,
    aspectRatio: 3.5,
    resizeMode: 'contain',
    marginTop: 37,
  },
  headerActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 8,
    paddingRight: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    paddingVertical: 8,
    borderBottomWidth: 0,
    backgroundColor: Colors.background,
  },
  filtersContent: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    height: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: pillRadius,
    backgroundColor: '#1A1F24',
    borderWidth: 0,
  },
  filterPillActive: {
    backgroundColor: '#24303A',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EAEAEA',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: pillRadius,
    backgroundColor: '#1A1F24',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EAEAEA',
  },
  venuesList: {
    flex: 1,
  },
  venuesContent: {
    paddingTop: 12,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
