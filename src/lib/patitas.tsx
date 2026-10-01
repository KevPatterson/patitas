import {
  Dog, Cat, Bird, Rabbit, Rat, Turtle, PawPrint,
  Search, Heart, Eye, Home, AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  TYPE_LABELS, SPECIES_LABELS, SEX_LABELS, AGE_LABELS, SIZE_LABELS, TYPE_COLORS,
} from "@contracts/patitas";

export const speciesIcons: Record<string, LucideIcon> = {
  dog: Dog, cat: Cat, bird: Bird, rabbit: Rabbit, rodent: Rat, reptile: Turtle, other: PawPrint,
};

export const typeIcons: Record<string, LucideIcon> = {
  lost: AlertCircle, found: Search, abandoned: Home, adoption: Heart, sighting: Eye,
};

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? "es" : ""}`;
}

export function fmtDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

export function locationLabel(p: { zone?: string | null; municipality?: string | null; province?: string | null }) {
  return [...new Set([p.zone, p.municipality, p.province].filter(Boolean))].join(", ");
}

export function typeLabel(t: string) { return TYPE_LABELS[t] ?? t; }
export function speciesLabel(s: string) { return SPECIES_LABELS[s] ?? s; }
export function sexLabel(s: string) { return SEX_LABELS[s] ?? s; }
export function ageLabel(s: string) { return AGE_LABELS[s] ?? s; }
export function sizeLabel(s: string) { return SIZE_LABELS[s] ?? s; }
export function typeColor(t: string) { return TYPE_COLORS[t] ?? "#666"; }

export function shareUrl(slug: string) {
  return `${window.location.origin}/p/${slug}`;
}

export function shareLinks(slug: string, title: string) {
  const url = encodeURIComponent(shareUrl(slug));
  const text = encodeURIComponent(title);
  return {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  };
}

export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
