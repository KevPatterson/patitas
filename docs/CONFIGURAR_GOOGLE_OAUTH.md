# Configuración de Google OAuth

Esta guía te ayudará a configurar Google OAuth para tu aplicación Patitas.

## Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el selector de proyectos (arriba a la izquierda)
3. Haz clic en "Nuevo Proyecto"
4. Ingresa el nombre del proyecto (ej: "Patitas")
5. Haz clic en "Crear"

## Paso 2: Habilitar APIs Necesarias

1. En el menú lateral, ve a **APIs y servicios** → **Biblioteca**
2. Busca "Google+ API"
3. Haz clic en "Google+ API"
4. Haz clic en "Habilitar"

## Paso 3: Configurar Pantalla de Consentimiento OAuth

1. En el menú lateral, ve a **APIs y servicios** → **Pantalla de consentimiento de OAuth**
2. Selecciona "Externo" (o "Interno" si tienes Google Workspace)
3. Haz clic en "Crear"
4. Completa la información básica:
   - **Nombre de la aplicación**: Patitas
   - **Correo de asistencia**: tu-email@ejemplo.com
   - **Logotipo de la aplicación**: (opcional)
   - **Dominio de la aplicación**: tu-dominio.com
   - **Correos autorizados**: tu-email@ejemplo.com
5. Haz clic en "Guardar y continuar"
6. En **Alcances**, haz clic en "Agregar o quitar alcances"
7. Selecciona los siguientes alcances:
   - `openid`
   - `email`
   - `profile`
8. Haz clic en "Actualizar" y luego "Guardar y continuar"
9. En **Usuarios de prueba** (si es aplicación externa en desarrollo):
   - Agrega los correos de los usuarios que podrán probar la app
10. Haz clic en "Guardar y continuar"
11. Revisa la información y haz clic en "Volver al panel"

## Paso 4: Crear Credenciales OAuth 2.0

1. En el menú lateral, ve a **APIs y servicios** → **Credenciales**
2. Haz clic en **+ Crear credenciales** → **ID de cliente de OAuth 2.0**
3. Selecciona "Aplicación web" como tipo de aplicación
4. Ingresa un nombre (ej: "Patitas Web Client")
5. En **Orígenes de JavaScript autorizados**, agrega:
   ```
   http://localhost:3000
   ```
   Y si ya tienes dominio en producción:
   ```
   https://tu-dominio.com
   ```
6. En **URIs de redireccionamiento autorizados**, agrega:
   ```
   http://localhost:3000/api/oauth/callback
   ```
   Y si ya tienes dominio en producción:
   ```
   https://tu-dominio.com/api/oauth/callback
   ```
7. Haz clic en "Crear"
8. Se mostrará una ventana con tu **Client ID** y **Client Secret**
   - ⚠️ **IMPORTANTE**: Copia estos valores inmediatamente

## Paso 5: Configurar Variables de Entorno

1. Abre tu archivo `.env` en la raíz del proyecto
2. Agrega o actualiza las siguientes variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

# Email del administrador
OWNER_EMAIL=tu-email@ejemplo.com
```

3. Reemplaza:
   - `tu-client-id` con el Client ID que copiaste
   - `tu-client-secret` con el Client Secret que copiaste
   - `tu-email@ejemplo.com` con tu email (será el administrador)

## Paso 6: Probar la Configuración

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre el navegador en `http://localhost:3000/login`

3. Haz clic en "Continuar con Google"

4. Deberías ser redirigido a la página de consentimiento de Google

5. Selecciona tu cuenta y autoriza los permisos

6. Serás redirigido de vuelta a tu aplicación y autenticado automáticamente

## Solución de Problemas

### Error: "Redirect URI mismatch"
**Causa**: La URI de redirección no coincide con las configuradas en Google Cloud Console

**Solución**: 
1. Ve a Google Cloud Console → Credenciales
2. Edita tu cliente OAuth
3. Verifica que la URI exacta esté en "URIs de redireccionamiento autorizados"
4. Asegúrate de que no haya espacios ni caracteres extra

### Error: "Invalid Client"
**Causa**: El Client ID o Client Secret son incorrectos

**Solución**:
1. Ve a Google Cloud Console → Credenciales
2. Verifica que copiaste correctamente el Client ID y Client Secret
3. Si es necesario, regenera el Client Secret

### Error: "Access blocked: This app's request is invalid"
**Causa**: La pantalla de consentimiento no está configurada correctamente

**Solución**:
1. Ve a Google Cloud Console → Pantalla de consentimiento
2. Asegúrate de haber completado todos los campos requeridos
3. Verifica que los alcances `openid`, `email`, y `profile` estén agregados

### La aplicación está en modo "Testing"
Si tu aplicación está en modo "Testing", solo los usuarios que agregaste como "Usuarios de prueba" podrán autenticarse.

**Para publicar tu aplicación**:
1. Ve a Pantalla de consentimiento de OAuth
2. Haz clic en "Publicar aplicación"
3. Completa el proceso de verificación si es necesario

## Producción

Cuando despliegues a producción:

1. Agrega tu dominio de producción en Google Cloud Console:
   - **Orígenes JavaScript autorizados**: `https://tu-dominio.com`
   - **URIs de redireccionamiento**: `https://tu-dominio.com/api/oauth/callback`

2. Actualiza tu archivo `.env` de producción con las mismas credenciales

3. Asegúrate de que `NODE_ENV=production` esté configurado

## Seguridad

⚠️ **NUNCA** compartas tu Client Secret públicamente ni lo subas a repositorios públicos

✅ Agrega `.env` a tu `.gitignore`

✅ Usa variables de entorno en tu plataforma de hosting (Railway, Vercel, etc.)

✅ Rota las credenciales periódicamente desde Google Cloud Console

## Referencias

- [Documentación oficial de Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Configurar OAuth 2.0](https://support.google.com/cloud/answer/6158849)
- [Alcances de OAuth 2.0](https://developers.google.com/identity/protocols/oauth2/scopes)
