import { z } from "zod";
import type { Publication } from "./types";

/* ------------------------------- Catálogos ------------------------------- */

export const TYPE_LABELS: Record<string, string> = {
  lost: "Perdido",
  found: "Encontrado",
  abandoned: "Abandonado",
  adoption: "Adopción",
  sighting: "Avistamiento",
};

export const SPECIES_LABELS: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  rodent: "Roedor",
  reptile: "Reptil",
  other: "Otro",
};

export const SEX_LABELS: Record<string, string> = {
  male: "Macho",
  female: "Hembra",
  unknown: "No se sabe",
};

export const AGE_LABELS: Record<string, string> = {
  puppy: "Cachorro",
  young: "Joven",
  adult: "Adulto",
  senior: "Anciano",
  unknown: "No se sabe",
};

export const SIZE_LABELS: Record<string, string> = {
  small: "Pequeño",
  medium: "Mediano",
  large: "Grande",
  unknown: "No se sabe",
};

export const REASON_LABELS: Record<string, string> = {
  fake: "Información falsa",
  spam: "Spam",
  scam: "Estafa",
  duplicate: "Publicación duplicada",
  already_recovered: "La mascota ya fue recuperada",
  inappropriate: "Contenido inapropiado",
  other: "Otro",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  resolved: "Resuelta",
  expired: "Expirada",
  hidden: "Oculta",
  deleted: "Eliminada",
};

/** Color de cada tipo (consistente en toda la app y el mapa) */
export const TYPE_COLORS: Record<string, string> = {
  lost: "#E4572E",
  found: "#2F9E63",
  abandoned: "#D9A521",
  adoption: "#3B7DD8",
  sighting: "#8B5CF6",
};

/* --------------------------- Ubicaciones (Cuba) --------------------------- */

export const CUBA: Record<string, string[]> = {
  "Pinar del Río": ["Pinar del Río", "Consolación del Sur", "Viñales", "San Luis", "Sandino", "Guane", "La Palma", "Los Palacios", "San Juan y Martínez", "Minas de Matahambre", "Mantua"],
  Artemisa: ["Artemisa", "Güira de Melena", "San Antonio de los Baños", "Caimito", "Bauta", "Mariel", "Guanajay", "Candelaria", "Bahía Honda", "Alquízar", "San Cristóbal"],
  "La Habana": ["Playa", "Plaza de la Revolución", "Centro Habana", "Habana Vieja", "Cerro", "Diez de Octubre", "Boyeros", "Arroyo Naranjo", "Marianao", "La Lisa", "Guanabacoa", "Regla", "San Miguel del Padrón", "Cotorro", "Habana del Este"],
  Mayabeque: ["San José de las Lajas", "Bejucal", "Santa Cruz del Norte", "Jaruco", "Madruga", "Güines", "San Nicolás", "Nueva Paz", "Batabanó", "Melena del Sur", "Quivicán"],
  Matanzas: ["Matanzas", "Varadero", "Cárdenas", "Colón", "Jovellanos", "Limonar", "Los Arabos", "Martí", "Pedro Betancourt", "Perico", "Unión de Reyes", "Calimete", "Ciénaga de Zapata", "Jagüey Grande"],
  "Villa Clara": ["Santa Clara", "Remedios", "Caibarién", "Camajuaní", "Cifuentes", "Corralillo", "Encrucijada", "Manicaragua", "Placetas", "Quemado de Güines", "Ranchuelo", "Sagua la Grande", "Santo Domingo"],
  Cienfuegos: ["Cienfuegos", "Cruces", "Cumanayagua", "Palmira", "Rodas", "Aguada de Pasajeros", "Abreus", "Lajas"],
  "Sancti Spíritus": ["Sancti Spíritus", "Trinidad", "Cabaiguán", "Fomento", "Jatibonico", "La Sierpe", "Taguasco", "Yaguajay"],
  "Ciego de Ávila": ["Ciego de Ávila", "Morón", "Chambas", "Ciro Redondo", "Florencia", "Majagua", "Baraguá", "Bolivia", "Primero de Enero", "Venezuela"],
  Camagüey: ["Camagüey", "Florida", "Nuevitas", "Guáimaro", "Céspedes", "Esmeralda", "Sibanicú", "Minas", "Najasa", "Santa Cruz del Sur", "Vertientes", "Jimaguayú", "Sierra de Cubitas"],
  "Las Tunas": ["Las Tunas", "Puerto Padre", "Jesús Menéndez", "Majibacoa", "Manatí", "Colombia", "Amancio", "Jobabo"],
  Holguín: ["Holguín", "Gibara", "Banes", "Moa", "Mayarí", "Sagua de Tánamo", "Guardalavaca", "Rafael Freyre", "Antilla", "Báguanos", "Cacocum", "Calixto García", "Cueto", "Frank País", "Urbano Noris"],
  Granma: ["Bayamo", "Manzanillo", "Jiguaní", "Yara", "Niquero", "Pilón", "Media Luna", "Río Cauto", "Cauto Cristo", "Bartolomé Masó", "Buey Arriba", "Campechuela", "Guisa"],
  "Santiago de Cuba": ["Santiago de Cuba", "Palma Soriano", "Contramaestre", "San Luis", "Songo-La Maya", "Tercer Frente", "Guamá", "Julio Antonio Mella", "Segundo Frente"],
  Guantánamo: ["Guantánamo", "Baracoa", "Maisí", "Imías", "San Antonio del Sur", "Caimanera", "El Salvador", "Niceto Pérez", "Yateras", "Manuel Tames"],
  "Isla de la Juventud": ["Nueva Gerona", "La Fe"],
};

