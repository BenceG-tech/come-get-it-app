import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Beer } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Venue } from '@/types/venue';
import { rest } from '@/lib/supabaseRest';
import { MapView, Marker, PROVIDER_DEFAULT } from '@/lib/mapComponents';

let Location: any = null;

if (Platform.OS !== 'web') {
  try {
    Location = require('expo-location');
  } catch (e) {
    console.warn('[Map] Failed to load expo-location:', e);
  }
}

export default function MapScreen() {
  const router = useRouter();
  const statusBarStyle = "light" as const;
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  useEffect(() => {
    const fetchVenuesAndLocation = async () => {
      try {
        const venuesResponse = await rest('/venues?select=*');
        let venuesData: Venue[] = await venuesResponse.json();
        console.log('[Map] Fetched venues:', venuesData.length);
        
        // Geocode venues that don't have coordinates
        const venuesWithCoords = await Promise.all(
          venuesData.map(async (venue) => {
            if (venue.latitude && venue.longitude) {
              return venue;
            }
            
            // Try to geocode the address
            if (venue.address) {
              try {
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venue.address + ', Budapest, Hungary')}&limit=1`;
                const geocodeResponse = await fetch(geocodeUrl, {
                  headers: {
                    'User-Agent': 'RorkApp/1.0'
                  }
                });
                const geocodeData = await geocodeResponse.json();
                
                if (geocodeData && geocodeData.length > 0) {
                  const lat = parseFloat(geocodeData[0].lat);
                  const lon = parseFloat(geocodeData[0].lon);
                  console.log(`[Map] Geocoded ${venue.name}: ${lat}, ${lon}`);
                  
                  // Update venue in database
                  await rest(`/venues?id=eq.${venue.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude: lat, longitude: lon })
                  });
                  
                  return { ...venue, latitude: lat, longitude: lon };
                }
              } catch (geocodeError) {
                console.error(`[Map] Failed to geocode ${venue.name}:`, geocodeError);
              }
            }
            
            return venue;
          })
        );
        
        setVenues(venuesWithCoords.filter(v => v.latitude && v.longitude));

        if (Platform.OS !== 'web' && Location) {
          const locationStatus = await Location.requestForegroundPermissionsAsync();
          if (locationStatus.status === 'granted') {
            setLocationPermission(true);
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation(location);
            console.log('[Map] User location:', location.coords);
          } else {
            console.log('[Map] Location permission denied');
          }
        }
      } catch (error) {
        console.error('[Map] Error fetching data:', error);
        Alert.alert('Hiba', 'Nem sikerült betölteni a térképet');
      } finally {
        setLoading(false);
      }
    };

    fetchVenuesAndLocation();
  }, []);

  const initialRegion = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 47.4979,
    longitude: 19.0402,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <StatusBar style={statusBarStyle} />

      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="map-back"
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Térkép</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/search')}
              testID="map-search"
            >
              <Search size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {Platform.OS === 'web' ? (
        <View style={styles.webFallback} testID="web-map-fallback">
          <Text style={styles.webFallbackTitle}>Térkép nem érhető el a web előnézetben</Text>
          <Text style={styles.webFallbackText}>Nyisd meg az appot az Expo Go-val iOS-en vagy Androidon a térképes nézethez.</Text>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.webFallbackButton} testID="web-map-fallback-search">
            <Text style={styles.webFallbackButtonText}>Keresés megnyitása</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Térkép betöltése...</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation={locationPermission}
          showsMyLocationButton={locationPermission}
          testID="map-view"
        >
          {venues.map((venue) => (
            <Marker
              key={venue.id}
              coordinate={{
                latitude: venue.latitude!,
                longitude: venue.longitude!,
              }}
              title={venue.name}
              description={venue.address}
              onCalloutPress={() => router.push(`/venue/${venue.id}`)}
              testID={`marker-${venue.id}`}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Beer size={20} color="#FFFFFF" />
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 12,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  webFallbackTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  webFallbackText: {
    color: '#A6A6AD',
    fontSize: 14,
    textAlign: 'center',
  },
  webFallbackButton: {
    marginTop: 8,
    backgroundColor: '#2BB7FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  webFallbackButtonText: {
    color: '#0B0B0B',
    fontSize: 14,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});