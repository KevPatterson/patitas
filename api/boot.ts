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
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  const hostname = "0.0.0.0"; // Importante: escuchar en todas las interfaces para Railway
  
  console.log(`Starting server on ${hostname}:${port}...`);
  
  serve({ fetch: app.fetch, port, hostname }, () => {
    console.log(`✓ Server running on http://${hostname}:${port}/`);
  });
}
