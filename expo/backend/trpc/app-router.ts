import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getAllVenuesRoute } from "./routes/venues/get-all/route";
import { updateVenueTagsRoute } from "./routes/venues/update-tags/route";
import { updateVenueDrinksRoute } from "./routes/venues/update-drinks/route";
import { getVenueWithDrinksRoute } from "./routes/venues/get-with-drinks/route";
import { updateVenueHoursRoute } from "./routes/venues/update-hours/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  venues: createTRPCRouter({
    getAll: getAllVenuesRoute,
    updateTags: updateVenueTagsRoute,
    updateDrinks: updateVenueDrinksRoute,
    getWithDrinks: getVenueWithDrinksRoute,
    updateHours: updateVenueHoursRoute,
  }),
});

export type AppRouter = typeof appRouter;