import { Link } from "react-router";
import { MapPin, Clock, PawPrint } from "lucide-react";
import type { PublicationCard } from "@contracts/patitas";
import { timeAgo, typeLabel, speciesLabel, speciesIcons, typeColor, locationLabel } from "@/lib/patitas";

export function TypeBadge({ type, resolved }: { type: string; resolved?: boolean }) {
  const color = resolved ? "#2F9E63" : typeColor(type);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      {resolved ? "¡Resuelto!" : typeLabel(type)}
    </span>
  );
}

export function PetCard({ pub }: { pub: PublicationCard }) {
  const SpeciesIcon = speciesIcons[pub.species] ?? PawPrint;
  const resolved = pub.status === "resolved";
  return (
    <Link
      to={`/p/${pub.slug}`}
      className="group block bg-card rounded-3xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {pub.imageUrl ? (
          <img
            src={pub.imageUrl}
            alt={pub.petName ? `Foto de ${pub.petName}` : "Foto de la mascota"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <SpeciesIcon className="w-14 h-14 opacity-40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <TypeBadge type={pub.type} resolved={resolved} />
        </div>
        {pub.reward && !resolved && (
          <span className="absolute top-3 right-3 bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-full">
            Recompensa
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-lg leading-tight">
          {pub.petName || (pub.type === "found" ? "Mascota encontrada" : "Sin nombre")}
        </h3>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mt-1">
          <SpeciesIcon className="w-4 h-4" /> {speciesLabel(pub.species)}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">{locationLabel(pub)}</span>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
          <Clock className="w-3.5 h-3.5" /> {timeAgo(pub.createdAt)}
        </p>
      </div>
    </Link>
  );
}

export function PetCardSkeleton() {
  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-muted rounded-full w-2/3" />
        <div className="h-4 bg-muted rounded-full w-1/3" />
        <div className="h-4 bg-muted rounded-full w-1/2" />
      </div>
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted grid place-items-center mb-4">
        <PawPrint className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-display font-bold text-xl">{title}</h3>
      {hint && <p className="text-muted-foreground mt-2 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
