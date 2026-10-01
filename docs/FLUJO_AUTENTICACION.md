# 🔐 Flujo de Autenticación - Diagrama Visual

Este documento explica el flujo completo de autenticación en Patitas.

## 📊 Arquitectura General

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │────▶│   Frontend   │────▶│   Backend    │
│  (Usuario)  │◀────│   (React)    │◀────│   (Hono)     │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │    MySQL     │
                                          │  (Database)  │
                                          └──────────────┘
```

## 🔑 Flujo de Registro con Email/Password

```
┌─────────┐                ┌──────────┐                ┌─────────┐
│ Usuario │                │ Frontend │                │ Backend │
└────┬────┘                └────┬─────┘                └────┬────┘
     │                          │                           │
     │ 1. Completa formulario   │                           │
     │ (email, password, name)  │                           │
     ├─────────────────────────▶│                           │
     │                          │                           │
     │                          │ 2. POST /api/auth/register│
     │                          │   {email, password, name} │
     │                          ├──────────────────────────▶│
     │                          │                           │
     │                          │                      3. Valida datos
     │                          │                         (Zod)
     │                          │                           │
     │                          │                      4. Hashea password
     │                          │                      (bcryptjs)
     │                          │                           │
     │                          │                      5. Inserta usuario
     │                          │                         en DB
     │                          │                           │
     │                          │                      6. Crea JWT token
     │                          │                       (jose)
     │                          │                           │
     │                          │  7. Set-Cookie + JSON     │
     │                          │◀──────────────────────────┤
     │                          │                           │
     │  8. Redirige a /         │                           │
     │◀─────────────────────────┤                           │
     │                          │                           │
```

## 🔓 Flujo de Login con Email/Password

```
┌─────────┐                ┌──────────┐                ┌─────────┐
│ Usuario │                │ Frontend │                │ Backend │
└────┬────┘                └────┬─────┘                └────┬────┘
     │                          │                           │
     │ 1. Ingresa credenciales  │                           │
     │    (email, password)     │                           │
     ├─────────────────────────▶│                           │
     │                          │                           │
     │                          │ 2. POST /api/auth/login   │
     │                          │    {email, password}      │
     │                          ├──────────────────────────▶│
     │                          │                           │
     │                          │                      3. Busca usuario
     │                          │                         por email
     │                          │                           │
     │                          │                      4. Verifica password
     │                          │                       (bcrypt.compare)
     │                          │                           │
     │                          │                      5. Crea JWT token
     │                          │                           │
     │                          │  6. Set-Cookie + JSON     │
     │                          │◀──────────────────────────┤
     │                          │                           │
     │  7. Redirige a /         │                           │
     │◀─────────────────────────┤                           │
     │                          │                           │
```

## 🌐 Flujo de Google OAuth

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│ Usuario │    │ Frontend │    │ Backend │    │  Google  │    │ Database│
└────┬────┘    └────┬─────┘    └────┬────┘    └────┬─────┘    └────┬────┘
     │              │               │              │               │
     │ 1. Clic en   │               │              │               │
     │ "Continuar   │               │              │               │
     │  con Google" │               │              │               │
     ├─────────────▶│               │              │               │
     │              │               │              │               │
     │              │ 2. Genera URL │              │               │
     │              │    de Google  │              │               │
     │              │    OAuth      │              │               │
     │              │               │              │               │
     │  3. Redirige │               │              │               │
     │     a Google │               │              │               │
     ├──────────────┴───────────────┴─────────────▶│               │
     │                                              │               │
     │  4. Pantalla de login de Google             │               │
     │  5. Pantalla de consentimiento              │               │
     │  6. Usuario autoriza                        │               │
     │                                              │               │
     │  7. Callback con code                       │               │
     │◀─────────────┬───────────────┬──────────────┤               │
     │              │               │              │               │
     │              │               │ 8. GET /api/ │               │
     │              │               │    oauth/    │               │
     │              │               │    callback? │               │
     │              │               │    code=XXX  │               │
     │              │               │◀─────────────┤               │
     │              │               │              │               │
     │              │               │ 9. Exchange  │               │
     │              │               │    code por  │               │
     │              │               │    token     │               │
     │              │               ├─────────────▶│               │
     │              │               │              │               │
     │              │               │10. Obtiene   │               │
     │              │               │   perfil de  │               │
     │              │               │   usuario    │               │
     │              │               ├─────────────▶│               │
     │              │               │              │               │
     │              │               │11. Busca/    │               │
     │              │               │    Crea      │               │
     │              │               │    usuario   │               │
     │              │               ├──────────────┴──────────────▶│
     │              │               │                               │
     │              │               │12. Crea JWT                   │
     │              │               │                               │
     │  13. Redirige│               │                               │
     │      a /     │               │                               │
     │◀─────────────┴───────────────┤                               │
     │              │               │                               │
```

## 🔒 Flujo de Autenticación de Requests

