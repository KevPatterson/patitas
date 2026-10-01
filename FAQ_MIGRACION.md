# ❓ Preguntas Frecuentes - Migración de Autenticación

## General

### ¿Por qué se cambió el sistema de autenticación?

Se eliminó la dependencia de Kimi para implementar un sistema de autenticación estándar y ampliamente utilizado, lo que proporciona:
- Mayor control sobre el flujo de autenticación
- Integración con Google OAuth (y potencial para otros proveedores)
- Mejor experiencia de usuario
- Código más mantenible y portable

### ¿Puedo revertir los cambios?

Técnicamente sí, pero NO se recomienda una vez que hayas migrado la base de datos. Si necesitas revertir:
1. Restaura el backup de tu base de datos
2. Revierte los commits del código
3. Vuelve a desplegar

**⚠️ IMPORTANTE**: Cualquier usuario que se haya registrado con el nuevo sistema NO podrá autenticarse en el sistema antiguo.

### ¿Cuánto tiempo toma la migración?

- **Configuración inicial**: 30-60 minutos
- **Pruebas en desarrollo**: 15-30 minutos
- **Despliegue a producción**: 15-30 minutos
- **Total estimado**: 1-2 horas

## Usuarios Existentes

### ¿Qué pasa con los usuarios existentes?

Los usuarios que tenían cuenta con Kimi necesitarán:
- **Si tienen email registrado**: Registrarse nuevamente con ese email
- **Si NO tienen email**: Crear una cuenta nueva

**Recomendación**: Envía un email de notificación a tus usuarios antes de la migración.

### ¿Se pierden los datos de los usuarios?

NO se pierden los datos asociados a los usuarios (publicaciones, comentarios, etc.). Solo cambia la forma de autenticación.

Sin embargo, la columna `unionId` se elimina, por lo que:
- Los IDs internos (`id`) de usuario se mantienen
- Las relaciones con otras tablas se mantienen
- Solo se pierde la conexión con el sistema de Kimi

### ¿Puedo migrar automáticamente a mis usuarios?

Depende:
- **Si tienen email**: Podrías mantener sus datos, pero deberán establecer una nueva contraseña
- **Si NO tienen email**: No hay forma de contactarlos automáticamente

Ver `db/migrate-users.example.ts` para ideas de migración.

## Google OAuth

### ¿Es obligatorio usar Google OAuth?

NO. El sistema soporta:
1. **Registro/Login tradicional**: Email + contraseña
2. **Google OAuth**: Opcional, pero recomendado para mejor UX

Los usuarios pueden elegir cualquiera de los dos métodos.

### ¿Puedo agregar otros proveedores OAuth?

SÍ. El código está estructurado para facilitar la adición de:
- Facebook OAuth
- GitHub OAuth
- Apple Sign In
- etc.

Solo necesitarías:
1. Crear un archivo similar a `api/auth/google.ts`
2. Agregar las credenciales en `.env`
3. Actualizar la interfaz de login

### ¿Qué pasa si Google cambia sus APIs?

El flujo OAuth 2.0 es un estándar que Google soporta a largo plazo. Es poco probable que cambien drásticamente. Si lo hacen, se necesitaría actualizar el código de `api/auth/google.ts`.

### ¿Necesito verificar mi aplicación con Google?

Depende del número de usuarios:
- **Menos de 100 usuarios en modo Testing**: NO se requiere verificación
- **Más usuarios o aplicación publicada**: SÍ se requiere verificación de Google

