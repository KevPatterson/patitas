// Cargar variables de entorno (solo en desarrollo)
import "../load-env";

// Debug: Mostrar variables disponibles en producción
if (process.env.NODE_ENV === "production") {
  console.log("=== DEBUG: Environment Variables ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("PORT:", process.env.PORT);
  console.log("APP_SECRET exists:", !!process.env.APP_SECRET);
  console.log("APP_SECRET length:", process.env.APP_SECRET?.length || 0);
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID);
  console.log("GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET);
  console.log("OWNER_EMAIL:", process.env.OWNER_EMAIL);
  console.log("===================================");
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${name}`);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
  return value ?? "";
}

export const env = {
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
  ownerEmail: process.env.OWNER_EMAIL ?? "",
};
