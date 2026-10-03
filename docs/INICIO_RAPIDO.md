# 🚀 Inicio Rápido - Nueva Autenticación

> **TL;DR**: Se eliminó Kimi y se implementó autenticación tradicional + Google OAuth.

## ✅ Lo Que Necesitas Saber

### Antes (Kimi)
- Autenticación con plataforma externa Kimi
- unionId como identificador único
- Dependencia de servicios de Kimi

### Ahora (Nuevo Sistema)
- ✅ Registro/login con email y contraseña
- ✅ Autenticación con Google (OAuth 2.0)
- ✅ Control completo del sistema de autenticación
- ✅ Usuarios identificados por email único

## 🎯 3 Pasos Para Empezar

### 1️⃣ Configurar Google OAuth (15 min)

```bash
# 1. Ir a Google Cloud Console
# 2. Crear proyecto
# 3. Habilitar Google+ API
# 4. Crear credenciales OAuth 2.0
# 5. Copiar Client ID y Secret
```

📖 **Guía detallada**: `docs/CONFIGURAR_GOOGLE_OAUTH.md`

### 2️⃣ Actualizar Variables de Entorno (5 min)

Edita `.env`:

```env
# Mantener existentes
APP_SECRET=c08d5b7e7ceb0c03fdd569044203c907c70cea8394b089f5c0d2aa5a181e5356
DATABASE_URL=mysql://...

# Agregar nuevas
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
OWNER_EMAIL=tu-email@ejemplo.com
```

### 3️⃣ Migrar Base de Datos (5 min)

```bash
# ⚠️ IMPORTANTE: Hacer backup primero
mysqldump -u user -p patitas > backup.sql

# Generar y aplicar migración
npm run db:generate
npm run db:migrate

# Verificar
mysql -u user -p patitas -e "DESCRIBE users;"
```

## 🧪 Probar el Sistema (10 min)

```bash
# Iniciar servidor
npm run dev

# Abrir en navegador
# http://localhost:3000/login
```

**Probar**:
1. ✅ Registro con email/password
2. ✅ Login con email/password
3. ✅ Login con Google
4. ✅ Logout

## 📚 Documentación Completa

- 📘 **Guía Completa**: `MIGRACION_AUTH.md`
- 🔧 **Configurar Google**: `docs/CONFIGURAR_GOOGLE_OAUTH.md`
- ✅ **Checklist**: `CHECKLIST_MIGRACION.md`
- ❓ **FAQ**: `FAQ_MIGRACION.md`
- 📊 **Resumen Técnico**: `RESUMEN_CAMBIOS.md`

## 🔥 Cambios Importantes

### Schema de Usuarios
```typescript
// ELIMINADO
unionId: string

// AGREGADO
email: string (requerido, único)
password: string (nullable para OAuth)
googleId: string (nullable)
emailVerified: boolean
```

### Nuevos Endpoints
```typescript
POST /api/auth/register   // Registro con email/password
POST /api/auth/login      // Login con email/password
GET  /api/oauth/callback  // Callback de Google OAuth

// Existentes (sin cambios)
auth.me (tRPC)            // Obtener usuario actual
auth.logout (tRPC)        // Cerrar sesión
```

### Nuevos Archivos
```
api/auth/
  ├── types.ts       # Tipos TypeScript
  ├── session.ts     # JWT tokens
  ├── password.ts    # Hash de contraseñas
  ├── google.ts      # Google OAuth
  ├── middleware.ts  # Autenticación
  └── handlers.ts    # Login/Registro

src/pages/
  └── Login.tsx      # Nueva UI de login
```

## ⚠️ Usuarios Existentes

**Si tenías usuarios con Kimi**:
- Necesitarán registrarse nuevamente
- Sus publicaciones y datos se mantienen
- Solo cambia la forma de autenticarse

**Recomendación**: Envía email de notificación antes de migrar.

## 🐛 Problemas Comunes

### Error: "GOOGLE_CLIENT_ID is required"
```bash
# Solución: Configurar en .env
GOOGLE_CLIENT_ID=...
```

### Error: "Redirect URI mismatch"
```bash
# Solución: Verificar URI en Google Console
# Debe ser exactamente: http://localhost:3000/api/oauth/callback
```

### Error: "Invalid authentication token"
```bash
# Solución: Limpiar cookies del navegador
# DevTools → Application → Cookies → Clear
```

## ✨ Features Implementados

- ✅ Registro con email/password
- ✅ Login con email/password
- ✅ Google OAuth 2.0
- ✅ Sesiones JWT (30 días)
- ✅ Cookies httpOnly y secure
- ✅ Hash de contraseñas (bcryptjs)
- ✅ Validación con Zod
- ✅ Rol de administrador
- ✅ UI moderna con Radix UI

## 🚀 Deploy a Producción

```bash
# 1. Actualizar URIs en Google OAuth
# - Agregar: https://tu-dominio.com
# - Agregar: https://tu-dominio.com/api/oauth/callback

# 2. Configurar variables de entorno en hosting
# (Railway, Vercel, etc.)

# 3. Build y deploy
npm run build
npm start

# 4. Aplicar migraciones en producción
npm run db:migrate
```

## 🆘 Necesitas Ayuda?

1. **Documentación detallada**:
   - Ver archivos `.md` en la raíz del proyecto

2. **Checklist paso a paso**:
   - `CHECKLIST_MIGRACION.md`

3. **Preguntas frecuentes**:
   - `FAQ_MIGRACION.md`

4. **Código de ejemplo**:
   - Revisar `api/auth/` y `src/pages/Login.tsx`

## 📊 Estado del Proyecto

```bash
✅ Código: 100% completado
✅ TypeScript: Sin errores
✅ Dependencias: Instaladas
✅ Documentación: Completa
⏳ Configuración: Pendiente (Google OAuth)
⏳ Migración BD: Pendiente
⏳ Pruebas: Pendiente
```

## 🎉 Próximos Pasos Sugeridos

Después de la migración:
1. Implementar recuperación de contraseña
2. Agregar verificación de email
3. Implementar rate limiting
4. Agregar más proveedores OAuth (Facebook, GitHub)
5. Implementar 2FA

---

**Tiempo total estimado**: 30-45 minutos

**¿Listo?** Comienza con el Paso 1: Configurar Google OAuth 👆