Ver: [Proceso de verificación de Google](https://support.google.com/cloud/answer/9110914)

## Base de Datos

### ¿Puedo hacer la migración sin perder datos?

SÍ, si haces backup antes. La migración solo afecta la tabla `users`:
- Se elimina la columna `unionId`
- Se agregan columnas: `password`, `googleId`, `emailVerified`
- Se cambia `email` a requerido y único

Todas las demás tablas permanecen intactas.

### ¿Qué pasa si la migración falla?

Si `npm run db:migrate` falla:
1. **NO entres en pánico**
2. Revisa el error específico
3. Restaura el backup si es necesario
4. Corrige el problema (generalmente permisos o conexión)
5. Intenta nuevamente

### ¿Cómo hago backup de mi base de datos?

**MySQL**:
```bash
mysqldump -u usuario -p nombre_bd > backup.sql
```

**Restaurar**:
```bash
mysql -u usuario -p nombre_bd < backup.sql
```

## Seguridad

### ¿Es seguro almacenar contraseñas?

SÍ, las contraseñas NO se almacenan en texto plano. Se usa:
- **bcryptjs** con 10 rounds de salt
- Hash unidireccional (no se puede "desencriptar")
- Cada contraseña tiene un salt único

### ¿Qué pasa si alguien roba mi APP_SECRET?

Si `APP_SECRET` se compromete:
1. Genera uno nuevo
2. Actualiza en `.env`
3. Todos los tokens JWT existentes se invalidan
4. Los usuarios deberán volver a iniciar sesión

**Prevención**:
- NUNCA subas `.env` a repositorios públicos
- Usa `.gitignore` correctamente
- Rota el secret periódicamente

### ¿Cómo se protegen las sesiones?

Las sesiones usan:
- **JWT** firmados con `APP_SECRET`
- **Cookies httpOnly** (no accesibles desde JavaScript)
- **Secure flag** en producción (solo HTTPS)
- **SameSite** para prevenir CSRF
- **Expiración** de 30 días

### ¿Hay protección contra ataques de fuerza bruta?

NO está implementado por defecto. Se recomienda agregar:
- Rate limiting (ej: express-rate-limit)
- Captcha después de X intentos fallidos
- Bloqueo temporal de cuenta

## Desarrollo

### ¿Puedo probar sin configurar Google OAuth?

SÍ. El login con email/password funciona independientemente. Google OAuth es opcional.

### ¿Cómo pruebo en localhost?

1. Configura Google OAuth con `http://localhost:3000`
2. Usa las credenciales en `.env`
3. Ejecuta `npm run dev`
4. Navega a `http://localhost:3000/login`

### ¿Funciona en desarrollo con HTTP?

SÍ. Las cookies `secure` solo se activan en producción (`NODE_ENV=production`).

### ¿Cómo depuro problemas de autenticación?

1. **Revisa las cookies**: DevTools → Application → Cookies
2. **Revisa la consola del navegador**: Errores de JavaScript
3. **Revisa logs del servidor**: `console.log` y `console.error`
4. **Usa herramientas de red**: DevTools → Network → ver requests

## Producción

### ¿Qué variables de entorno necesito en producción?

Todas las de `.env.example`:
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

### ¿Cómo actualizo las URIs de Google OAuth para producción?

1. Ve a Google Cloud Console → Credenciales
2. Edita tu cliente OAuth
3. Agrega tu dominio de producción:
   - Orígenes: `https://tu-dominio.com`
   - URIs: `https://tu-dominio.com/api/oauth/callback`

### ¿Puedo usar el mismo cliente OAuth para dev y prod?

SÍ, pero NO es recomendado por seguridad. Es mejor:
- Cliente separado para desarrollo
- Cliente separado para producción

### ¿Qué pasa si olvido configurar una variable de entorno?

La aplicación lanzará un error al iniciar si `NODE_ENV=production` y falta una variable requerida. En desarrollo, usará valores vacíos.

## Errores Comunes

### "GOOGLE_CLIENT_ID is required"

**Causa**: Falta la variable en `.env`

**Solución**: Agrega la variable en `.env` y reinicia el servidor

### "Invalid authentication token"

**Causa**: Token JWT inválido o expirado

**Solución**: 
1. Limpia las cookies del navegador
2. Vuelve a iniciar sesión

### "Redirect URI mismatch"

**Causa**: La URI de callback no coincide con Google OAuth

**Solución**: Verifica que la URI en Google Console coincida exactamente con la de tu aplicación

### "User not found"

**Causa**: El usuario fue eliminado de la base de datos pero tiene sesión activa

**Solución**: Cierra sesión y vuelve a registrarte

### "Email already registered"

**Causa**: Ya existe un usuario con ese email

**Solución**: Usa otro email o intenta iniciar sesión en lugar de registrarte

## Rendimiento

### ¿Afecta el rendimiento usar Google OAuth?

Mínimamente. El proceso OAuth requiere:
1. Redirección a Google (1-2s)
2. Autorización del usuario (variable)
3. Callback y creación de sesión (< 1s)

Después de la autenticación inicial, el rendimiento es idéntico.

### ¿Cuántas sesiones simultáneas soporta?

Depende de tu servidor y base de datos. Los JWT son stateless, así que:
- No se almacenan sesiones en memoria
- Solo se valida el token en cada request
- Escala horizontalmente sin problemas

## Futuras Mejoras

### ¿Puedo agregar recuperación de contraseña?

SÍ. Necesitarías:
1. Crear endpoint para solicitar reset
2. Generar token temporal
3. Enviar email con link de reset
4. Crear página para establecer nueva contraseña

### ¿Puedo agregar verificación de email?

SÍ. El campo `emailVerified` ya existe. Necesitarías:
1. Generar token de verificación
2. Enviar email con link
3. Crear endpoint para verificar token
4. Actualizar `emailVerified = true`

### ¿Puedo agregar autenticación de dos factores?

SÍ. Necesitarías:
1. Agregar campos para TOTP secret
2. Implementar generación de códigos QR
3. Validar TOTP en login
4. Agregar códigos de backup

## Soporte

### ¿Dónde puedo obtener ayuda?

1. **Documentación**:
   - `MIGRACION_AUTH.md` - Guía completa
   - `CONFIGURAR_GOOGLE_OAUTH.md` - Google OAuth paso a paso
   - `CHECKLIST_MIGRACION.md` - Lista de verificación

2. **Código**:
   - Revisa comentarios en el código
   - Busca ejemplos en los archivos `api/auth/`

3. **Comunidad**:
   - Stack Overflow (tag: passport, google-oauth)
   - GitHub Issues del proyecto

### ¿Puedo contratar soporte técnico?

Contacta al desarrollador o mantener del proyecto.

---

**¿No encuentras tu pregunta?**

Abre un issue en el repositorio con tu duda específica.
