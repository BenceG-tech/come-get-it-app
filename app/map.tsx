import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { rest } from '@/lib/supabaseRest';
import { Venue } from '@/types/venue';

type SupaVenue = Pick<Venue, 'id' | 'name' | 'address' | 'image_url' | 'plan' | 'created_at'> & { 
  website_url?: string | null; 
  is_paused?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
};



export default function MapScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<SupaVenue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [region, setRegion] = useState({
    latitude: 47.4979,
    longitude: 19.0402,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const loadVenues = useCallback(async () => {
    console.info('[MapScreen] Loading venues for map');
    setLoading(true);
    try {
      const res = await rest('/venues?select=id,name,address,image_url,plan,created_at,website_url,is_paused&order=created_at.desc&limit=50');
      const venueData = (await res.json()) as SupaVenue[];
      
      // Add mock coordinates for Budapest venues
      const mockCoordinates = [
        { latitude: 47.4979, longitude: 19.0402 },
        { latitude: 47.4969, longitude: 19.0412 },
        { latitude: 47.4989, longitude: 19.0392 },
        { latitude: 47.4959, longitude: 19.0422 },
        { latitude: 47.4999, longitude: 19.0382 },
        { latitude: 47.4949, longitude: 19.0432 },
        { latitude: 47.5009, longitude: 19.0372 },
        { latitude: 47.4939, longitude: 19.0442 },
      ];
      
      const venuesWithCoords = venueData.map((venue, index) => ({
        ...venue,
        latitude: mockCoordinates[index % mockCoordinates.length].latitude,
        longitude: mockCoordinates[index % mockCoordinates.length].longitude,
      }));
      
      setVenues(venuesWithCoords);
      console.info('[MapScreen] Loaded venues with mock coordinates:', venuesWithCoords.length);
    } catch (e) {
      console.error('[MapScreen] Load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserLocation = useCallback(async () => {
    if (Platform.OS === 'web') return;
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);
        setRegion({
          ...coords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        console.log('[MapScreen] User location:', coords);
      }
    } catch (error) {
      console.error('[MapScreen] Location error:', error);
    }
  }, []);

  useEffect(() => {
    loadVenues();
    getUserLocation();
  }, [loadVenues, getUserLocation]);

  const handleMarkerPress = (venue: SupaVenue) => {
    router.push(`/venue/${venue.id}`);
  };

  const mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#1d2c4d"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#8ec3b9"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#1a3646"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#4b6878"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#64779e"
        }
      ]
    },
    {
      "featureType": "administrative.province",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#4b6878"
        }
      ]
    },
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#334e87"
        }
      ]
    },
    {
      "featureType": "landscape.natural",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#023e58"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#283d6a"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#6f9ba4"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#1d2c4d"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#023e58"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#3C7680"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#304a7d"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#98a5be"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#1d2c4d"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#2c6675"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#255763"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#b0d5ce"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#023e58"
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#98a5be"
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#1d2c4d"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#283d6a"
        }
      ]
    },
    {
      "featureType": "transit.station",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3a4762"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#0e1626"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#4e6d70"
        }
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Térkép</Text>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/search')}
            >
              <Search size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Map */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={mapStyle}
        showsUserLocation={userLocation !== null}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        rotateEnabled={false}
        pitchEnabled={false}
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
            onPress={() => handleMarkerPress(venue)}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Text style={styles.markerText}>🍺</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity 
          style={styles.myLocationButton}
          onPress={getUserLocation}
        >
          <Text style={styles.myLocationText}>📍</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Helyszínek betöltése...</Text>
        </View>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2BB7FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    fontSize: 20,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    gap: 12,
  },
  myLocationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2BB7FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  myLocationText: {
    fontSize: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
});