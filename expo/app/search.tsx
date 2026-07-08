import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import VenueCard from '@/components/VenueCard';
import { fetchVenues } from '@/lib/venueService';
import { Venue } from '@/types/venue';

type SupaVenue = Pick<Venue, 'id' | 'name' | 'address' | 'image_url' | 'plan' | 'created_at'> & { 
  website_url?: string | null; 
  is_paused?: boolean | null;
};

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [venues, setVenues] = useState<SupaVenue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<SupaVenue[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we're showing "no results" for a specific category
  const categoryName = params.category as string;
  const showNoResults = params.noResults === 'true';

  const loadVenues = useCallback(async () => {
    console.info('[SearchScreen] Loading venues for search');
    setLoading(true);
    setError(null);
    try {
      const venueData = await fetchVenues({
        columns: 'id,name,address,image_url,plan,created_at,website_url,is_paused',
        limit: 100,
      });
      setVenues(venueData as SupaVenue[]);
      console.info('[SearchScreen] Loaded venues for search:', venueData.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[SearchScreen] Load error', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVenues([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = venues.filter(venue => 
      venue.name?.toLowerCase().includes(query) ||
      venue.address?.toLowerCase().includes(query)
    );
    setFilteredVenues(filtered);
  }, [searchQuery, venues]);

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredVenues([]);
  };

  const renderEmptyState = () => {
    if (showNoResults && categoryName) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nincs releváns helyszín</Text>
          <Text style={styles.emptySubtext}>
            A &quot;{categoryName}&quot; kategóriában jelenleg nincs elérhető helyszín.
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Keresés...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>Hiba történt a keresés során</Text>
        </View>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Írj be egy helyszín nevét vagy címét</Text>
        </View>
      );
    }

    if (filteredVenues.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nincs találat a keresésre</Text>
        </View>
      );
    }

    return null;
  };

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
          
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={showNoResults ? `Keresés a "${categoryName}" kategóriában...` : 'Keresés helyszínekben...'}
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={!showNoResults}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Results */}
      <View style={styles.content}>
        {renderEmptyState()}
        
        {filteredVenues.length > 0 && (
          <FlatList
            data={filteredVenues}
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.venueList}
            keyboardShouldPersistTaps="handled"
          />
        )}
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
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    opacity: 0.8,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  venueList: {
    paddingTop: 0,
    paddingBottom: 32,
  },
});