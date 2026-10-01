import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { PetCard, PetCardSkeleton, EmptyState } from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PROVINCES, CUBA, TYPE_LABELS, SPECIES_LABELS, SEX_LABELS, SIZE_LABELS } from "@contracts/patitas";
import type { SearchInput } from "@contracts/patitas";

const ALL = "all";

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo<SearchInput>(() => ({
    q: params.get("q") || undefined,
    type: (params.get("type") as SearchInput["type"]) || undefined,
    species: (params.get("species") as SearchInput["species"]) || undefined,
    sex: (params.get("sex") as SearchInput["sex"]) || undefined,
    size: (params.get("size") as SearchInput["size"]) || undefined,
    province: params.get("province") || undefined,
    municipality: params.get("municipality") || undefined,
    status: (params.get("status") as SearchInput["status"]) || undefined,
    since: (params.get("since") as SearchInput["since"]) || undefined,
    limit: 48,
    offset: 0,
  }), [params]);

  const results = trpc.publications.search.useQuery(filters);
  const count = trpc.publications.count.useQuery(filters);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== ALL) next.set(key, value);
    else next.delete(key);
    if (key === "province") next.delete("municipality");
    setParams(next, { replace: true });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", q);
  };

  const municipalities = filters.province ? CUBA[filters.province] ?? [] : [];
  const hasFilters = ["type", "species", "sex", "size", "province", "since", "status", "q"].some((k) => params.get(k));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display font-extrabold text-3xl">Buscar mascotas</h1>

      <form onSubmit={submitSearch} className="mt-5 flex gap-2" role="search">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Toby, perro caramelo, Playa…"
          className="h-12 rounded-full bg-card px-5 text-base"
          aria-label="Buscar"
        />
        <Button type="submit" size="lg" className="rounded-full h-12 px-6" aria-label="Buscar">
          <Search className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          size="lg"
          variant={showFilters ? "secondary" : "outline"}
          className="rounded-full h-12 px-5 bg-card"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden sm:inline font-bold">Filtros</span>
        </Button>
      </form>

      {showFilters && (
        <div className="mt-4 bg-card border border-border rounded-3xl p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={filters.type ?? ALL} onValueChange={(v) => setParam("type", v)}>
            <SelectTrigger className="rounded-full h-11" aria-label="Estado"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              <SelectItem value="__sep" disabled>—</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.species ?? ALL} onValueChange={(v) => setParam("species", v)}>
            <SelectTrigger className="rounded-full h-11" aria-label="Animal"><SelectValue placeholder="Animal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los animales</SelectItem>
              {Object.entries(SPECIES_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.province ?? ALL} onValueChange={(v) => setParam("province", v)}>
            <SelectTrigger className="rounded-full h-11" aria-label="Provincia"><SelectValue placeholder="Provincia" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toda Cuba</SelectItem>
              {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.municipality ?? ALL} onValueChange={(v) => setParam("municipality", v)} disabled={municipalities.length === 0}>
            <SelectTrigger className="rounded-full h-11" aria-label="Municipio"><SelectValue placeholder="Municipio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los municipios</SelectItem>
              {municipalities.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.sex ?? ALL} onValueChange={(v) => setParam("sex", v)}>
            <SelectTrigger className="rounded-full h-11" aria-label="Sexo"><SelectValue placeholder="Sexo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Cualquier sexo</SelectItem>
              {Object.entries(SEX_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.size ?? ALL} onValueChange={(v) => setParam("size", v)}>
            <SelectTrigger className="rounded-full h-11" aria-label="Tamaño"><SelectValue placeholder="Tamaño" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Cualquier tamaño</SelectItem>
              {Object.entries(SIZE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.since ?? ALL} onValueChange={(v) => setParam("since", v)}>
            <SelectTrigger className="rounded-full h-11" aria-label="Fecha"><SelectValue placeholder="Fecha" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Cualquier fecha</SelectItem>
              <SelectItem value="24h">Últimas 24 horas</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Último mes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status ?? ALL} onValueChange={(v) => setParam("status", v)}>
            <SelectTrigger className="rounded-full h-11" aria-label="Situación"><SelectValue placeholder="Situación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Activas y resueltas</SelectItem>
              <SelectItem value="active">Solo activas</SelectItem>
              <SelectItem value="resolved">Solo resueltas</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" className="rounded-full col-span-full justify-self-start font-bold text-primary" onClick={() => { setParams({}, { replace: true }); setQ(""); }}>
              <X className="w-4 h-4" /> Limpiar filtros
            </Button>
          )}
        </div>
      )}

      <p className="mt-6 text-sm font-semibold text-muted-foreground" aria-live="polite">
        {count.data !== undefined ? `${count.data} resultado${count.data === 1 ? "" : "s"}` : "Buscando…"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {results.isLoading && Array.from({ length: 8 }).map((_, i) => <PetCardSkeleton key={i} />)}
        {results.data?.map((p) => <PetCard key={p.slug} pub={p} />)}
      </div>
      {results.data?.length === 0 && (
        <EmptyState
          title="No encontramos resultados"
          hint="Prueba con otros términos o amplía los filtros. También puedes publicar un caso para que la comunidad te ayude."
          action={
            <Button asChild className="rounded-full font-bold">
              <Link to="/publicar">Publicar un caso</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
