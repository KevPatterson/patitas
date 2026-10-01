/**
 * Script de ejemplo para migrar usuarios de Kimi a autenticación tradicional
 * 
 * IMPORTANTE: Este es un script de EJEMPLO. Necesitarás adaptarlo a tus necesidades.
 * 
 * Este script NO se ejecuta automáticamente. Es una guía para ayudarte a migrar
 * usuarios existentes si decides mantenerlos.
 */

import { getDb } from "../api/queries/connection";
import { users } from "./schema";

async function migrateUsers() {
  const db = getDb();

  console.log("Iniciando migración de usuarios...");

  // Opción 1: Obtener todos los usuarios antiguos (antes de migrar)
  // Si ya ejecutaste la migración de schema, esta consulta NO funcionará
  // porque la columna unionId ya no existe
  
  try {
    // Este código es solo de ejemplo - ajústalo según tu caso
    const oldUsers = await db.select().from(users);
    
    console.log(`Se encontraron ${oldUsers.length} usuarios`);

    for (const user of oldUsers) {
      console.log(`Usuario: ${user.name || "Sin nombre"}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email || "No tiene email"}`);
      
      // Si el usuario no tiene email, necesitarás decidir qué hacer:
      // - Saltarlo
      // - Usar un email temporal
      // - Contactar al usuario para que se registre de nuevo
      
      if (!user.email) {
        console.log(`  ⚠️ Usuario sin email - necesita registrarse de nuevo`);
      }
    }

    console.log("\n--- PLAN DE MIGRACIÓN ---");
    console.log("1. Usuarios con email válido: mantener y actualizar schema");
    console.log("2. Usuarios sin email: deben registrarse nuevamente");
    console.log("3. Considerar enviar email de notificación a usuarios afectados");

  } catch (error) {
    console.error("Error al migrar usuarios:", error);
    console.log("\n💡 Si ya ejecutaste la migración de schema:");
    console.log("   - La columna unionId ya no existe");
    console.log("   - Los usuarios necesitarán registrarse nuevamente");
    console.log("   - Este script es solo una guía de ejemplo");
  }

  console.log("\nMigración completada");
}

// Opción 2: Script SQL manual para hacer antes de la migración
const sqlMigrationGuide = `
-- EJECUTAR ANTES DE LA MIGRACIÓN DE SCHEMA
-- Este SQL te ayuda a identificar qué usuarios tienen email

-- Ver usuarios con email
SELECT id, unionId, name, email 
FROM users 
WHERE email IS NOT NULL AND email != '';

-- Ver usuarios SIN email (necesitarán registrarse de nuevo)
SELECT id, unionId, name 
FROM users 
WHERE email IS NULL OR email = '';

-- Contar usuarios por categoría
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END) as con_email,
  SUM(CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END) as sin_email
FROM users;

-- Si decides actualizar emails temporales (NO RECOMENDADO):
-- UPDATE users SET email = CONCAT('user_', id, '@temp.patitas.app') WHERE email IS NULL;
`;

console.log("\n=== GUÍA DE MIGRACIÓN SQL ===");
console.log(sqlMigrationGuide);
console.log("\n⚠️ IMPORTANTE:");
console.log("1. Haz BACKUP de tu base de datos ANTES de cualquier cambio");
console.log("2. Este script es solo una GUÍA, no un script de migración automática");
console.log("3. Revisa y adapta el código según tus necesidades específicas");
console.log("4. Considera notificar a tus usuarios sobre el cambio");

// Descomentar la siguiente línea para ejecutar el script
// migrateUsers().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

console.log("\n✅ Para ejecutar este script, descomenta la última línea y ejecuta:");
console.log("   npx tsx db/migrate-users.example.ts");
