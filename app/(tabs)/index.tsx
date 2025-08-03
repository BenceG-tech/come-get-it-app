import { useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Search, MapPin, Filter } from "lucide-react-native";
import * as Location from "expo-location";
import { useAppContext } from "@/context/AppContext";
import Colors from "@/constants/colors";
import VenueCard from "@/components/VenueCard";
import { venues } from "@/data/venues";

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
        <Text style={styles.logoText}>Come Get It</Text>
      </View>
      
      {/* Filter buttons row - all in one line */}
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterButton, locationEnabled ? styles.activeFilterButton : {}]} 
          onPress={enableLocation}
        >
          <MapPin size={12} color={locationEnabled ? Colors.background : Colors.text} />
          <Text style={[styles.filterButtonText, locationEnabled ? styles.activeFilterButtonText : {}]}>Near Me</Text>
        </TouchableOpacity>
        
        <View style={styles.locationBadge}>
          <Text style={styles.locationBadgeText}>Budapest</Text>
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Open Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => router.push('/filter')}
        >
          <Filter size={12} color={Colors.text} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton}>
          <Search size={16} color={Colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton}>
          <MapPin size={16} color={Colors.text} />
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderHeader()}
      
      <View style={styles.content}>
        {renderLocationPrompt()}
        
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VenueCard venue={item} />}
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.text,
    letterSpacing: 1,
  },
  locationBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
  },
  locationBadgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "500",
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "nowrap",
    paddingHorizontal: 0,
    justifyContent: "space-between",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "transparent",
    gap: 3,
    height: 28,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    color: Colors.text,
    fontWeight: "500",
    fontSize: 10,
  },
  activeFilterButtonText: {
    color: Colors.background,
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
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
});