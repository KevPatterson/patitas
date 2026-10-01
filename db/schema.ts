import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  varchar,
  text,
  boolean,
  double,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ---------------------------------- Patitas ---------------------------------- */

export const PUBLICATION_TYPES = [
  "lost",
  "found",
  "abandoned",
  "adoption",
  "sighting",
] as const;
export const PUBLICATION_STATUSES = [
  "active",
  "resolved",
  "expired",
  "hidden",
  "deleted",
] as const;
export const SPECIES = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "rodent",
  "reptile",
  "other",
] as const;

export const publications = mysqlTable(
  "publications",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    ownerId: bigint("ownerId", { mode: "number", unsigned: true }).notNull(),
    type: mysqlEnum("type", PUBLICATION_TYPES).notNull(),
    status: mysqlEnum("status", PUBLICATION_STATUSES)
      .default("active")
      .notNull(),

    petName: varchar("petName", { length: 120 }),
    species: mysqlEnum("species", SPECIES).notNull(),
    breed: varchar("breed", { length: 120 }),
    sex: mysqlEnum("sex", ["male", "female", "unknown"])
      .default("unknown")
      .notNull(),
    age: mysqlEnum("age", ["puppy", "young", "adult", "senior", "unknown"])
      .default("unknown")
      .notNull(),
    size: mysqlEnum("size", ["small", "medium", "large", "unknown"])
      .default("unknown")
      .notNull(),
    color: varchar("color", { length: 120 }),
    features: text("features"),
    hasCollar: boolean("hasCollar").default(false).notNull(),
    hasTag: boolean("hasTag").default(false).notNull(),
    /** NUNCA exponer públicamente */
    microchip: varchar("microchip", { length: 60 }),
    description: text("description"),

    province: varchar("province", { length: 80 }).notNull(),
    municipality: varchar("municipality", { length: 80 }),
    zone: varchar("zone", { length: 120 }),
    /** Coordenadas aproximadas (difuminadas), nunca exactas */
    approxLat: double("approxLat"),
    approxLng: double("approxLng"),

    eventDate: timestamp("eventDate"),
    eventTime: varchar("eventTime", { length: 20 }),

    reward: boolean("reward").default(false).notNull(),
    rewardDetails: varchar("rewardDetails", { length: 255 }),
    needsVet: boolean("needsVet").default(false).notNull(),
    specialNeeds: text("specialNeeds"),
    instructions: text("instructions"),

    /** Datos de contacto: solo se exponen según permisos */
    contactPhone: varchar("contactPhone", { length: 40 }),
    contactWhatsapp: varchar("contactWhatsapp", { length: 40 }),
    contactEmail: varchar("contactEmail", { length: 320 }),
    showPhone: boolean("showPhone").default(false).notNull(),
    showEmail: boolean("showEmail").default(false).notNull(),
    allowInternalContact: boolean("allowInternalContact")
      .default(true)
      .notNull(),

    resolvedStory: text("resolvedStory"),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    typeIdx: index("pub_type_idx").on(table.type),
    statusIdx: index("pub_status_idx").on(table.status),
    speciesIdx: index("pub_species_idx").on(table.species),
    provinceIdx: index("pub_province_idx").on(table.province),
    ownerIdx: index("pub_owner_idx").on(table.ownerId),
    createdIdx: index("pub_created_idx").on(table.createdAt),
  }),
);

export const publicationImages = mysqlTable(
  "publication_images",
  {
    id: serial("id").primaryKey(),
    publicationId: bigint("publicationId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    storageKey: varchar("storageKey", { length: 600 }).notNull(),
    sortOrder: bigint("sortOrder", { mode: "number" }).default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pubIdx: index("img_pub_idx").on(table.publicationId),
  }),
);

export const REPORT_REASONS = [
  "fake",
  "spam",
  "scam",
  "duplicate",
  "already_recovered",
  "inappropriate",
  "other",
] as const;

export const reports = mysqlTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    publicationId: bigint("publicationId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    reporterId: bigint("reporterId", { mode: "number", unsigned: true }),
    reason: mysqlEnum("reason", REPORT_REASONS).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["pending", "reviewing", "resolved", "dismissed"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
    resolvedBy: bigint("resolvedBy", { mode: "number", unsigned: true }),
  },
  (table) => ({
    pubIdx: index("rep_pub_idx").on(table.publicationId),
    statusIdx: index("rep_status_idx").on(table.status),
  }),
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    type: mysqlEnum("type", [
      "match",
      "comment",
      "report",
      "resolved",
      "nearby",
      "system",
    ]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    publicationSlug: varchar("publicationSlug", { length: 120 }),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("notif_user_idx").on(table.userId),
  }),
);

export const sightings = mysqlTable(
  "sightings",
  {
    id: serial("id").primaryKey(),
    publicationId: bigint("publicationId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }),
    note: text("note"),
    province: varchar("province", { length: 80 }),
    municipality: varchar("municipality", { length: 80 }),
    zone: varchar("zone", { length: 120 }),
    approxLat: double("approxLat"),
    approxLng: double("approxLng"),
    seenAt: timestamp("seenAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pubIdx: index("sight_pub_idx").on(table.publicationId),
  }),
);

/** Mensajes internos: mecanismo de contacto intermediario de Patitas */
export const comments = mysqlTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    publicationId: bigint("publicationId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    authorId: bigint("authorId", { mode: "number", unsigned: true }).notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pubIdx: index("com_pub_idx").on(table.publicationId),
  }),
);

export const adoptionRequests = mysqlTable(
  "adoption_requests",
  {
    id: serial("id").primaryKey(),
    publicationId: bigint("publicationId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    requesterId: bigint("requesterId", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    message: text("message"),
    status: mysqlEnum("status", ["pending", "accepted", "rejected"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pubIdx: index("adopt_pub_idx").on(table.publicationId),
  }),
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorId: bigint("actorId", { mode: "number", unsigned: true }),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entityType", { length: 60 }).notNull(),
    entityId: varchar("entityId", { length: 60 }),
    metadata: text("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index("audit_entity_idx").on(table.entityType, table.entityId),
  }),
);

export type Publication = typeof publications.$inferSelect;
export type InsertPublication = typeof publications.$inferInsert;
export type PublicationImage = typeof publicationImages.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Sighting = typeof sightings.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type AdoptionRequest = typeof adoptionRequests.$inferSelect;
