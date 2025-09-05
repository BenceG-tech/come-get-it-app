import createContextHook from "@nkzw/create-context-hook";
import { useState } from "react";

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
  const [points, setPoints] = useState<number>(934);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

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