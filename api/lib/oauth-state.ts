import { randomBytes } from "crypto";

interface StateData {
  redirectUri: string;
  createdAt: number;
}

// Almacenamiento temporal en memoria (para deployments simples)
// En producción con múltiples instancias, considerar Redis
const stateStore = new Map<string, StateData>();

// Limpieza automática de estados expirados
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutos
  
  for (const [key, value] of stateStore.entries()) {
    if (now - value.createdAt > maxAge) {
      stateStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Limpiar cada 5 minutos

/**
 * Genera un state criptográficamente seguro y lo asocia al redirectUri
 */
export function generateOAuthState(redirectUri: string): string {
  const state = randomBytes(32).toString("base64url");
  
  stateStore.set(state, {
    redirectUri,
    createdAt: Date.now(),
  });
  
  return state;
}

/**
 * Valida el state y retorna el redirectUri asociado
 * El state solo puede usarse una vez
 */
export function validateOAuthState(state: string): string | null {
  const data = stateStore.get(state);
  
  if (!data) {
    return null;
  }
  
  // Verificar que no haya expirado (10 minutos)
  const maxAge = 10 * 60 * 1000;
  if (Date.now() - data.createdAt > maxAge) {
    stateStore.delete(state);
    return null;
  }
  
  // Consumir el state (solo se puede usar una vez)
  stateStore.delete(state);
  
  return data.redirectUri;
}
