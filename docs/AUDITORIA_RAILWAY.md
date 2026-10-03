# Auditoría y Correcciones para Producción en Railway

## ✅ Cambios Implementados

### 🔧 Servidor y Configuración

- **Puerto dinámico**: El servidor ahora usa `process.env.PORT` en lugar de puerto fijo
- **Hostname correcto**: El servidor escucha en `0.0.0.0` para Railway
- **Health check**: Endpoint `GET /health` funcionando correctamente
- **Validación de APP_SECRET**: Mínimo 32 caracteres en producción

### 🗄️ Base de Datos

- **Modo de conexión MySQL corregido**: Cambiado de `mode: "planetscale"` a `mode: "default"` para MySQL normal de Railway
- **Migraciones versionadas**: Eliminada la exclusión `db/migrations/*.sql` del `.gitignore`
- **Migración generada**: `0000_messy_spiral.sql` lista para aplicar

### 🔐 Seguridad

#### Autenticación y Sesión
- **Cookies seguras**: 
  - `httpOnly: true`
  - `secure: true` (en producción)
  - `sameSite: "Lax"` (sin cross-origin innecesario)
  
#### OAuth Google
- **State criptográficamente seguro**: 
  - Implementado `api/lib/oauth-state.ts`
  - State generado con `crypto.randomBytes(32)`
  - Validación one-time-use
  - Expiración de 10 minutos
  - Almacenamiento temporal en memoria (para producción con múltiples instancias, considerar Redis)

#### Slugs Seguros
- **Generación con crypto**: Cambiado de `Math.random()` a `randomBytes(3).toString('hex')`

#### Headers de Seguridad
- Implementado middleware `securityHeaders()`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `Strict-Transport-Security` (en producción)
  - `Content-Security-Policy` (compatible con React + Google OAuth + Mapas)

#### Rate Limiting
- Implementado sistema de rate limiting en memoria:
  - **Autenticación**: 10 intentos / 15 minutos
  - **API general**: 100 requests / minuto
  - **Operaciones sensibles**: 5 requests / hora
  - **Reportes**: Máximo 10 por día por usuario
  - Prevención de spam en reportes: no permitir múltiples reportes del mismo usuario a la misma publicación

### 💾 Almacenamiento de Imágenes

#### Nueva Implementación S3
- **Archivo**: `api/lib/s3-storage.ts`
- **Características**:
  - Compatible con S3 (AWS S3, Cloudflare R2, etc.)
  - URLs firmadas temporales (10 minutos por defecto)
  - Soporte para batch operations
  - Manejo de errores robusto
  - Nunca expone credenciales al navegador

#### Variables de Entorno Requeridas
```env
S3_ENDPOINT=              # Ejemplo: https://xxxxx.r2.cloudflarestorage.com
S3_REGION=                # Ejemplo: auto (para R2)
S3_ACCESS_KEY_ID=         # Access Key
S3_SECRET_ACCESS_KEY=     # Secret Key (NUNCA exponer)
S3_BUCKET=                # Nombre del bucket
```

#### Migración desde Kimi Storage
- El código anterior que dependía de variables `KIMI_*` sigue presente en `api/lib/storage.ts` pero ya no se usa
- La aplicación ahora usa `getStorage()` de `api/lib/s3-storage.ts`
- Las imágenes existentes en el almacenamiento antiguo deben migrarse manualmente al nuevo bucket S3

### 🔒 Control de Acceso

- **Verificación de permisos**: Todos los endpoints críticos verifican propiedad o rol admin
- **Privacidad de datos sensibles**:
  - `microchip` nunca expuesto públicamente
  - `ownerId` nunca expuesto públicamente
  - Contactos solo según permisos configurados
  - Coordenadas difuminadas (~1-2 km)

### 📝 Logging y Monitoreo

- **Logging seguro**: Nunca imprime credenciales completas
- **Logging de producción**: Request/Response timing
- **Manejo de errores**: Captura de `uncaughtException` y `unhandledRejection`
- **Mensajes genéricos**: Stack traces solo en logs internos, nunca expuestos al cliente

### 🧪 Validación de Entrada

- **Tamaño de imágenes**: Máximo 8 MB
- **Tipos de imagen**: Solo JPEG, PNG, WebP
- **Límites de publicaciones**: 10 publicaciones por día por usuario
- **Validación de formato**: Zod schemas en todos los endpoints

### 🚀 Dockerfile

- **Multi-stage build**: Optimizado para producción
- **Node 20 Alpine**: Imagen base ligera
- **Solo dependencias de producción**: `npm ci --omit=dev`
- **Puerto expuesto**: 3000 (Railway lo mapea automáticamente)

## ⚠️ Pendiente de Configurar en Railway

### Variables de Entorno Obligatorias

