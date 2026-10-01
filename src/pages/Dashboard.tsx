import { NavLink, Outlet, Navigate } from "react-router";
import { LayoutGrid, FileText, Bell, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TABS = [
  { to: "/dashboard", icon: LayoutGrid, label: "Resumen", end: true },
  { to: "/dashboard/publicaciones", icon: FileText, label: "Mis publicaciones" },
  { to: "/dashboard/notificaciones", icon: Bell, label: "Notificaciones" },
  { to: "/dashboard/perfil", icon: User, label: "Perfil" },
];

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-muted-foreground font-semibold">Cargando…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm whitespace-nowrap min-h-11 transition-colors ${
                isActive ? "bg-foreground text-background" : "bg-card border border-border hover:bg-muted"
              }`
            }
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </NavLink>
        ))}
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
