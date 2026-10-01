import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  publications,
  publicationImages,
  users,
  notifications,
} from "@db/schema";
import { storage } from "./lib/storage";
import {
  publicationInput,
  searchInput,
  TYPE_LABELS,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  type PublicPublication,
  type PublicationCard,
} from "@contracts/patitas";

const MAX_NEW_PUBLICATIONS_PER_DAY = 10;

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

/** Difumina coordenadas para proteger la privacidad (~1-2 km) */
function fuzzCoord(v: number) {
  return Math.round((v + (Math.random() - 0.5) * 0.02) * 1000) / 1000;
}

async function presignImages(publicationIds: number[]) {
  if (publicationIds.length === 0) return new Map<number, { key: string; url: string }[]>();
  const rows = await getDb()
    .select()
    .from(publicationImages)
    .where(inArray(publicationImages.publicationId, publicationIds))
    .orderBy(publicationImages.sortOrder);
  const { urls } = await storage.getPresignedUrls({ keys: rows.map((r) => r.storageKey) });
  const byKey = new Map(urls.map((u) => [u.key, u.url]));
  const map = new Map<number, { key: string; url: string }[]>();
  for (const r of rows) {
    const url = byKey.get(r.storageKey);
    if (!url) continue;
    if (!map.has(r.publicationId)) map.set(r.publicationId, []);
    map.get(r.publicationId)!.push({ key: r.storageKey, url });
  }
  return map;
}

function toCard(p: typeof publications.$inferSelect, imageUrl: string | null): PublicationCard {
  return {
    slug: p.slug,
    type: p.type,
    status: p.status,
    petName: p.petName,
    species: p.species,
    sex: p.sex,
    age: p.age,
    province: p.province,
    municipality: p.municipality,
    zone: p.zone,
    approxLat: p.approxLat,
    approxLng: p.approxLng,
    reward: p.reward,
    createdAt: p.createdAt,
    resolvedAt: p.resolvedAt,
    imageUrl,
  };
}

function searchWhere(input: z.infer<typeof searchInput>) {
  const conds = [];
  if (input.status) conds.push(eq(publications.status, input.status));
  else conds.push(inArray(publications.status, ["active", "resolved"]));
  if (input.type) conds.push(eq(publications.type, input.type));
  if (input.species) conds.push(eq(publications.species, input.species));
  if (input.sex) conds.push(eq(publications.sex, input.sex));
  if (input.size) conds.push(eq(publications.size, input.size));
  if (input.province) conds.push(eq(publications.province, input.province));
  if (input.municipality) conds.push(eq(publications.municipality, input.municipality));
  if (input.since) {
    const hours = input.since === "24h" ? 24 : input.since === "7d" ? 24 * 7 : 24 * 30;
    conds.push(gte(publications.createdAt, new Date(Date.now() - hours * 3600 * 1000)));
  }
  if (input.q) {
    const like = `%${input.q.trim()}%`;
    conds.push(
      or(
        ilike(publications.petName, like),
        ilike(publications.description, like),
        ilike(publications.breed, like),
        ilike(publications.color, like),
        ilike(publications.zone, like),
        ilike(publications.municipality, like),
      ),
    );
  }
  return and(...conds);
}

