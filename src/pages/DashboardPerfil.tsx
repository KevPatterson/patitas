import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { fmtDate } from "@/lib/patitas";

export default function DashboardPerfil() {
  const { user } = useAuth();
  const mine = trpc.publications.mine.useQuery();
  const resolved = mine.data?.filter((p) => p.status === "resolved").length ?? 0;

  return (
    <div className="max-w-md">
      <h1 className="font-display font-extrabold text-2xl mb-6">Perfil</h1>
      <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-4">
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-secondary grid place-items-center font-display font-extrabold text-2xl text-secondary-foreground">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="font-display font-bold text-xl">{user?.name ?? "Usuario"}</p>
          {user?.email && <p className="text-sm text-muted-foreground font-semibold">{user.email}</p>}
          <p className="text-sm text-muted-foreground font-semibold">
            Miembro desde {user?.createdAt ? fmtDate(user.createdAt) : "—"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-card border border-border rounded-3xl p-4 text-center">
          <p className="font-display font-extrabold text-2xl text-primary">{mine.data?.filter((p) => p.status === "active").length ?? 0}</p>
          <p className="text-xs font-semibold text-muted-foreground">Activas</p>
        </div>
        <div className="bg-card border border-border rounded-3xl p-4 text-center">
          <p className="font-display font-extrabold text-2xl text-primary">{resolved}</p>
          <p className="text-xs font-semibold text-muted-foreground">Resueltas</p>
        </div>
        <div className="bg-card border border-border rounded-3xl p-4 text-center">
          <p className="font-display font-extrabold text-2xl text-primary">{resolved}</p>
          <p className="text-xs font-semibold text-muted-foreground">Mascotas ayudadas</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-semibold mt-4">
        Tu información de contacto nunca se muestra públicamente sin tu permiso.
      </p>
    </div>
  );
}
