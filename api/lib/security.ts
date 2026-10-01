import type { Context, Next } from "hono";

/**
 * Middleware de headers de seguridad para producción
 */
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();

    // Prevenir clickjacking
    c.res.headers.set("X-Frame-Options", "DENY");

    // Prevenir MIME sniffing
    c.res.headers.set("X-Content-Type-Options", "nosniff");

    // Referrer Policy
    c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy
    c.res.headers.set(
      "Permissions-Policy",
      "geolocation=(self), microphone=(), camera=()"
    );

    // HSTS para HTTPS (solo en producción)
    if (process.env.NODE_ENV === "production") {
      c.res.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    }

    // Content Security Policy (permisivo para React + Google OAuth + Mapas)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: http:",
      "connect-src 'self' https://accounts.google.com https://*.googleapis.com https://oauth2.googleapis.com",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    c.res.headers.set("Content-Security-Policy", csp);
  };
}

/**
 * Rate limiting simple basado en memoria
 * Para producción con múltiples instancias, considerar Redis
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpieza automática cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  max: number; // Número máximo de requests
  keyGenerator?: (c: Context) => string; // Función para generar la key
}

/**
 * Middleware de rate limiting
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max, keyGenerator = defaultKeyGenerator } = config;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.res.headers.set("Retry-After", retryAfter.toString());
      return c.json(
        { error: "Demasiadas solicitudes. Intente nuevamente más tarde." },
        429
      );
    }

    await next();
  };
}

function defaultKeyGenerator(c: Context): string {
  // Intentar obtener la IP real detrás de proxies
  const forwarded = c.req.header("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const path = c.req.path;
  return `${ip}:${path}`;
}

/**
 * Rate limiter para autenticación (por IP)
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
});

/**
 * Rate limiter para API general (por IP)
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
});

/**
 * Rate limiter estricto para operaciones sensibles
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 requests por hora
});