export const publicationsRouter = createRouter({
  search: publicQuery.input(searchInput).query(async ({ input }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(publications)
      .where(searchWhere(input))
      .orderBy(desc(publications.createdAt))
      .limit(input.limit)
      .offset(input.offset);
    const imgMap = await presignImages(rows.map((r) => r.id));
    return rows.map((p) => toCard(p, imgMap.get(p.id)?.[0]?.url ?? null));
  }),

  count: publicQuery.input(searchInput).query(async ({ input }) => {
    const [{ n }] = await getDb()
      .select({ n: sql<number>`count(*)` })
      .from(publications)
      .where(searchWhere(input));
    return Number(n);
  }),

  recent: publicQuery
    .input(z.object({ limit: z.number().min(1).max(24).default(8) }))
    .query(async ({ input }) => {
      const rows = await getDb()
        .select()
        .from(publications)
        .where(eq(publications.status, "active"))
        .orderBy(desc(publications.createdAt))
        .limit(input.limit);
      const imgMap = await presignImages(rows.map((r) => r.id));
      return rows.map((p) => toCard(p, imgMap.get(p.id)?.[0]?.url ?? null));
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const q = async (where?: ReturnType<typeof eq>) => {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)` })
        .from(publications)
        .where(where ?? sql`status != 'deleted'`);
      return Number(n);
    };
    return {
      total: await q(sql`status != 'deleted'`),
      found: await q(eq(publications.type, "found")),
      reunited: await q(eq(publications.status, "resolved")),
      adoption: await q(and(eq(publications.type, "adoption"), eq(publications.status, "active"))),
    };
  }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string().max(120) }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const p = await db.query.publications.findFirst({
        where: eq(publications.slug, input.slug),
      });
      if (!p || p.status === "deleted") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Publicación no encontrada" });
      }
      const isOwner = ctx.user?.id === p.ownerId;
      const isAdmin = ctx.user?.role === "admin";
      if (p.status === "hidden" && !isOwner && !isAdmin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Publicación no disponible" });
      }
      const owner = await db.query.users.findFirst({ where: eq(users.id, p.ownerId) });
      const imgMap = await presignImages([p.id]);
      const { microchip: _m, ownerId: _o, deletedAt: _d, ...rest } = p;
      const exposePrivate = isOwner || isAdmin;
      const pub: PublicPublication & { isOwner: boolean } = {
        ...rest,
        isOwner: isOwner || isAdmin,
        ownerName: owner?.name ?? null,
        ownerAvatar: owner?.avatar ?? null,
        images: imgMap.get(p.id) ?? [],
        contactPhone: exposePrivate || p.showPhone ? p.contactPhone : null,
        contactWhatsapp: exposePrivate || p.showPhone ? p.contactWhatsapp : null,
        contactEmail: exposePrivate || p.showEmail ? p.contactEmail : null,
      };
      return pub;
    }),

  mine: authedQuery.query(async ({ ctx }) => {
    const rows = await getDb()
      .select()
      .from(publications)
      .where(and(eq(publications.ownerId, ctx.user.id), ne(publications.status, "deleted")))
      .orderBy(desc(publications.createdAt));
    const imgMap = await presignImages(rows.map((r) => r.id));
    return rows.map((p) => toCard(p, imgMap.get(p.id)?.[0]?.url ?? null));
  }),

  uploadImage: authedQuery
    .input(
      z.object({
        name: z.string().max(200),
        contentBase64: z.string().max(MAX_IMAGE_BYTES * 1.4),
        contentType: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Formato de imagen no permitido (usa JPG, PNG o WebP)" });
      }
      const bytes = Uint8Array.from(Buffer.from(input.contentBase64, "base64"));
      if (bytes.length > MAX_IMAGE_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La imagen supera el tamaño máximo (8 MB)" });
      }
      const ext = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
      const saved = await storage.uploadFile({
        fileContent: bytes,
        fileName: `patitas/${Date.now()}.${ext}`,
        contentType: input.contentType,
      });
      return { key: saved.key };
    }),

  create: authedQuery.input(publicationInput).mutation(async ({ ctx, input }) => {
    const db = getDb();
    // Anti-spam: límite de publicaciones por día
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(publications)
      .where(
        and(
          eq(publications.ownerId, ctx.user.id),
          gte(publications.createdAt, new Date(Date.now() - 24 * 3600 * 1000)),
        ),
      );
    if (Number(n) >= MAX_NEW_PUBLICATIONS_PER_DAY) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Has alcanzado el límite de publicaciones por hoy. Inténtalo mañana.",
      });
    }

    const { imageKeys, ...data } = input;
    const base = slugify(data.petName || TYPE_LABELS[data.type]);
    const zone = slugify(data.zone || data.municipality || data.province);
    const slug = `${base}${zone ? `-${zone}` : ""}-${randomSuffix()}`;

    const lat = data.approxLat != null ? fuzzCoord(data.approxLat) : null;
    const lng = data.approxLng != null ? fuzzCoord(data.approxLng) : null;

    const [{ id }] = await db
      .insert(publications)
      .values({
        ...data,
        petName: data.petName || null,
        breed: data.breed || null,
        color: data.color || null,
        features: data.features || null,
        microchip: data.microchip || null,
        municipality: data.municipality || null,
        zone: data.zone || null,
        approxLat: lat,
        approxLng: lng,
        eventTime: data.eventTime || null,
        rewardDetails: data.reward ? data.rewardDetails || null : null,
        specialNeeds: data.specialNeeds || null,
        instructions: data.instructions || null,
        contactPhone: data.contactPhone || null,
        contactWhatsapp: data.contactWhatsapp || null,
        contactEmail: data.contactEmail || null,
        slug,
        ownerId: ctx.user.id,
      })
      .$returningId();

    for (const [i, key] of imageKeys.slice(0, MAX_IMAGES).entries()) {
      await db.insert(publicationImages).values({ publicationId: id, storageKey: key, sortOrder: i });
    }

    // Coincidencias: al publicar perdido/encontrado, buscar el tipo opuesto compatible
    if (data.type === "lost" || data.type === "found") {
      const opposite = data.type === "lost" ? "found" : "lost";
      const candidates = await db
        .select()
        .from(publications)
        .where(
          and(
            eq(publications.type, opposite),
            eq(publications.status, "active"),
            eq(publications.species, data.species),
            eq(publications.province, data.province),
            data.sex !== "unknown" ? eq(publications.sex, data.sex) : sql`1=1`,
            gte(publications.createdAt, new Date(Date.now() - 45 * 24 * 3600 * 1000)),
          ),
        )
        .limit(5);
      for (const c of candidates) {
        await db.insert(notifications).values({
          userId: c.ownerId,
          type: "match",
          title: "Encontramos una posible coincidencia",
          body: `Una publicación nueva (${TYPE_LABELS[data.type]}, ${SPECIES_LABEL(data.species)} en ${data.province}) podría corresponder con tu caso.`,
          publicationSlug: slug,
        });
        await db.insert(notifications).values({
          userId: ctx.user.id,
          type: "match",
          title: "Posible coincidencia con tu publicación",
          body: `Existe un caso de "${TYPE_LABELS[c.type]}" en ${c.municipality ?? c.province} que podría estar relacionado.`,
          publicationSlug: c.slug,
        });
      }
    }

    return { slug };
  }),

  update: authedQuery
    .input(z.object({ slug: z.string(), data: publicationInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const p = await db.query.publications.findFirst({ where: eq(publications.slug, input.slug) });
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      if (p.ownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { imageKeys: _i, ...data } = input.data;
      await db.update(publications).set(data).where(eq(publications.id, p.id));
      return { ok: true };
    }),

  resolve: authedQuery
    .input(z.object({ slug: z.string(), story: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const p = await db.query.publications.findFirst({ where: eq(publications.slug, input.slug) });
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      if (p.ownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db
        .update(publications)
        .set({ status: "resolved", resolvedAt: new Date(), resolvedStory: input.story || null })
        .where(eq(publications.id, p.id));
      return { ok: true };
    }),

  remove: authedQuery
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const p = await db.query.publications.findFirst({ where: eq(publications.slug, input.slug) });
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      if (p.ownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db
        .update(publications)
        .set({ status: "deleted", deletedAt: new Date() })
        .where(eq(publications.id, p.id));
      return { ok: true };
    }),
});

function SPECIES_LABEL(s: string) {
  const map: Record<string, string> = { dog: "perro", cat: "gato", bird: "ave", rabbit: "conejo", rodent: "roedor", reptile: "reptil", other: "animal" };
  return map[s] ?? "animal";
}
