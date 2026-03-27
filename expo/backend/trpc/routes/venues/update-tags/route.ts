import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { rest } from '@/lib/supabaseRest';

export const updateVenueTagsRoute = publicProcedure
  .input(z.object({
    venueId: z.string(),
    tags: z.array(z.string()),
  }))
  .mutation(async ({ input }: { input: { venueId: string; tags: string[] } }) => {
    console.info('[tRPC] updateVenueTags', input);
    
    try {
      const response = await rest(`/venues?id=eq.${input.venueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: input.tags }),
      });
      
      const updatedVenue = await response.json();
      
      return {
        success: true,
        venue: updatedVenue[0] || null,
      };
    } catch (error) {
      console.error('[tRPC] Failed to update venue tags:', error);
      throw new Error('Failed to update venue tags');
    }
  });