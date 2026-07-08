import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { updateVenueWithDetails } from '@/lib/supabaseProvider';
import { VenueDrink, FreeDrinkWindow } from '@/types/venue';

const VenueDrinkSchema = z.object({
  id: z.string(),
  drinkName: z.string(),
  imageUrl: z.string().nullable().optional(),
  isFreeDrink: z.boolean().nullable().optional(),
  isCover: z.boolean().nullable().optional(),
});

const FreeDrinkWindowSchema = z.object({
  id: z.string(),
  drinkId: z.string(),
  /** Legacy UI index: 0=Monday...6=Sunday. */
  dayOfWeek: z.number().min(0).max(6),
  /** ISO 8601 days: 1=Monday...7=Sunday. Preferred over dayOfWeek. */
  days: z.array(z.number().int().min(1).max(7)).optional(),
  start: z.string(),
  end: z.string(),
});

export const updateVenueDrinksRoute = publicProcedure
  .input(z.object({
    venueId: z.string(),
    drinks: z.array(VenueDrinkSchema),
    freeDrinkWindows: z.array(FreeDrinkWindowSchema),
  }))
  .mutation(async ({ input }) => {
    console.info('[tRPC] updateVenueDrinks', input.venueId, input.drinks.length, input.freeDrinkWindows.length);
    
    try {
      const drinks: VenueDrink[] = input.drinks.map(d => ({
        id: d.id,
        venueId: input.venueId,
        drinkName: d.drinkName,
        imageUrl: d.imageUrl ?? null,
        isFreeDrink: d.isFreeDrink ?? null,
        isCover: d.isCover ?? null,
      }));

      const windows: FreeDrinkWindow[] = input.freeDrinkWindows.map(w => ({
        id: w.id,
        venueId: input.venueId,
        drinkId: w.drinkId,
        dayOfWeek: w.dayOfWeek,
        // Prefer explicit ISO days; fall back to converting the legacy
        // 0-based UI index (0=Monday) to ISO (1=Monday).
        days: w.days && w.days.length > 0 ? w.days : [w.dayOfWeek + 1],
        start: w.start,
        end: w.end,
      }));

      const updatedVenue = await updateVenueWithDetails(input.venueId, {
        drinks,
        freeDrinkWindows: windows,
      });

      return {
        success: true,
        venue: updatedVenue,
      };
    } catch (error) {
      console.error('[tRPC] Failed to update venue drinks:', error);
      throw new Error('Failed to update venue drinks');
    }
  });