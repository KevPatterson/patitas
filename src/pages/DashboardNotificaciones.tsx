import { Link } from "react-router";
import { Bell, CheckCheck } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/patitas";
import { EmptyState } from "@/components/PetCard";

export default function DashboardNotificaciones() {
  const utils = trpc.useUtils();
  const list = trpc.notifications.list.useQuery();
  const markAll = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); utils.notifications.unreadCount.invalidate(); },
  });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); utils.notifications.unreadCount.invalidate(); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display font-extrabold text-2xl">Notificaciones</h1>
        {(list.data?.some((n) => !n.readAt)) && (
          <Button variant="ghost" className="rounded-full font-bold text-primary" onClick={() => markAll.mutate()}>
            <CheckCheck className="w-4 h-4" /> Marcar todas como leídas
          </Button>
        )}
      </div>
      <ul className="space-y-2">
        {list.data?.map((n) => {
          const inner = (
            <div className={`flex gap-3 p-4 rounded-3xl border transition-colors ${n.readAt ? "bg-card border-border" : "bg-secondary/60 border-transparent"}`}>
              <span className="shrink-0 w-10 h-10 rounded-full bg-card grid place-items-center">
                <Bell className="w-5 h-5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="font-bold">{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-xs text-muted-foreground font-semibold mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          );
          return (
            <li key={n.id} onClick={() => !n.readAt && markRead.mutate({ id: n.id })}>
              {n.publicationSlug ? <Link to={`/p/${n.publicationSlug}`}>{inner}</Link> : inner}
            </li>
          );
        })}
      </ul>
      {list.data?.length === 0 && (
        <EmptyState title="Sin notificaciones" hint="Te avisaremos cuando haya coincidencias, mensajes o avistamientos." />
      )}
    </div>
  );
}
