import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  // En producción, el código está en dist/boot.js
  // Los archivos estáticos están en dist/public
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, "./public");
  
  console.log("Static files path:", distPath);
  console.log("Directory exists:", fs.existsSync(distPath));
  
  if (!fs.existsSync(distPath)) {
    console.error("❌ dist/public directory not found!");
    console.error("Current directory:", __dirname);
    console.error("Available files:", fs.readdirSync(__dirname));
  }

  app.use("*", serveStatic({ root: "./dist/public" }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    
    if (!fs.existsSync(indexPath)) {
      console.error("❌ index.html not found at:", indexPath);
      return c.json({ error: "index.html not found" }, 500);
    }
    
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}
