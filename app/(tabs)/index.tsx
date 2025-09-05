import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Search, MapPin, Filter } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import VenueCard from "@/components/VenueCard";
import { venues } from "@/data/venues";
import { useAppContext } from "@/context/AppContext";

export default function BarsScreen() {
  const router = useRouter();
  const { selectedFilters } = useAppContext();
  const insets = useSafeAreaInsets();

  // Apply basic filtering based on selected filters
  const filteredVenues = venues.filter(venue => {
    if (selectedFilters.length === 0) return true;
    
    // For now, just show all venues regardless of filters
    // In a real app, you'd filter based on venue properties
    return true;
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vendéglátóhelyek</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={openSearch} style={styles.headerButton}>
            <Search size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openMap} style={styles.headerButton}>
            <MapPin size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity 
            style={[
              styles.filterPill,
              selectedFilters.includes('nyitva') && styles.filterPillActive
            ]}
            onPress={() => {
              // Toggle the filter
              const newFilters = selectedFilters.includes('nyitva') 
                ? selectedFilters.filter(f => f !== 'nyitva')
                : [...selectedFilters, 'nyitva'];
              // For now, just log the action since we don't have actual filtering logic
              console.log('Toggle nyitva filter:', newFilters);
            }}
          >
            <Text style={[
              styles.filterPillText,
              selectedFilters.includes('nyitva') && styles.filterPillTextActive
            ]}>NYITVA</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterPill,
              selectedFilters.includes('ingyen-ital') && styles.filterPillActive
            ]}
            onPress={() => {
              // Toggle the filter
              const newFilters = selectedFilters.includes('ingyen-ital') 
                ? selectedFilters.filter(f => f !== 'ingyen-ital')
                : [...selectedFilters, 'ingyen-ital'];
              // For now, just log the action since we don't have actual filtering logic
              console.log('Toggle ingyen-ital filter:', newFilters);
            }}
          >
            <Text style={[
              styles.filterPillText,
              selectedFilters.includes('ingyen-ital') && styles.filterPillTextActive
            ]}>Ingyen ital elérhető</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterButton} onPress={openFilter}>
            <Filter size={18} color={Colors.text} />
            <Text style={styles.filterButtonText}>Szűrők</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Venues List */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.background,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  venuesList: {
    flex: 1,
  },
  venuesContent: {
    paddingTop: 16,
    paddingBottom: 100,
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