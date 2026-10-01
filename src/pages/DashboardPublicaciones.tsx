import { Link } from "react-router";
import { Plus } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { PetCard, PetCardSkeleton, EmptyState } from "@/components/PetCard";
import { Button } from "@/components/ui/button";

export default function DashboardPublicaciones() {
  const mine = trpc.publications.mine.useQuery();
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display font-extrabold text-2xl">Mis publicaciones</h1>
        <Button asChild className="rounded-full font-bold">
          <Link to="/publicar"><Plus className="w-4 h-4" /> Nueva</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mine.isLoading && Array.from({ length: 4 }).map((_, i) => <PetCardSkeleton key={i} />)}
        {mine.data?.map((p) => <PetCard key={p.slug} pub={p} />)}
      </div>
      {mine.data?.length === 0 && (
        <EmptyState title="Sin publicaciones" hint="Cuando publiques un caso aparecerá aquí." />
      )}
    </div>
  );
}
