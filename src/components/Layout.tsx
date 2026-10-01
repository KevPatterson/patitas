import { Link, NavLink, useLocation } from "react-router";
import { PawPrint, Search, Map, Plus, Heart, Bell, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 select-none">
      <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground">
        <PawPrint className="w-5 h-5" />
      </span>
      <span className="font-display font-bold text-2xl tracking-tight">Patitas</span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const unread = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const nav = [
    { to: "/buscar", label: "Buscar" },
    { to: "/mapa", label: "Mapa" },
    { to: "/adopciones", label: "Adopciones" },
    { to: "/como-funciona", label: "Cómo funciona" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Logo />
          <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                    isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link to="/dashboard/notificaciones" className="relative p-2 rounded-full hover:bg-muted" aria-label="Notificaciones">
                <Bell className="w-5 h-5" />
                {(unread.data ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-4 h-4 grid place-items-center px-1">
                    {unread.data}
                  </span>
                )}
              </Link>
            )}
            <Button asChild className="hidden sm:inline-flex rounded-full font-bold">
              <Link to="/publicar">
                <Plus className="w-4 h-4" /> Publicar caso
              </Link>
            </Button>
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost" className="rounded-full font-semibold">
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-4 h-4" /> {user?.name?.split(" ")[0] ?? "Mi cuenta"}
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => logout()} aria-label="Cerrar sesión">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" className="hidden md:inline-flex rounded-full font-semibold">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            )}
            <button
              className="md:hidden p-2 rounded-full hover:bg-muted"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1" aria-label="Menú móvil">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-2xl font-semibold hover:bg-muted"
              >
                {n.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-2xl font-semibold hover:bg-muted">
                  Mi panel
                </NavLink>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="block w-full text-left px-4 py-3 rounded-2xl font-semibold text-destructive hover:bg-muted"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <NavLink to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-2xl font-semibold hover:bg-muted">
                Iniciar sesión
              </NavLink>
            )}
          </nav>
        )}
      </header>

      <main id="contenido" className="flex-1 pb-24 md:pb-0">{children}</main>

      <footer className="hidden md:block border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <Logo />
            <p className="text-muted-foreground mt-2 font-semibold">Ayudemos a que vuelvan a casa.</p>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-muted-foreground">
            <Link to="/buscar" className="hover:text-foreground">Buscar</Link>
            <Link to="/adopciones" className="hover:text-foreground">Adopciones</Link>
            <Link to="/como-funciona" className="hover:text-foreground">Cómo funciona</Link>
            {user?.role === "admin" && <Link to="/admin" className="hover:text-foreground">Administración</Link>}
          </div>
        </div>
      </footer>

      {/* Navegación inferior móvil */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-safe"
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-5 h-16">
          {[
            { to: "/", icon: PawPrint, label: "Inicio" },
            { to: "/buscar", icon: Search, label: "Buscar" },
            { to: "/publicar", icon: Plus, label: "Publicar", highlight: true },
            { to: "/mapa", icon: Map, label: "Mapa" },
            { to: isAuthenticated ? "/dashboard" : "/login", icon: isAuthenticated ? LayoutDashboard : Heart, label: isAuthenticated ? "Panel" : "Entrar" },
          ].map((n) => {
            const active = location.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-11 ${
                  n.highlight
                    ? "text-primary"
                    : active
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {n.highlight ? (
                  <span className="grid place-items-center w-11 h-11 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg border-4 border-background">
                    <Icon className="w-5 h-5" />
                  </span>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span className="text-[10px] font-bold">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
