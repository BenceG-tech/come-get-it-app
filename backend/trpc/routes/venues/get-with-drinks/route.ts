import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { getVenueWithDetails } from '@/lib/supabaseProvider';

export const getVenueWithDrinksRoute = publicProcedure
  .input(z.object({
    venueId: z.string(),
  }))
  .query(async ({ input }) => {
    console.info('[tRPC] getVenueWithDrinks', input.venueId);
    
    try {
      const venue = await getVenueWithDetails(input.venueId);
      
      if (!venue) {
        throw new Error('Venue not found');
      }

      return {
        venue,
      };
    } catch (error) {
      console.error('[tRPC] Failed to fetch venue with drinks:', error);
      throw new Error('Failed to fetch venue with drinks');
    }
  });