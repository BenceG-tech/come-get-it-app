import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { rest } from '@/lib/supabaseRest';


const dayHoursSchema = z.object({
  open: z.string(),
  close: z.string(),
  closed: z.boolean().optional(),
}).nullable();

const openingHoursSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
}).nullable();

export const updateVenueHoursRoute = publicProcedure
  .input(z.object({
    venueId: z.string(),
    openingHours: openingHoursSchema,
  }))
  .mutation(async ({ input }) => {
    console.info('[tRPC] updateVenueHours', input.venueId);
    
    try {
      const response = await rest(`/venues?id=eq.${input.venueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opening_hours: input.openingHours,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update venue hours: ${response.status}`);
      }

      const result = await response.json();
      console.info('[tRPC] updateVenueHours success', result);
      
      return {
        success: true,
        venueId: input.venueId,
        openingHours: input.openingHours,
      };
    } catch (error) {
      console.error('[tRPC] Failed to update venue hours:', error);
      throw new Error('Failed to update venue hours');
    }
  });