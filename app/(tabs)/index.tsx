import { useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Platform, Image } from "react-native";
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

  const openFilters = () => {
    router.push("/filter");
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Image 
        source={{ uri: 'https://r2-pub.rork.com/attachments/2gulws5wgm2v1gfw2nn8w' }}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
          <Search color={Colors.text} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Map view coming soon')}>
          <MapPin color={Colors.text} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );



  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      <TouchableOpacity 
        style={[styles.filterButton, locationEnabled ? styles.activeFilterButton : {}]} 
        onPress={enableLocation}
      >
        <MapPin size={10} color={locationEnabled ? Colors.background : Colors.text} />
        <Text style={[styles.filterButtonText, locationEnabled ? styles.activeFilterButtonText : {}]}>Near Me</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Open Now</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Free Drink</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>Special Offer</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterButton} onPress={openFilters}>
        <Filter size={10} color={Colors.text} />
      </TouchableOpacity>
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
        {renderFilterBar()}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 4,
    backgroundColor: Colors.background,
  },
  logo: {
    width: 60,
    height: 24,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },

  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 3,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    color: Colors.text,
    fontWeight: "500",
    fontSize: 11,
  },
  activeFilterButtonText: {
    color: Colors.background,
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