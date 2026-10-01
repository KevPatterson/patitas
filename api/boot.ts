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

// Middleware de logging para producción
if (process.env.NODE_ENV === "production") {
  app.use("*", async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    console.log(`[REQUEST] ${method} ${path}`);
    
    try {
      await next();
      const ms = Date.now() - start;
      console.log(`[RESPONSE] ${method} ${path} - ${c.res.status} (${ms}ms)`);
    } catch (error) {
      console.error(`[ERROR] ${method} ${path}:`, error);
      throw error;
    }
  });
}

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Health check endpoint para Railway
app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

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
  
  serve({ 
    fetch: app.fetch, 
    port, 
    hostname 
  }, (info) => {
    console.log(`[PRODUCTION] Server is listening on ${hostname}:${info.port}`);
    console.log(`[PRODUCTION] Ready to accept HTTP connections`);
    console.log(`[PRODUCTION] Health check available at: http://${hostname}:${info.port}/health`);
  });

  // Manejo de errores de Node
  process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT EXCEPTION]', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]', reason);
  });
}
