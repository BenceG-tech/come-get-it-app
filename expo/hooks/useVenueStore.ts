import { useMemo } from "react";
import { rest } from "@/lib/supabaseRest";
import type { Venue } from "@/types/venue";

export const useVenueStore = () => {
  const getVenueById = useMemo(() => {
    return async (id: string): Promise<Venue | null> => {
      console.log("[useVenueStore] getVenueById", { id });
      const res = await rest(`/venues?id=eq.${encodeURIComponent(id)}&select=*`);
      const json = (await res.json()) as unknown;
      const rows = Array.isArray(json) ? (json as Venue[]) : [];
      return rows[0] ?? null;
    };
  }, []);

  const getAllVenues = useMemo(() => {
    return async (): Promise<Venue[]> => {
      console.log("[useVenueStore] getAllVenues");
      const res = await rest(`/venues?select=*`);
      const json = (await res.json()) as unknown;
      return Array.isArray(json) ? (json as Venue[]) : [];
    };
  }, []);

  return {
    getVenueById,
    getAllVenues,
  };
};
