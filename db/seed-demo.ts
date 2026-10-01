import "dotenv/config";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { users, publications, publicationImages } from "./schema";
import { storage } from "../api/lib/storage";

const CASES = [
  {
    file: "toby.png", type: "lost" as const, petName: "Toby", species: "dog" as const,
    sex: "male" as const, age: "adult" as const, size: "medium" as const, color: "Caramelo",
    breed: "Mestizo", zone: "Playa", municipality: "Playa", province: "La Habana",
    lat: 23.099, lng: -82.435, reward: true, rewardDetails: "Se agradece cualquier información",
    description: "Toby se perdió cerca de la 5ta Avenida. Es muy amigable y responde a su nombre. Llevaba collar azul sin placa. Si lo ves, no lo persigas: llámalo y contáctanos.",
    hours: 3,
  },
  {
    file: "luna.png", type: "found" as const, petName: null, species: "cat" as const,
    sex: "female" as const, age: "young" as const, size: "small" as const, color: "Negra",
    breed: null, zone: "Centro Habana", municipality: "Centro Habana", province: "La Habana",
    lat: 23.137, lng: -82.365, reward: false,
    description: "Apareció esta gatita negra en nuestro portal. Es muy dócil, parece de casa. La tenemos resguardada y con comida mientras encontramos a su familia.",
    hours: 8,
  },
  {
    file: "cachorro.png", type: "adoption" as const, petName: "Pelusa", species: "dog" as const,
    sex: "female" as const, age: "puppy" as const, size: "small" as const, color: "Blanco con manchas marrones",
    breed: "Mestizo", zone: "Cerro", municipality: "Cerro", province: "La Habana",
    lat: 23.109, lng: -82.378, reward: false,
    description: "Pelusa busca un hogar responsable. Tiene unos 3 meses, es juguetona y está desparasitada. Se entrega con compromiso de esterilización cuando tenga la edad.",
    hours: 26,
  },
  {
    file: "rocky.png", type: "lost" as const, petName: "Rocky", species: "dog" as const,
    sex: "male" as const, age: "senior" as const, size: "small" as const, color: "Marrón",
    breed: "Salchicha", zone: "Miramar", municipality: "Playa", province: "La Habana",
    lat: 23.116, lng: -82.419, reward: true, rewardDetails: "Recompensa en efectivo",
    description: "Rocky es un salchicha viejitos que necesita su medicación diaria. Se escapó durante un aguacero. Lleva collar rojo con placa con su nombre.",
    hours: 50,
  },
  {
    file: "misu.png", type: "abandoned" as const, petName: null, species: "cat" as const,
    sex: "unknown" as const, age: "young" as const, size: "small" as const, color: "Atigrado gris",
    breed: null, zone: "Alamar", municipality: "Habana del Este", province: "La Habana",
    lat: 23.162, lng: -82.294, reward: false, needsVet: true,
    description: "Dejaron a este gatito atigrado en una caja cerca del parque. Parece tener una patita lastimada. Está temporalmente bajo nuestro cuidado pero no podemos quedárnoslo.",
    hours: 75,
  },
  {
    file: "nala.png", type: "adoption" as const, petName: "Nala", species: "dog" as const,
    sex: "female" as const, age: "adult" as const, size: "large" as const, color: "Dorado",
    breed: "Golden Retriever", zone: "Siboney", municipality: "Playa", province: "La Habana",
    lat: 23.091, lng: -82.462, reward: false,
    description: "Nala es una golden de 4 años, noble y entrenada. Su familia no puede seguir cuidándola. Buscamos un hogar con espacio y tiempo para ella.",
    hours: 100,
  },
];

async function main() {
  const db = getDb();

  let owner = await db.query.users.findFirst({ where: eq(users.unionId, "patitas-demo") });
  if (!owner) {
    const [{ id }] = await db.insert(users).values({
      unionId: "patitas-demo",
      name: "Comunidad Patitas",
      email: null,
    }).$returningId();
    owner = await db.query.users.findFirst({ where: eq(users.id, id) });
  }
  if (!owner) throw new Error("no owner");

  const existing = await db.select().from(publications).where(eq(publications.ownerId, owner.id));
  if (existing.length > 0) {
    console.log(`Ya existen ${existing.length} casos demo, se omite.`);
    return;
  }

  for (const c of CASES) {
    const bytes = readFileSync(`/tmp/pets/${c.file}`);
    const saved = await storage.uploadFile({
      fileContent: new Uint8Array(bytes),
      fileName: `patitas/seed-${c.file}`,
      contentType: "image/png",
    });
    const slug = `${(c.petName ?? c.type).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}-${c.zone.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date(Date.now() - c.hours * 3600 * 1000);
    const [{ id }] = await db.insert(publications).values({
      slug,
      ownerId: owner.id,
      type: c.type,
      status: "active",
      petName: c.petName,
      species: c.species,
      breed: c.breed,
      sex: c.sex,
      age: c.age,
      size: c.size,
      color: c.color,
      description: c.description,
      province: c.province,
      municipality: c.municipality,
      zone: c.zone,
      approxLat: c.lat,
      approxLng: c.lng,
      eventDate: createdAt,
      reward: c.reward,
      rewardDetails: c.reward ? c.rewardDetails : null,
      needsVet: (c as { needsVet?: boolean }).needsVet ?? false,
      allowInternalContact: true,
      createdAt,
      updatedAt: createdAt,
    }).$returningId();
    await db.insert(publicationImages).values({ publicationId: id, storageKey: saved.key, sortOrder: 0 });
    console.log("✓", slug);
  }
  console.log("Seed listo.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