export const PROVINCES = Object.keys(CUBA);

/* ------------------------------ Validación ------------------------------ */

export const publicationInput = z.object({
  type: z.enum(["lost", "found", "abandoned", "adoption", "sighting"]),
  petName: z.string().max(120).optional().or(z.literal("")),
  species: z.enum(["dog", "cat", "bird", "rabbit", "rodent", "reptile", "other"]),
  breed: z.string().max(120).optional().or(z.literal("")),
  sex: z.enum(["male", "female", "unknown"]).default("unknown"),
  age: z.enum(["puppy", "young", "adult", "senior", "unknown"]).default("unknown"),
  size: z.enum(["small", "medium", "large", "unknown"]).default("unknown"),
  color: z.string().max(120).optional().or(z.literal("")),
  features: z.string().max(2000).optional().or(z.literal("")),
  hasCollar: z.boolean().default(false),
  hasTag: z.boolean().default(false),
  microchip: z.string().max(60).optional().or(z.literal("")),
  description: z.string().min(10, "Describe la mascota con al menos 10 caracteres").max(4000),
  province: z.string().refine((p) => PROVINCES.includes(p), "Provincia no válida"),
  municipality: z.string().max(80).optional().or(z.literal("")),
  zone: z.string().max(120).optional().or(z.literal("")),
  approxLat: z.number().min(-90).max(90).optional(),
  approxLng: z.number().min(-180).max(180).optional(),
  eventDate: z.coerce.date().optional(),
  eventTime: z.string().max(20).optional().or(z.literal("")),
  reward: z.boolean().default(false),
  rewardDetails: z.string().max(255).optional().or(z.literal("")),
  needsVet: z.boolean().default(false),
  specialNeeds: z.string().max(2000).optional().or(z.literal("")),
  instructions: z.string().max(2000).optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
  contactWhatsapp: z.string().max(40).optional().or(z.literal("")),
  contactEmail: z.string().email().max(320).optional().or(z.literal("")),
  showPhone: z.boolean().default(false),
  showEmail: z.boolean().default(false),
  allowInternalContact: z.boolean().default(true),
  imageKeys: z.array(z.string().max(600)).max(8).default([]),
});
export type PublicationInput = z.infer<typeof publicationInput>;

export const searchInput = z.object({
  q: z.string().max(120).optional(),
  type: z.enum(["lost", "found", "abandoned", "adoption", "sighting"]).optional(),
  species: z.enum(["dog", "cat", "bird", "rabbit", "rodent", "reptile", "other"]).optional(),
  sex: z.enum(["male", "female", "unknown"]).optional(),
  size: z.enum(["small", "medium", "large", "unknown"]).optional(),
  province: z.string().optional(),
  municipality: z.string().optional(),
  status: z.enum(["active", "resolved"]).optional(),
  since: z.enum(["24h", "7d", "30d"]).optional(),
  limit: z.number().min(1).max(60).default(24),
  offset: z.number().min(0).default(0),
});
export type SearchInput = z.infer<typeof searchInput>;

/* --------------------------------- DTOs --------------------------------- */

/** Publicación saneada para consumo público: sin microchip ni contacto privado */
export type PublicPublication = Omit<
  Publication,
  | "microchip"
  | "contactPhone"
  | "contactWhatsapp"
  | "contactEmail"
  | "deletedAt"
  | "ownerId"
> & {
  ownerName: string | null;
  ownerAvatar: string | null;
  images: { key: string; url: string }[];
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
};

export type PublicationCard = {
  slug: string;
  type: Publication["type"];
  status: Publication["status"];
  petName: string | null;
  species: Publication["species"];
  sex: Publication["sex"];
  age: Publication["age"];
  province: string;
  municipality: string | null;
  zone: string | null;
  approxLat: number | null;
  approxLng: number | null;
  reward: boolean;
  createdAt: Date;
  resolvedAt: Date | null;
  imageUrl: string | null;
};

export type HomeStats = {
  total: number;
  found: number;
  reunited: number;
  adoption: number;
};

export const MAX_IMAGES = 8;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
