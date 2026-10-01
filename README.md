# 🐾 Patitas - Plataforma de Mascotas Perdidas y Adopción

Plataforma web para ayudar a reunir mascotas perdidas con sus familias y facilitar adopciones responsables.

## 🔐 Sistema de Autenticación

Esta aplicación utiliza un sistema de autenticación moderno con:

- ✅ **Registro/Login tradicional** con email y contraseña
- ✅ **Google OAuth 2.0** para inicio de sesión rápido
- ✅ **Sesiones seguras** con JWT y cookies httpOnly
- ✅ **Contraseñas encriptadas** con bcryptjs

### 📖 Nueva Migración de Autenticación

Si vienes de una versión anterior con autenticación Kimi, revisa la documentación de migración:

- **Inicio Rápido**: `INICIO_RAPIDO.md` ⚡
- **Guía Completa**: `MIGRACION_AUTH.md` 📘
- **Configurar Google OAuth**: `docs/CONFIGURAR_GOOGLE_OAUTH.md` 🔧
- **Checklist**: `CHECKLIST_MIGRACION.md` ✅
- **FAQ**: `FAQ_MIGRACION.md` ❓

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ y npm
- MySQL 8+
- Cuenta de Google Cloud Platform (para OAuth)

### Instalación

```bash
# Clonar repositorio
git clone <url-del-repo>
cd app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Configuración de Variables de Entorno

Edita el archivo `.env`:

```env
# Backend
APP_ID=patitas-app
APP_SECRET=tu-secreto-super-seguro
DATABASE_URL=mysql://usuario:password@localhost:3306/patitas

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

# Admin
OWNER_EMAIL=admin@ejemplo.com

# Entorno
NODE_ENV=development
```

📖 **Cómo obtener credenciales de Google**: Ver `docs/CONFIGURAR_GOOGLE_OAUTH.md`

### Migración de Base de Datos

```bash
# Generar migración
npm run db:generate

# Aplicar migración
npm run db:migrate
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en:
# http://localhost:3000
```

### Build para Producción

```bash
# Compilar aplicación
npm run build

# Iniciar servidor de producción
npm start
```

## 🏗️ Stack Tecnológico

### Frontend
- **React 19** - UI Library
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Radix UI** - Componentes accesibles
- **Tailwind CSS** - Estilos
- **tRPC** - Type-safe API client
- **React Router** - Navegación

### Backend
- **Hono** - Web framework
- **tRPC** - Type-safe API
- **Drizzle ORM** - Database ORM
- **MySQL** - Base de datos
- **Jose** - JWT tokens
- **bcryptjs** - Hash de contraseñas
- **Zod** - Validación de datos

### Autenticación
- **JWT** - Tokens de sesión
- **Google OAuth 2.0** - Login social
- **Passport.js** - Estrategias de autenticación

## 📁 Estructura del Proyecto

```
.
├── api/                    # Backend
│   ├── auth/              # Sistema de autenticación
│   │   ├── types.ts       # Tipos TypeScript
│   │   ├── session.ts     # Manejo de JWT
│   │   ├── password.ts    # Hash de contraseñas
│   │   ├── google.ts      # Google OAuth
│   │   ├── middleware.ts  # Middleware de auth
│   │   └── handlers.ts    # Handlers HTTP
│   ├── queries/           # Queries de base de datos
│   ├── lib/               # Utilidades
│   └── boot.ts            # Inicialización del servidor
├── src/                   # Frontend
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas
│   ├── hooks/            # Hooks personalizados
│   └── providers/        # Context providers
├── db/                    # Database
│   ├── schema.ts         # Schema de Drizzle
│   └── migrations/       # Migraciones SQL
├── docs/                  # Documentación
└── contracts/             # Tipos compartidos
```

## 🔐 Endpoints de API

### Autenticación HTTP

```typescript
POST /api/auth/register
Content-Type: application/json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "name": "Nombre Usuario"
}

POST /api/auth/login
Content-Type: application/json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}

GET /api/oauth/callback
# Callback automático de Google OAuth
```

### tRPC Endpoints

```typescript
// Obtener usuario actual
trpc.auth.me.useQuery()

// Cerrar sesión
trpc.auth.logout.useMutation()

// Publicaciones
trpc.publications.list.useQuery()
trpc.publications.create.useMutation()
// ... más endpoints
```

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Verificar tipos TypeScript
npm run check

# Linting
npm run lint
```

## 📊 Schema de Base de Datos

### Tabla: users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) UNIQUE NOT NULL,
  password VARCHAR(255),              -- Null para OAuth
  name VARCHAR(255),
  avatar TEXT,
  googleId VARCHAR(255) UNIQUE,       -- ID de Google
  emailVerified BOOLEAN DEFAULT FALSE,
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  lastSignInAt TIMESTAMP DEFAULT NOW()
);
```

### Otras Tablas

- `publications` - Publicaciones de mascotas
- `publication_images` - Imágenes de publicaciones
- `reports` - Reportes de publicaciones
- `notifications` - Notificaciones
- `sightings` - Avistamientos
- `comments` - Comentarios
- `adoption_requests` - Solicitudes de adopción
- `audit_logs` - Logs de auditoría

Ver `db/schema.ts` para detalles completos.

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcryptjs (10 rounds)
- ✅ JWT firmados con secret
- ✅ Cookies httpOnly y secure (producción)
- ✅ Validación de entrada con Zod
- ✅ SameSite cookies para prevenir CSRF
- ✅ Expiración de sesión: 30 días

### Recomendaciones Adicionales

- Implementar rate limiting en endpoints de auth
- Agregar CAPTCHA en formularios
- Implementar verificación de email
- Agregar autenticación de dos factores (2FA)

## 🚀 Deployment

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables en tu plataforma de hosting:

```env
APP_ID
APP_SECRET
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
VITE_GOOGLE_CLIENT_ID
OWNER_EMAIL
NODE_ENV=production
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Formato, estilos
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests
- `chore:` - Tareas de mantenimiento

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

## 🐛 Reportar Issues

Si encuentras algún problema, por favor:
1. Verifica que no exista un issue similar
2. Crea un nuevo issue con detalles:
   - Descripción del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica

## 📚 Documentación Adicional

- **Guía de Migración**: `MIGRACION_AUTH.md`
- **Configuración Google OAuth**: `docs/CONFIGURAR_GOOGLE_OAUTH.md`
- **FAQ**: `FAQ_MIGRACION.md`
- **Checklist**: `CHECKLIST_MIGRACION.md`
- **Resumen de Cambios**: `RESUMEN_CAMBIOS.md`

## ✨ Features

- [x] Autenticación con email/password
- [x] Google OAuth 2.0
- [x] Gestión de usuarios
- [x] Publicaciones de mascotas perdidas
- [x] Publicaciones de adopción
- [x] Sistema de notificaciones
- [x] Reportes de publicaciones
- [x] Comentarios
- [x] Mapa de avistamientos
- [ ] Verificación de email
- [ ] Recuperación de contraseña
- [ ] Autenticación de dos factores
- [ ] Chat en tiempo real

## 💬 Contacto

Para preguntas o sugerencias, contacta a [tu-email@ejemplo.com]

---

Hecho con ❤️ por la comunidad de Patitas