```env
# Backend
APP_SECRET=                    # Mínimo 32 caracteres aleatorios
NODE_ENV=production

# Database
DATABASE_URL=                  # Proporcionado por Railway MySQL

# Google OAuth
GOOGLE_CLIENT_ID=              # Desde Google Cloud Console
GOOGLE_CLIENT_SECRET=          # Desde Google Cloud Console (backend only)
VITE_GOOGLE_CLIENT_ID=         # Mismo que GOOGLE_CLIENT_ID (expuesto a navegador)

# Storage S3 (Cloudflare R2 recomendado)
S3_ENDPOINT=                   # Endpoint de tu bucket
S3_REGION=                     # Región (ej: auto para R2)
S3_ACCESS_KEY_ID=              # Access Key ID
S3_SECRET_ACCESS_KEY=          # Secret Access Key
S3_BUCKET=                     # Nombre del bucket

# Admin (opcional)
OWNER_EMAIL=                   # Email que recibirá rol admin automáticamente
```

### Pasos de Despliegue en Railway

1. **Crear servicio MySQL** en Railway
2. **Copiar DATABASE_URL** a variables de entorno
3. **Configurar Google OAuth**:
   - Agregar `https://TU_DOMINIO.railway.app/api/oauth/callback` como redirect URI autorizado
4. **Configurar Cloudflare R2** (o S3 compatible):
   - Crear bucket
   - Generar Access Key
   - Copiar credenciales a variables de entorno
5. **Ejecutar migraciones**:
   ```bash
   npm run db:push
   ```
6. **Verificar despliegue**:
   - Visitar `https://TU_DOMINIO.railway.app/health`
   - Debe retornar `{"status":"ok",...}`

## ❌ Problemas Conocidos (No Bloqueantes)

### Frontend
- Algunos warnings de ESLint en componentes UI (react-hooks, react-refresh)
- El componente `AuthLayout.tsx` tiene un warning de `setState` dentro de `useEffect`
- Componente `sidebar.tsx` usa `Math.random()` en render (debería usar `useState` con valor inicial)

### OAuth Frontend
- El frontend aún genera el state con `btoa(redirectUri)` en `src/pages/Login.tsx`
- **Recomendación**: Actualizar para usar el endpoint `auth.getOAuthState` del backend

### Almacenamiento Legacy
- El archivo `api/lib/storage.ts` (Kimi Storage) aún existe pero no se usa
- **Recomendación**: Eliminar una vez confirmada la migración completa a S3

## 📊 Resumen de Archivos Modificados

### Nuevos
- `api/lib/oauth-state.ts` - OAuth state seguro
- `api/lib/s3-storage.ts` - Storage S3-compatible
- `api/lib/security.ts` - Headers de seguridad y rate limiting
- `db/migrations/0000_messy_spiral.sql` - Migración inicial

### Modificados
- `api/boot.ts` - Puerto dinámico, seguridad, rate limiting
- `api/lib/env.ts` - Validación de APP_SECRET
- `api/lib/cookies.ts` - SameSite=Lax
- `api/queries/connection.ts` - mode: "default"
- `api/auth/google.ts` - State OAuth seguro
- `api/auth-router.ts` - Endpoint getOAuthState
- `api/publications-router.ts` - Slugs crypto, S3 storage
- `api/community-router.ts` - Rate limiting en reportes
- `.env.example` - Nuevas variables S3
- `.gitignore` - Permitir migraciones SQL
- `drizzle.config.ts` - Sin cambios necesarios

## 🔍 Verificación Post-Despliegue

```bash
# Health check
curl https://TU_DOMINIO.railway.app/health

# Debería retornar:
# {"status":"ok","timestamp":"...","env":"production"}

# Build local
npm run build
npm run check

# Verificar que no haya errores críticos
npm run lint
```

## 🎯 Próximos Pasos Recomendados

1. **Migrar frontend OAuth**: Usar `auth.getOAuthState` en lugar de `btoa()`
2. **Actualizar imágenes**: Migrar imágenes del sistema Kimi antiguo a S3
3. **Redis para rate limiting**: Si se escala a múltiples instancias
4. **Monitoring**: Configurar herramienta de monitoring (Sentry, LogRocket, etc.)
5. **Backups automatizados**: Configurar backup de base de datos MySQL
6. **CDN**: Considerar CloudFlare en frente para caching y DDoS protection

## ✅ Estado Final

- ✅ **TypeScript**: Compila sin errores
- ✅ **Build**: Completo exitosamente
- ✅ **Migraciones**: Generadas y listas
- ✅ **Seguridad**: Headers, rate limiting, OAuth seguro
- ✅ **Almacenamiento**: Sistema S3 implementado
- ✅ **Dockerfile**: Optimizado para producción
- ⚠️ **ESLint**: Warnings no críticos en frontend (mejoras opcionales)

El proyecto está **listo para desplegar en Railway** una vez configuradas las variables de entorno.
