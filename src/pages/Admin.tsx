import { useState } from "react";
import { Link, Navigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { REASON_LABELS, TYPE_LABELS } from "@contracts/patitas";
import { fmtDate } from "@/lib/patitas";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tab, setTab] = useState<"reportes" | "usuarios">("reportes");
  const utils = trpc.useUtils();

  const overview = trpc.admin.overview.useQuery(undefined, { enabled: user?.role === "admin" });
  const reports = trpc.admin.reports.useQuery(undefined, { enabled: user?.role === "admin" });
  const users = trpc.admin.listUsers.useQuery(undefined, { enabled: user?.role === "admin" && tab === "usuarios" });
  const resolveReport = trpc.admin.resolveReport.useMutation({
    onSuccess: () => { utils.admin.reports.invalidate(); utils.admin.overview.invalidate(); },
  });
  const setRole = trpc.admin.setRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  if (isLoading) return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-muted-foreground font-semibold">Cargando…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-extrabold text-2xl">Acceso restringido</h1>
        <p className="text-muted-foreground font-semibold mt-2">Esta sección es solo para el equipo de moderación.</p>
      </div>
    );
  }

  const stats = overview.data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display font-extrabold text-3xl">Administración</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
        {[
          { n: stats?.activePublications, label: "Publicaciones activas" },
          { n: stats?.pendingReports, label: "Reportes pendientes" },
          { n: stats?.totalUsers, label: "Usuarios" },
          { n: stats?.resolved, label: "Mascotas recuperadas" },
          { n: stats?.todayPublications, label: "Publicaciones hoy" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-3xl p-4 text-center">
            <div className="font-display font-extrabold text-2xl text-primary">{s.n ?? "—"}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-8">
        {(["reportes", "usuarios"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 rounded-full font-bold text-sm min-h-11 capitalize ${
              tab === t ? "bg-foreground text-background" : "bg-card border border-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "reportes" && (
        <div className="mt-4 space-y-3">
          {reports.data?.length === 0 && (
            <p className="text-muted-foreground font-semibold py-10 text-center">No hay reportes. Todo en orden 🎉</p>
          )}
          {reports.data?.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-3xl p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${
                  r.status === "pending" ? "bg-amber-100 text-amber-800" :
                  r.status === "resolved" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                }`}>
                  {r.status === "pending" ? "Pendiente" : r.status === "resolved" ? "Resuelto" : r.status === "reviewing" ? "En revisión" : "Descartado"}
                </span>
                <span className="font-bold">{REASON_LABELS[r.reason] ?? r.reason}</span>
                <span className="text-sm text-muted-foreground font-semibold">{fmtDate(r.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm">
                Publicación:{" "}
                <Link to={`/p/${r.pubSlug}`} className="font-bold text-primary hover:underline">
                  {r.pubName || "Sin nombre"} ({TYPE_LABELS[r.pubType ?? ""] ?? r.pubType})
                </Link>
                {" · "}Reportado por: {r.reporterName ?? "Anónimo"}
              </p>
              {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
              {r.status === "pending" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="outline" className="rounded-full font-bold" onClick={() => resolveReport.mutate({ reportId: r.id, action: "hide" })}>Ocultar publicación</Button>
                  <Button size="sm" variant="destructive" className="rounded-full font-bold" onClick={() => resolveReport.mutate({ reportId: r.id, action: "delete" })}>Eliminar publicación</Button>
                  <Button size="sm" variant="ghost" className="rounded-full font-bold" onClick={() => resolveReport.mutate({ reportId: r.id, action: "dismiss" })}>Descartar reporte</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "usuarios" && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm bg-card border border-border rounded-3xl overflow-hidden">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="p-4 font-bold">Nombre</th>
                <th className="p-4 font-bold">Correo</th>
                <th className="p-4 font-bold">Rol</th>
                <th className="p-4 font-bold">Registro</th>
                <th className="p-4 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-4 font-semibold">{u.name ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="p-4">{u.role === "admin" ? "Admin" : "Usuario"}</td>
                  <td className="p-4 text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  <td className="p-4">
                    <Button
                      size="sm" variant="ghost" className="rounded-full font-bold"
                      onClick={() => setRole.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                    >
                      {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
