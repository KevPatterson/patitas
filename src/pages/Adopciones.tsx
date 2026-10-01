import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { PetCard, PetCardSkeleton, EmptyState } from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { SPECIES_LABELS, AGE_LABELS, SEX_LABELS, PROVINCES } from "@contracts/patitas";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ALL = "all";

export default function Adopciones() {
  const [species, setSpecies] = useState<string>();
  const [age, setAge] = useState<string>();
  const [sex, setSex] = useState<string>();
  const [province, setProvince] = useState<string>();

  const pubs = trpc.publications.search.useQuery({
    type: "adoption",
    species: species as never,
    sex: sex as never,
    province,
    limit: 48,
    offset: 0,
  });

  const result = (pubs.data ?? []).filter((p) => !age || p.age === age);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display font-extrabold text-3xl">Adopciones</h1>
      <p className="text-muted-foreground font-semibold mt-1">
        Estas mascotas buscan un hogar responsable. Adoptar cambia dos vidas.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <Select value={species ?? ALL} onValueChange={(v) => setSpecies(v === ALL ? undefined : v)}>
          <SelectTrigger className="rounded-full h-11 bg-card" aria-label="Animal"><SelectValue placeholder="Animal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {Object.entries(SPECIES_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={age ?? ALL} onValueChange={(v) => setAge(v === ALL ? undefined : v)}>
          <SelectTrigger className="rounded-full h-11 bg-card" aria-label="Edad"><SelectValue placeholder="Edad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Cualquier edad</SelectItem>
            {Object.entries(AGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sex ?? ALL} onValueChange={(v) => setSex(v === ALL ? undefined : v)}>
          <SelectTrigger className="rounded-full h-11 bg-card" aria-label="Sexo"><SelectValue placeholder="Sexo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Cualquier sexo</SelectItem>
            {Object.entries(SEX_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={province ?? ALL} onValueChange={(v) => setProvince(v === ALL ? undefined : v)}>
          <SelectTrigger className="rounded-full h-11 bg-card" aria-label="Provincia"><SelectValue placeholder="Provincia" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toda Cuba</SelectItem>
            {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {pubs.isLoading && Array.from({ length: 8 }).map((_, i) => <PetCardSkeleton key={i} />)}
        {result.map((p) => <PetCard key={p.slug} pub={p} />)}
      </div>
      {pubs.data?.length === 0 && (
        <EmptyState
          title="No hay mascotas en adopción con esos filtros"
          hint="¿Tienes una mascota que busca hogar? Publícala aquí."
          action={<Button asChild className="rounded-full font-bold"><Link to="/publicar">Publicar en adopción</Link></Button>}
        />
      )}
    </div>
  );
}
