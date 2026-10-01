import { Link } from "react-router";
import { Plus } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { PetCard, PetCardSkeleton, EmptyState } from "@/components/PetCard";
import { Button } from "@/components/ui/button";

export default function DashboardHome() {
  const { user } = useAuth();
  const mine = trpc.publications.mine.useQuery();
  const unread = trpc.notifications.unreadCount.useQuery();

  const active = mine.data?.filter((p) => p.status === "active").length ?? 0;
  const resolved = mine.data?.filter((p) => p.status === "resolved").length ?? 0;

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl">
        Hola, {user?.name?.split(" ")[0] ?? "amigo"} 👋
      </h1>
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { n: active, label: "Activas" },
          { n: resolved, label: "Resueltas" },
          { n: unread.data ?? 0, label: "Alertas" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-3xl p-5 text-center">
            <div className="font-display font-extrabold text-3xl text-primary">{s.n}</div>
            <div className="text-sm font-semibold text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="font-display font-bold text-2xl">Tus publicaciones</h2>
        <Button asChild className="rounded-full font-bold">
          <Link to="/publicar"><Plus className="w-4 h-4" /> Nueva publicación</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mine.isLoading && Array.from({ length: 4 }).map((_, i) => <PetCardSkeleton key={i} />)}
        {mine.data?.slice(0, 4).map((p) => <PetCard key={p.slug} pub={p} />)}
      </div>
      {mine.data?.length === 0 && (
        <EmptyState
          title="Aún no tienes publicaciones"
          hint="Publica tu primer caso y la comunidad te ayudará."
          action={<Button asChild className="rounded-full font-bold"><Link to="/publicar">Publicar un caso</Link></Button>}
        />
      )}
    </div>
  );
}
