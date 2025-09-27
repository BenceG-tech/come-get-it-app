import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getAllVenuesRoute } from "./routes/venues/get-all/route";
import { updateVenueTagsRoute } from "./routes/venues/update-tags/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  venues: createTRPCRouter({
    getAll: getAllVenuesRoute,
    updateTags: updateVenueTagsRoute,
  }),
});

export type AppRouter = typeof appRouter;