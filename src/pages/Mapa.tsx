import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { MapView } from "@/components/MapView";
import { TYPE_LABELS, TYPE_COLORS } from "@contracts/patitas";

export default function Mapa() {
  const [type, setType] = useState<string | undefined>();
  const pubs = trpc.publications.search.useQuery({ type: type as never, limit: 60, offset: 0 });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display font-extrabold text-3xl">Mapa de casos</h1>
      <p className="text-muted-foreground font-semibold mt-1">
        Las ubicaciones son aproximadas para proteger la privacidad de todos.
      </p>

      <div className="flex flex-wrap gap-2 mt-5" role="group" aria-label="Filtrar por tipo">
        <button
          onClick={() => setType(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors min-h-11 ${
            !type ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"
          }`}
        >
          Todos
        </button>
        {Object.entries(TYPE_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setType(k)}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors min-h-11 flex items-center gap-2 ${
              type === k ? "text-white border-transparent" : "bg-card border-border hover:bg-muted"
            }`}
            style={type === k ? { backgroundColor: TYPE_COLORS[k] } : undefined}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type === k ? "#fff" : TYPE_COLORS[k] }} />
            {v}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {pubs.isLoading ? (
          <div className="h-[70vh] rounded-3xl bg-muted animate-pulse" />
        ) : (
          <MapView pubs={pubs.data ?? []} />
        )}
      </div>
      <p className="mt-3 text-sm text-muted-foreground font-semibold" aria-live="polite">
        {(pubs.data ?? []).filter((p) => p.approxLat != null).length} casos con ubicación en el mapa
      </p>
    </div>
  );
}
