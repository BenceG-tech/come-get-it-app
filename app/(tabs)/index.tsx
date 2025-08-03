import { useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Platform, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Search, MapPin } from "lucide-react-native";
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
      <Image 
        source={{ uri: 'https://r2-pub.rork.com/attachments/2gulws5wgm2v1gfw2nn8w' }}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, locationEnabled ? styles.activeActionButton : {}]} 
          onPress={enableLocation}
        >
          <MapPin size={16} color={locationEnabled ? Colors.background : Colors.text} />
          <Text style={[styles.actionButtonText, locationEnabled ? styles.activeActionButtonText : {}]}>Near Me</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Open Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Free Drink</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Special Offer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
          <Search size={16} color={Colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => console.log('Map view coming soon')}>
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
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#111111",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 140,
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "transparent",
    gap: 6,
  },
  activeActionButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.text,
    fontWeight: "500",
    fontSize: 16,
  },
  activeActionButtonText: {
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