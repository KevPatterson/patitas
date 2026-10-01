# Migración de Autenticación: Kimi → Autenticación Normal + Google OAuth

## Cambios Realizados

### 1. Sistema de Autenticación
- ✅ Eliminada toda la autenticación con Kimi
- ✅ Implementada autenticación tradicional con email/password
- ✅ Agregado soporte para Google OAuth
- ✅ Implementado hash de contraseñas con bcryptjs

### 2. Estructura de Base de Datos

#### Schema de Usuarios Actualizado
```typescript
users:
  - id (serial, primary key)
  - email (varchar, unique, required)
  - password (varchar, nullable - null para usuarios OAuth)
  - name (varchar)
  - avatar (text)
  - googleId (varchar, unique, nullable)
  - emailVerified (boolean, default false)
  - role (enum: user/admin)
  - createdAt, updatedAt, lastSignInAt
```

**Cambios principales:**
- Eliminado: `unionId`
- Agregado: `email` (ahora requerido y único)
- Agregado: `password` (para autenticación tradicional)
- Agregado: `googleId` (para Google OAuth)
- Agregado: `emailVerified` (para futuras verificaciones)

### 3. Variables de Entorno

#### Eliminadas:
```env
VITE_KIMI_AUTH_URL
VITE_APP_ID
KIMI_AUTH_URL
KIMI_OPEN_URL
OWNER_UNION_ID
```

#### Agregadas:
```env
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
VITE_GOOGLE_CLIENT_ID=tu-client-id
OWNER_EMAIL=admin@ejemplo.com
```

### 4. Archivos Nuevos

#### Backend:
- `api/auth/types.ts` - Tipos de autenticación
- `api/auth/session.ts` - Manejo de sesiones JWT
- `api/auth/password.ts` - Hash y verificación de contraseñas
- `api/auth/google.ts` - Callback de Google OAuth
- `api/auth/middleware.ts` - Middleware de autenticación
- `api/auth/handlers.ts` - Handlers de registro/login

#### Frontend:
- `src/pages/Login.tsx` - Nueva página de login con tabs

### 5. Archivos Eliminados
- `api/kimi/auth.ts`
- `api/kimi/session.ts`
- `api/kimi/types.ts`
- `api/kimi/platform.ts`

### 6. Archivos Modificados
- `db/schema.ts` - Schema de usuarios actualizado
- `api/queries/users.ts` - Queries adaptadas al nuevo schema
- `api/lib/env.ts` - Variables de entorno actualizadas
- `api/context.ts` - Import actualizado
- `api/boot.ts` - Nuevas rutas de autenticación
- `.env.example` - Variables de entorno actualizadas

## Pasos para Completar la Migración

### 1. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ 
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
5. Configura:
   - Tipo: Aplicación web
   - Orígenes autorizados: `http://localhost:3000`, `https://tu-dominio.com`
   - URIs de redirección: `http://localhost:3000/api/oauth/callback`, `https://tu-dominio.com/api/oauth/callback`

### 2. Actualizar Variables de Entorno

Copia `.env.example` a `.env` y completa:

```env
APP_ID=patitas-app
APP_SECRET=tu-secreto-super-seguro-genera-uno-aleatorio

DATABASE_URL=mysql://usuario:password@localhost:3306/patitas

GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

OWNER_EMAIL=tu-email@ejemplo.com
```

### 3. Migrar Base de Datos

```bash
# Generar migración
npm run db:generate

# Aplicar migración (¡CUIDADO! Esto eliminará datos de unionId)
npm run db:migrate
```

⚠️ **IMPORTANTE**: Esta migración eliminará la columna `unionId` y los usuarios existentes no podrán iniciar sesión. Necesitarás:
- Migrar datos de usuarios existentes manualmente, o
- Pedir a los usuarios que se registren nuevamente

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Ejecutar la Aplicación

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Funcionalidades

### Autenticación con Email/Password
- ✅ Registro de nuevos usuarios
- ✅ Login con email y contraseña
- ✅ Hash seguro de contraseñas (bcryptjs)
- ✅ Sesiones con JWT

### Autenticación con Google
- ✅ OAuth 2.0 flow completo
- ✅ Creación automática de usuario en primer login
- ✅ Sincronización de perfil (nombre, avatar)

### Seguridad
- ✅ Contraseñas hasheadas con bcryptjs
- ✅ JWT firmados con secret
- ✅ Cookies httpOnly
- ✅ Validación de entrada con Zod

## Rutas de la API

### HTTP Endpoints
- `POST /api/auth/register` - Registro con email/password
- `POST /api/auth/login` - Login con email/password
- `GET /api/oauth/callback` - Callback de Google OAuth

### tRPC Endpoints
- `auth.me` - Obtener usuario actual
- `auth.logout` - Cerrar sesión

## Notas de Desarrollo

- El primer usuario que se registre con el email configurado en `OWNER_EMAIL` será admin
- Los usuarios de Google no tienen contraseña (campo nullable)
- El campo `emailVerified` está preparado para implementar verificación de email
- Las sesiones JWT expiran en 30 días

## Migración de Datos de Usuarios (Opcional)

Si necesitas migrar usuarios existentes de Kimi a la nueva estructura:

```sql
-- Ejemplo de migración manual
-- ⚠️ Ajusta según tus necesidades

-- 1. Backup de datos actuales
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2. Los usuarios existentes necesitarán registrarse nuevamente
-- O puedes crear un script de migración personalizado
```