```
┌─────────┐                ┌──────────┐                ┌─────────┐
│ Usuario │                │ Frontend │                │ Backend │
└────┬────┘                └────┬─────┘                └────┬────┘
     │                          │                           │
     │ 1. Request a API         │                           │
     │    protegida             │                           │
     ├─────────────────────────▶│                           │
     │                          │                           │
     │                          │ 2. tRPC Query/Mutation    │
     │                          │    Cookie: session=JWT    │
     │                          ├──────────────────────────▶│
     │                          │                           │
     │                          │                      3. Lee cookie
     │                          │                           │
     │                          │                      4. Verifica JWT
     │                          │                        (jose.verify)
     │                          │                           │
     │                          │                      5. Extrae userId
     │                          │                           │
     │                          │                      6. Busca usuario
     │                          │                         en DB
     │                          │                           │
     │                          │                      7. Agrega ctx.user
     │                          │                           │
     │                          │                      8. Ejecuta query
     │                          │                           │
     │                          │  9. Respuesta con datos   │
     │                          │◀──────────────────────────┤
     │                          │                           │
     │ 10. Muestra datos        │                           │
     │◀─────────────────────────┤                           │
     │                          │                           │
```

## 🚪 Flujo de Logout

```
┌─────────┐                ┌──────────┐                ┌─────────┐
│ Usuario │                │ Frontend │                │ Backend │
└────┬────┘                └────┬─────┘                └────┬────┘
     │                          │                           │
     │ 1. Clic en logout        │                           │
     ├─────────────────────────▶│                           │
     │                          │                           │
     │                          │ 2. trpc.auth.logout()     │
     │                          ├──────────────────────────▶│
     │                          │                           │
     │                          │                      3. Borra cookie
     │                          │                        (maxAge: 0)
     │                          │                           │
     │                          │  4. Set-Cookie: session=  │
     │                          │     (vacío)               │
     │                          │◀──────────────────────────┤
     │                          │                           │
     │                          │ 5. utils.invalidate()     │
     │                          │    (limpia cache)         │
     │                          │                           │
     │  6. Redirige a /login    │                           │
     │◀─────────────────────────┤                           │
     │                          │                           │
```

## 🔐 Seguridad en las Capas

### 1. Frontend (Browser)

```
┌──────────────────────────────────────┐
│          Frontend Security           │
├──────────────────────────────────────┤
│ ✅ No almacena contraseñas           │
│ ✅ Cookie httpOnly (JS no accede)    │
│ ✅ Validación de formularios (Zod)   │
│ ✅ HTTPS en producción               │
│ ✅ SameSite cookies (CSRF)           │
└──────────────────────────────────────┘
```

### 2. Backend (API)

```
┌──────────────────────────────────────┐
│          Backend Security            │
├──────────────────────────────────────┤
│ ✅ Hash de passwords (bcryptjs)      │
│ ✅ JWT firmados (HMAC-SHA256)        │
│ ✅ Validación de entrada (Zod)       │
│ ✅ Rate limiting (recomendado)       │
│ ✅ Escape de SQL (Drizzle ORM)       │
└──────────────────────────────────────┘
```

### 3. Database

```
┌──────────────────────────────────────┐
│         Database Security            │
├──────────────────────────────────────┤
│ ✅ Passwords hasheadas (nunca plain) │
│ ✅ Email único (constraint)          │
│ ✅ Conexión segura (SSL)             │
│ ✅ Backups regulares                 │
└──────────────────────────────────────┘
```

## 🎯 Estados de Autenticación

```
┌──────────────┐
│  No autenticado  │
└────────┬─────────┘
         │
         │ Login/Registro exitoso
         │
         ▼
┌──────────────┐
│  Autenticado │◀────┐
│  (con sesión)│     │
└────────┬─────┘     │
         │           │
         │           │ Refresh token
         │           │ (antes de expirar)
         │           │
         ├───────────┘
         │
         │ Logout / Token expirado
         │
         ▼
┌──────────────┐
│ No autenticado │
└──────────────┘
```

## 🔄 Ciclo de Vida de la Sesión

```
Registro/Login
      │
      ▼
┌─────────────┐
│ JWT creado  │──────────────────────┐
│ Expira: 30d │                      │
└─────┬───────┘                      │
      │                              │
      │ Cada request                 │
      │                              │
      ▼                              │
┌─────────────┐                      │
│JWT validado │                      │
│ctx.user set │                      │
└─────┬───────┘                      │
      │                              │
      │                              │
      │                              ▼
      │                      ┌────────────┐
      │                      │   Token    │
      │                      │  expira    │
      │                      └─────┬──────┘
      │                            │
      │                            ▼
      │                      ┌────────────┐
      │                      │  Usuario   │
      │                      │ debe hacer │
      │                      │login de    │
      │                      │nuevo       │
      │                      └────────────┘
      │
      │ Logout manual
      │
      ▼
┌─────────────┐
│Cookie borrada│
│Sesión termina│
└──────────────┘
```

## 📝 Resumen de Componentes

### Frontend
- `src/pages/Login.tsx` - UI de login/registro
- `src/hooks/useAuth.ts` - Hook de autenticación
- `src/providers/trpc.tsx` - Cliente tRPC

### Backend
- `api/auth/handlers.ts` - Handlers de login/registro
- `api/auth/google.ts` - Google OAuth callback
- `api/auth/middleware.ts` - Verificación de sesión
- `api/auth/session.ts` - Creación/verificación JWT
- `api/auth/password.ts` - Hash de contraseñas

### Database
- `db/schema.ts` - Schema de usuarios
- `api/queries/users.ts` - Queries de usuarios

## 🔗 Referencias

- [JWT.io](https://jwt.io) - Debugger de JWT
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [bcryptjs Docs](https://github.com/dcodeIO/bcrypt.js)
- [Hono Docs](https://hono.dev)
- [tRPC Docs](https://trpc.io)

---

**Última actualización**: Migración de autenticación completada
