import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { publicationsRouter } from "./publications-router";
import {
  reportsRouter,
  notificationsRouter,
  commentsRouter,
  sightingsRouter,
  adoptionsRouter,
  adminRouter,
} from "./community-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  publications: publicationsRouter,
  reports: reportsRouter,
  notifications: notificationsRouter,
  comments: commentsRouter,
  sightings: sightingsRouter,
  adoptions: adoptionsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
