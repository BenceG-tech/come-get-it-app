import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getAllVenuesRoute } from "./routes/venues/get-all/route";
import { getVenueWithDrinksRoute } from "./routes/venues/get-with-drinks/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  venues: createTRPCRouter({
    getAll: getAllVenuesRoute,
    getWithDrinks: getVenueWithDrinksRoute,
  }),
});

export type AppRouter = typeof appRouter;
