import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  publications,
  reports,
  notifications,
  sightings,
  comments,
  adoptionRequests,
  users,
} from "@db/schema";
import { REASON_LABELS } from "@contracts/patitas";
import { REPORT_REASONS } from "@db/schema";

async function pubBySlug(slug: string) {
  const p = await getDb().query.publications.findFirst({
    where: eq(publications.slug, slug),
  });
  if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Publicación no encontrada" });
  return p;
}

async function notifyOwner(publicationId: number, n: {
  type: "match" | "comment" | "report" | "resolved" | "nearby" | "system";
  title: string; body?: string; publicationSlug?: string;
}) {
  const p = await getDb().query.publications.findFirst({ where: eq(publications.id, publicationId) });
  if (!p) return;
  await getDb().insert(notifications).values({ userId: p.ownerId, ...n });
}

export const reportsRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        slug: z.string(),
        reason: z.enum(REPORT_REASONS),
        description: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const p = await pubBySlug(input.slug);
      
      // Rate limiting: máximo de reportes por usuario
      if (ctx.user) {
        // Verificar que no haya reportado ya esta publicación
        const existing = await db.query.reports.findFirst({
          where: and(
            eq(reports.publicationId, p.id),
            eq(reports.reporterId, ctx.user.id),
          ),
        });
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ya reportaste esta publicación" });
        }
        
        // Verificar límite de reportes por día (anti-abuso)
        const [{ n }] = await db
          .select({ n: sql<number>`count(*)` })
          .from(reports)
          .where(
            and(
              eq(reports.reporterId, ctx.user.id),
              sql`createdAt >= NOW() - INTERVAL 24 HOUR`
            )
          );
        if (Number(n) >= 10) {
          throw new TRPCError({ 
            code: "TOO_MANY_REQUESTS", 
            message: "Has alcanzado el límite de reportes por día" 
          });
        }
      }
      
      await db.insert(reports).values({
        publicationId: p.id,
        reporterId: ctx.user?.id ?? null,
        reason: input.reason,
        description: input.description || null,
      });
      return { ok: true };
    }),
});

export const notificationsRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }),
  unreadCount: authedQuery.query(async ({ ctx }) => {
    const [{ n }] = await getDb()
      .select({ n: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), sql`readAt IS NULL`));
    return Number(n);
  }),
  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await getDb()
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
      return { ok: true };
    }),
  markAllRead: authedQuery.mutation(async ({ ctx }) => {
    await getDb()
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, ctx.user.id), sql`readAt IS NULL`));
    return { ok: true };
  }),
});

export const commentsRouter = createRouter({
  list: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const p = await pubBySlug(input.slug);
      const rows = await db
        .select({
          id: comments.id,
          body: comments.body,
          createdAt: comments.createdAt,
          authorName: users.name,
          authorAvatar: users.avatar,
        })
        .from(comments)
        .leftJoin(users, eq(users.id, comments.authorId))
        .where(eq(comments.publicationId, p.id))
        .orderBy(desc(comments.createdAt))
        .limit(100);
      return rows;
    }),
  create: authedQuery
    .input(z.object({ slug: z.string(), body: z.string().min(2).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const p = await pubBySlug(input.slug);
      await db.insert(comments).values({
        publicationId: p.id,
        authorId: ctx.user.id,
        body: input.body,
      });
      if (p.ownerId !== ctx.user.id) {
        await notifyOwner(p.id, {
          type: "comment",
          title: "Alguien respondió a tu publicación",
          body: input.body.slice(0, 140),
          publicationSlug: p.slug,
        });
      }
      return { ok: true };
    }),
});

