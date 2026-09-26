import { createTRPCRouter } from "./create-context";

// The consumer app currently has no server-side tRPC procedures. Keeping the
// router empty avoids shipping unused public example and venue endpoints.
export const appRouter = createTRPCRouter({});

export type AppRouter = typeof appRouter;
