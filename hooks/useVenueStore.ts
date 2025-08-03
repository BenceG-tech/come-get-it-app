import { venues } from "@/data/venues";
import { Venue } from "@/types/venue";

export const useVenueStore = () => {
  const getVenueById = (id: string): Venue | undefined => {
    return venues.find(venue => venue.id === id);
  };

  const getAllVenues = (): Venue[] => {
    return venues;
  };

  return {
    getVenueById,
    getAllVenues,
  };
};