export const sightingsRouter = createRouter({
  list: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const p = await pubBySlug(input.slug);
      return db
        .select()
        .from(sightings)
        .where(eq(sightings.publicationId, p.id))
        .orderBy(desc(sightings.seenAt));
    }),
  create: authedQuery
    .input(
      z.object({
        slug: z.string(),
        note: z.string().max(2000).optional(),
        province: z.string().max(80).optional(),
        municipality: z.string().max(80).optional(),
        zone: z.string().max(120).optional(),
        approxLat: z.number().optional(),
        approxLng: z.number().optional(),
        seenAt: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const p = await pubBySlug(input.slug);
      await db.insert(sightings).values({
        publicationId: p.id,
        userId: ctx.user.id,
        note: input.note || null,
        province: input.province || null,
        municipality: input.municipality || null,
        zone: input.zone || null,
        approxLat: input.approxLat ?? null,
        approxLng: input.approxLng ?? null,
        seenAt: input.seenAt ?? new Date(),
      });
      await notifyOwner(p.id, {
        type: "nearby",
        title: "Nuevo avistamiento de tu mascota",
        body: input.note?.slice(0, 140) || `Reportado en ${input.zone ?? input.municipality ?? input.province ?? "tu zona"}`,
        publicationSlug: p.slug,
      });
      return { ok: true };
    }),
});

export const adoptionsRouter = createRouter({
  request: authedQuery
    .input(z.object({ slug: z.string(), message: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const p = await pubBySlug(input.slug);
      if (p.type !== "adoption") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta publicación no es una adopción" });
      }
      const existing = await db.query.adoptionRequests.findFirst({
        where: and(
          eq(adoptionRequests.publicationId, p.id),
          eq(adoptionRequests.requesterId, ctx.user.id),
        ),
      });
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Ya enviaste una solicitud" });
      await db.insert(adoptionRequests).values({
        publicationId: p.id,
        requesterId: ctx.user.id,
        message: input.message || null,
      });
      await notifyOwner(p.id, {
        type: "comment",
        title: "Nueva solicitud de adopción",
        body: input.message?.slice(0, 140),
        publicationSlug: p.slug,
      });
      return { ok: true };
    }),
});

export const adminRouter = createRouter({
  overview: adminQuery.query(async () => {
    const db = getDb();
    const count = async (t: typeof publications | typeof reports | typeof users, where?: SQL) => {
      const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(t).where(where);
      return Number(n);
    };
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    return {
      activePublications: await count(publications, sql`status = 'active'`),
      pendingReports: await count(reports, sql`status = 'pending'`),
      totalUsers: await count(users),
      resolved: await count(publications, sql`status = 'resolved'`),
      todayPublications: await count(publications, sql`createdAt >= ${today}`),
    };
  }),

  reports: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: reports.id,
        reason: reports.reason,
        description: reports.description,
        status: reports.status,
        createdAt: reports.createdAt,
        pubSlug: publications.slug,
        pubName: publications.petName,
        pubType: publications.type,
        reporterName: users.name,
      })
      .from(reports)
      .leftJoin(publications, eq(publications.id, reports.publicationId))
      .leftJoin(users, eq(users.id, reports.reporterId))
      .orderBy(desc(reports.createdAt))
      .limit(100);
  }),

  resolveReport: adminQuery
    .input(
      z.object({
        reportId: z.number(),
        action: z.enum(["dismiss", "hide", "delete"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const r = await db.query.reports.findFirst({ where: eq(reports.id, input.reportId) });
      if (!r) throw new TRPCError({ code: "NOT_FOUND" });
      if (input.action !== "dismiss") {
        await db
          .update(publications)
          .set(
            input.action === "hide"
              ? { status: "hidden" }
              : { status: "deleted", deletedAt: new Date() },
          )
          .where(eq(publications.id, r.publicationId));
        const p = await db.query.publications.findFirst({ where: eq(publications.id, r.publicationId) });
        if (p) {
          await db.insert(notifications).values({
            userId: p.ownerId,
            type: "report",
            title: "Tu publicación fue revisada por moderación",
            body: `Motivo del reporte: ${REASON_LABELS[r.reason] ?? r.reason}.`,
            publicationSlug: p.slug,
          });
        }
      }
      await db
        .update(reports)
        .set({
          status: input.action === "dismiss" ? "dismissed" : "resolved",
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        })
        .where(eq(reports.id, input.reportId));
      return { ok: true };
    }),

  listUsers: adminQuery.query(async () => {
    return getDb()
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(200);
  }),

  setRole: adminQuery
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input }) => {
      await getDb().update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { ok: true };
    }),
});
