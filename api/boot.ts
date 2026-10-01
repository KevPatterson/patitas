import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createGoogleCallbackHandler } from "./auth/google";
import { handleRegister, handleLogin } from "./auth/handlers";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Rutas de autenticación HTTP
app.post("/api/auth/register", handleRegister);
app.post("/api/auth/login", handleLogin);
app.get(Paths.oauthCallback, createGoogleCallbackHandler());

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  console.log("[PRODUCTION] Starting server...");
  console.log("[PRODUCTION] All environment variables loaded successfully");
  
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  
  console.log("[PRODUCTION] Configuring static file serving...");
  serveStaticFiles(app);
  
  const port = parseInt(process.env.PORT || "3000");
  const hostname = "0.0.0.0";
  
  console.log(`[PRODUCTION] Starting HTTP server on ${hostname}:${port}`);
  
  serve({ fetch: app.fetch, port, hostname }, (info) => {
    console.log(`[PRODUCTION] Server is listening on ${hostname}:${port}`);
    console.log(`[PRODUCTION] Ready to accept HTTP connections`);
  });
}
