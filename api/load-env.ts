// Cargar variables de entorno desde .env solo en desarrollo
// En producción, las plataformas como Railway inyectan las variables directamente
if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}
