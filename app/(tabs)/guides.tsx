import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, FlatList, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { guides } from "@/data/guides";
import { venues } from "@/data/venues";
import { rest } from "@/lib/supabaseRest";
import { useState, useEffect, useMemo } from "react";
import { Venue } from "@/types/venue";

export default function GuidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  
  const CARD_WIDTH = useMemo(() => (width - 8) / 2, [width]); // 2 cards per row with 8px gap

  // Fetch venues from Supabase with fallback
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        console.log('Fetching venues from Supabase for guides...');
        const response = await rest('/venues');
        const data = await response.json();
        console.log('Venues fetched for guides:', data);
        setAllVenues(data && data.length > 0 ? data : venues);
      } catch (error) {
        console.error('Error fetching venues for guides:', error);
        // Fallback to local data if Supabase fails
        console.log('Using fallback venues data for guides');
        setAllVenues(venues);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const getVenuesForGuide = (guideId: string): Venue[] => {
    // Map guide categories to venue filtering logic
    switch (guideId) {
      case '1': // Budapest rejtett koktél gyöngyszemei
        return allVenues.filter(venue => 
          venue.name?.toLowerCase().includes('cocktail') ||
          venue.name?.toLowerCase().includes('boutiq') ||
          venue.name?.toLowerCase().includes('memories') ||
          venue.description?.toLowerCase().includes('cocktail')
        );
      case '2': // Kézműves sör forradalom
        return allVenues.filter(venue => 
          venue.name?.toLowerCase().includes('beer') ||
          venue.name?.toLowerCase().includes('élesztő') ||
          venue.name?.toLowerCase().includes('craft') ||
          venue.description?.toLowerCase().includes('beer')
        );
      case '3': // Tetőterasz paradicsom
        return allVenues.filter(venue => 
          venue.name?.toLowerCase().includes('urban') ||
          venue.name?.toLowerCase().includes('rooftop') ||
          venue.description?.toLowerCase().includes('rooftop') ||
          venue.description?.toLowerCase().includes('panoramic')
        );
      case '4': // Budapest bortúra
        return allVenues.filter(venue => 
          venue.name?.toLowerCase().includes('wine') ||
          venue.name?.toLowerCase().includes('doblo') ||
          venue.description?.toLowerCase().includes('wine')
        );
      default:
        return [];
    }
  };

  const handleGuidePress = (guide: any) => {
    const relevantVenues = getVenuesForGuide(guide.id);
    
    if (relevantVenues.length === 0) {
      // Navigate to a screen showing "no venues" message
      router.push({
        pathname: '/search',
        params: { 
          category: guide.title,
          noResults: 'true'
        }
      });
    } else {
      // Navigate to filtered venues (for now, navigate to main tab with filter)
      router.push('/(tabs)');
    }
  };

  const cardWidthStyle = useMemo(() => ({ width: CARD_WIDTH }), [CARD_WIDTH]);

  const renderGuideCard = ({ item, index }: { item: any; index: number }) => {
    const relevantVenues = getVenuesForGuide(item.id);
    const isLeftCard = index % 2 === 0;
    
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[
          styles.guideCard,
          isLeftCard ? styles.leftCard : styles.rightCard,
          cardWidthStyle
        ]}
        onPress={() => handleGuidePress(item)}
      >
        <Image source={{ uri: item.image }} style={styles.guideImage} />
        <View style={styles.guideOverlay}>
          <Text style={styles.guideTitle}>{item.title}</Text>
          <Text style={styles.guideDescription}>{item.description}</Text>
          <View style={styles.guideInfo}>
            <Text style={styles.guideVenues}>
              {relevantVenues.length} helyszín
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const containerStyle = useMemo(() => ({
    ...styles.container,
    paddingTop: insets.top,
  }), [insets.top]);

  return (
    <View style={containerStyle}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Útmutatók</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Válogatott gyűjtemények minden alkalomra</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Betöltés...</Text>
          </View>
        ) : (
          <FlatList
            data={guides}
            renderItem={renderGuideCard}
            numColumns={2}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.guidesGrid}
            columnWrapperStyle={styles.row}
          />
        )}
        
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>További útmutatók hamarosan</Text>
        </View>
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  content: {
    padding: 4,
    paddingTop: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  guidesGrid: {
    paddingVertical: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  guideCard: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  guideImage: {
    width: "100%",
    height: "100%",
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
    justifyContent: "flex-end",
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 5,
  },
  guideDescription: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 10,
  },
  guideInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideVenues: {
    fontSize: 14,
    color: Colors.textSecondary,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  comingSoon: {
    alignItems: "center",
    marginVertical: 20,
  },
  comingSoonText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  leftCard: {
    marginLeft: 0,
    marginRight: 4,
  },
  rightCard: {
    marginLeft: 4,
    marginRight: 0,
  },
});