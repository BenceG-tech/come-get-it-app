import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function MapScreen() {
  const router = useRouter();
  const statusBarStyle = "light" as const;

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
        <View style={styles.webFallback} testID="native-map-unavailable">
          <Text style={styles.webFallbackTitle}>Térkép nem érhető el</Text>
          <Text style={styles.webFallbackText}>A térkép funkció jelenleg nem elérhető ezen az eszközön.</Text>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.webFallbackButton} testID="native-map-fallback-search">
            <Text style={styles.webFallbackButtonText}>Keresés megnyitása</Text>
          </TouchableOpacity>
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
});