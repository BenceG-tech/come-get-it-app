import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { venues } from '@/data/venues';
import { Venue } from '@/types/venue';

// Conditionally import react-native-maps only for native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

export default function MapScreen() {
  const router = useRouter();
  const statusBarStyle = "light" as const;
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const budapestCenter = {
    latitude: 47.4979,
    longitude: 19.0402,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const handleMarkerPress = (venue: Venue) => {
    if (!venue || !venue.id || !venue.name?.trim()) return;
    setSelectedVenue(venue);
  };

  const handleVenuePress = (venueId: string) => {
    if (!venueId || !venueId.trim()) return;
    router.push(`/venue/${venueId}`);
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
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={budapestCenter}
            showsUserLocation={true}
            showsMyLocationButton={true}
            testID="venue-map"
          >
            {venues.map((venue) => {
              if (!venue.latitude || !venue.longitude) return null;
              
              return (
                <Marker
                  key={venue.id}
                  coordinate={{
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                  }}
                  title={venue.name}
                  description={venue.address}
                  onPress={() => venue && venue.id && venue.name?.trim() && handleMarkerPress(venue)}
                  testID={`marker-${venue.id}`}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.marker}>
                      <MapPin size={20} color="white" />
                    </View>
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {selectedVenue && (
            <View style={styles.venueCard}>
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{selectedVenue.name}</Text>
                <Text style={styles.venueAddress}>{selectedVenue.address}</Text>
                {selectedVenue.participates_in_points && (
                  <Text style={styles.venuePoints}>
                    {selectedVenue.points_per_visit} pont/látogatás
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => handleVenuePress(selectedVenue.id)}
                testID={`view-venue-${selectedVenue.id}`}
              >
                <Text style={styles.viewButtonText}>Megtekintés</Text>
              </TouchableOpacity>
            </View>
          )}
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    backgroundColor: '#2BB7FF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  venueCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  venueInfo: {
    flex: 1,
    marginRight: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B0B0B',
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  venuePoints: {
    fontSize: 12,
    color: '#2BB7FF',
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#2BB7FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});