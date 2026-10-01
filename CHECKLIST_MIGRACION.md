# ✅ Checklist de Migración - Autenticación Patitas

Usa este checklist para asegurarte de completar todos los pasos de la migración.

## 📋 Pre-Migración

- [ ] **Backup de Base de Datos**
  ```bash
  # MySQL
  mysqldump -u usuario -p nombre_bd > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Revisar usuarios existentes**
  ```sql
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM users WHERE email IS NOT NULL;
  ```

- [ ] **Notificar a usuarios** (opcional)
  - Enviar email informando del cambio de sistema de autenticación
  - Incluir fecha de migración
  - Instrucciones para volver a registrarse si es necesario

## 🔧 Configuración de Google OAuth

- [ ] **Crear proyecto en Google Cloud Console**
  - Ver guía: `docs/CONFIGURAR_GOOGLE_OAUTH.md`

- [ ] **Habilitar Google+ API**

- [ ] **Configurar Pantalla de Consentimiento**
  - Nombre de la aplicación: _______________
  - Correo de asistencia: _______________
  - Alcances: `openid`, `email`, `profile`

- [ ] **Crear credenciales OAuth 2.0**
  - Tipo: Aplicación web
  - Orígenes autorizados: http://localhost:3000
  - URI de redirección: http://localhost:3000/api/oauth/callback
  - Client ID: _______________
  - Client Secret: _______________

- [ ] **Agregar usuarios de prueba** (si app en modo Testing)

## ⚙️ Variables de Entorno

Edita tu archivo `.env`:

- [ ] `APP_SECRET=` (mantener el existente o generar uno nuevo)
- [ ] `DATABASE_URL=` (verificar que esté correcto)
- [ ] `GOOGLE_CLIENT_ID=`
- [ ] `GOOGLE_CLIENT_SECRET=`
- [ ] `VITE_GOOGLE_CLIENT_ID=`
- [ ] `OWNER_EMAIL=`
- [ ] `NODE_ENV=production` (para producción)

## 🗄️ Base de Datos

- [ ] **Verificar configuración**
  ```bash
  # Probar conexión a la BD
  mysql -u usuario -p nombre_bd -e "SELECT 1;"
  ```

- [ ] **Generar migración**
  ```bash
  npm run db:generate
  ```

- [ ] **Revisar archivos de migración**
  - Ubicación: `db/migrations/`
  - Verificar que elimina `unionId` y agrega nuevos campos

- [ ] **Aplicar migración**
  ```bash
  npm run db:migrate
  ```

- [ ] **Verificar schema actualizado**
  ```sql
  DESCRIBE users;
  -- Debe mostrar: email, password, googleId, emailVerified
  -- NO debe mostrar: unionId
  ```

## 🧪 Pruebas en Desarrollo

- [ ] **Instalar dependencias**
  ```bash
  npm install
  ```

- [ ] **Verificar compilación**
  ```bash
  npm run check
  ```

- [ ] **Iniciar servidor de desarrollo**
  ```bash
  npm run dev
  ```

- [ ] **Probar registro con email/password**
  - Ir a: http://localhost:3000/login
  - Pestaña "Registrarse"
  - Completar formulario
  - Verificar registro exitoso

- [ ] **Probar login con email/password**
  - Ir a: http://localhost:3000/login
  - Pestaña "Iniciar sesión"
  - Usar credenciales del registro anterior
  - Verificar login exitoso

- [ ] **Probar Google OAuth**
  - Ir a: http://localhost:3000/login
  - Clic en "Continuar con Google"
  - Seleccionar cuenta de Google
  - Autorizar permisos
  - Verificar redirección y autenticación

- [ ] **Probar logout**
  - Usar función de logout en la aplicación
  - Verificar que la sesión se cierra

- [ ] **Verificar persistencia de sesión**
  - Iniciar sesión
  - Refrescar página
  - Verificar que sigue autenticado

- [ ] **Probar rol de admin**
  - Registrar/login con el email configurado en `OWNER_EMAIL`
  - Verificar que tiene rol "admin"

## 🔐 Verificación de Seguridad

- [ ] **Verificar cookies**
  - Abrir DevTools → Application → Cookies
  - Verificar cookie de sesión
  - Verificar flags: `httpOnly`, `secure` (producción), `sameSite`

- [ ] **Verificar headers de seguridad**
  - Red → Headers
  - Verificar ausencia de información sensible

- [ ] **Revisar logs del servidor**
  - No debe haber credenciales expuestas
  - Verificar manejo correcto de errores

- [ ] **Probar casos de error**
  - Login con credenciales incorrectas
  - Registro con email duplicado
  - Cancelar OAuth de Google
  - Token expirado

## 🚀 Despliegue a Producción

- [ ] **Actualizar Google OAuth para producción**
  - Agregar dominio de producción en "Orígenes autorizados"
  - Agregar URI de producción en "URIs de redireccionamiento"

- [ ] **Configurar variables de entorno en servidor**
  - Railway / Vercel / Otro hosting
  - Copiar todas las variables del `.env` local

- [ ] **Desplegar aplicación**
  ```bash
  npm run build
  npm start
  ```

- [ ] **Ejecutar migraciones en producción**
  ```bash
  npm run db:migrate
  ```

- [ ] **Probar en producción**
  - Registro con email
  - Login con email
  - Google OAuth
  - Logout

## 📊 Post-Migración

- [ ] **Monitorear errores**
  - Revisar logs del servidor
  - Verificar errores de autenticación

- [ ] **Verificar registros de usuarios**
  ```sql
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM users WHERE googleId IS NOT NULL;
  SELECT COUNT(*) FROM users WHERE password IS NOT NULL;
  ```

- [ ] **Recopilar feedback de usuarios**
  - ¿Pudieron autenticarse correctamente?
  - ¿Encontraron algún problema?

- [ ] **Documentar incidencias**
  - Crear issues para problemas encontrados
  - Documentar soluciones

## 📝 Documentación

- [ ] **Actualizar README**
  - Sección de autenticación
  - Variables de entorno requeridas

- [ ] **Documentar API**
  - Nuevos endpoints de autenticación
  - Ejemplos de uso

- [ ] **Guía para usuarios**
  - Cómo registrarse
  - Cómo iniciar sesión
  - Recuperación de contraseña (si implementas)

## 🗑️ Limpieza

- [ ] **Eliminar código obsoleto de Kimi**
  - ✅ Ya eliminado: carpeta `api/kimi/`

- [ ] **Limpiar referencias en documentación**
  - Buscar menciones a "Kimi" en docs

- [ ] **Actualizar comentarios en código**
  - Buscar TODOs relacionados con autenticación antigua

- [ ] **Eliminar dependencias no usadas** (opcional)
  ```bash
  npm prune
  ```

## ✅ Verificación Final

- [ ] **Todas las pruebas pasan**
  ```bash
  npm run test
  ```

- [ ] **No hay errores de TypeScript**
  ```bash
  npm run check
  ```

- [ ] **Build exitoso**
  ```bash
  npm run build
  ```

- [ ] **Aplicación funciona en producción**

- [ ] **Backup de nueva configuración**
  - Hacer backup de BD actualizada
  - Guardar copia de `.env` en lugar seguro

## 🎉 ¡Migración Completada!

Si completaste todos los ítems anteriores, tu migración de autenticación está lista.

### Próximos Pasos Sugeridos:

1. **Implementar recuperación de contraseña**
   - Reset por email
   - Token de recuperación

2. **Agregar verificación de email**
   - Usar campo `emailVerified`
   - Enviar email de confirmación

3. **Autenticación de dos factores (2FA)**
   - TOTP (Google Authenticator)
   - SMS

4. **OAuth adicional**
   - Facebook
   - GitHub
   - Apple

5. **Mejorar seguridad**
   - Rate limiting en login
   - Captcha en registro
   - Detección de bots

---

**Fecha de migración**: _______________
**Responsable**: _______________
**Notas adicionales**:
