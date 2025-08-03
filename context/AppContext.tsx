import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

type AppContextType = {
  locationEnabled: boolean;
  setLocationEnabled: (enabled: boolean) => void;
  points: number;
  addPoints: (amount: number) => void;
  selectedFilters: string[];
  setSelectedFilters: (filters: string[]) => void;
};

export const [AppProvider, useAppContext] = createContextHook<AppContextType>(() => {
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [points, setPoints] = useState<number>(0);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Load saved state from AsyncStorage
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedLocationEnabled = await AsyncStorage.getItem("locationEnabled");
        if (savedLocationEnabled !== null) {
          setLocationEnabled(JSON.parse(savedLocationEnabled));
        }

        const savedPoints = await AsyncStorage.getItem("points");
        if (savedPoints !== null) {
          setPoints(JSON.parse(savedPoints));
        }

        const savedFilters = await AsyncStorage.getItem("selectedFilters");
        if (savedFilters !== null) {
          setSelectedFilters(JSON.parse(savedFilters));
        }
      } catch (error) {
        console.error("Error loading saved state:", error);
      }
    };

    loadSavedState();
  }, []);

  // Save state changes to AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem("locationEnabled", JSON.stringify(locationEnabled));
  }, [locationEnabled]);

  useEffect(() => {
    AsyncStorage.setItem("points", JSON.stringify(points));
  }, [points]);

  useEffect(() => {
    AsyncStorage.setItem("selectedFilters", JSON.stringify(selectedFilters));
  }, [selectedFilters]);

  const addPoints = (amount: number) => {
    setPoints(current => current + amount);
  };

  return {
    locationEnabled,
    setLocationEnabled,
    points,
    addPoints,
    selectedFilters,
    setSelectedFilters,
  };
});