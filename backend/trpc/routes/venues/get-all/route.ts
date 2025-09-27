import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { rest } from '@/lib/supabaseRest';
import { Venue } from '@/types/venue';

export const getAllVenuesRoute = publicProcedure
  .input(z.object({
    limit: z.number().optional(),
    offset: z.number().optional(),
  }).optional())
  .query(async ({ input }: { input?: { limit?: number; offset?: number } }) => {
    console.info('[tRPC] getAllVenues', input);
    
    const limit = input?.limit ?? 50;
    const offset = input?.offset ?? 0;
    
    try {
      const response = await rest(`/venues?select=*&limit=${limit}&offset=${offset}&order=created_at.desc`);
      const venues: Venue[] = await response.json();
      
      return {
        venues: venues || [],
        total: venues?.length || 0,
      };
    } catch (error) {
      console.error('[tRPC] Failed to fetch venues:', error);
      throw new Error('Failed to fetch venues');
    }
  });