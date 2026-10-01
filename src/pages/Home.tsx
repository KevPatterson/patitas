import { Link } from "react-router";
import { Search, Plus, MapPin, ShieldCheck, Bell, Camera, ArrowRight } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { PetCard, PetCardSkeleton } from "@/components/PetCard";
import { Button } from "@/components/ui/button";

export default function Home() {
  const stats = trpc.publications.stats.useQuery();
  const recent = trpc.publications.recent.useQuery({ limit: 8 });

  const statItems = [
    { n: stats.data?.total, label: "Mascotas publicadas" },
    { n: stats.data?.found, label: "Mascotas encontradas" },
    { n: stats.data?.reunited, label: "Reunidas con su familia" },
    { n: stats.data?.adoption, label: "En adopción" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/60 via-background to-background" />
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-12 md:pt-24 md:pb-20 text-center">
          <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tight">
            Patitas
          </h1>
          <p className="font-display font-bold text-xl md:text-2xl text-primary mt-2">
            Ayudemos a que vuelvan a casa.
          </p>
          <p className="max-w-xl mx-auto mt-4 text-muted-foreground font-semibold text-lg">
            Encuentra mascotas perdidas, reporta animales encontrados
            y ayuda a reunirlos con sus familias.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button asChild size="lg" variant="outline" className="rounded-full font-bold text-base px-8 h-13 bg-card">
              <Link to="/buscar"><Search className="w-5 h-5" /> Buscar mascota</Link>
            </Button>
            <Button asChild size="lg" className="rounded-full font-bold text-base px-8 h-13">
              <Link to="/publicar"><Plus className="w-5 h-5" /> Publicar caso</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="max-w-6xl mx-auto px-4 -mt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {statItems.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-3xl p-5 text-center">
              <div className="font-display font-extrabold text-3xl md:text-4xl text-primary">
                {s.n === undefined ? "—" : s.n.toLocaleString("es")}
              </div>
              <div className="text-sm font-semibold text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Casos recientes */}
      <section className="max-w-6xl mx-auto px-4 mt-14">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display font-bold text-2xl md:text-3xl">Casos recientes</h2>
          <Button asChild variant="ghost" className="rounded-full font-bold text-primary">
            <Link to="/buscar">Ver todos <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recent.isLoading &&
            Array.from({ length: 4 }).map((_, i) => <PetCardSkeleton key={i} />)}
          {recent.data?.map((p) => <PetCard key={p.slug} pub={p} />)}
          {recent.data?.length === 0 && (
            <div className="col-span-full bg-card border border-dashed border-border rounded-3xl p-10 text-center">
              <p className="font-display font-bold text-xl">Aún no hay casos publicados</p>
              <p className="text-muted-foreground mt-2">Sé la primera persona en publicar y ayudar a una mascota.</p>
              <Button asChild className="rounded-full font-bold mt-5">
                <Link to="/publicar"><Plus className="w-4 h-4" /> Publicar el primer caso</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-6">Así de sencillo es ayudar</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Camera, title: "Publica en minutos", text: "Describe a la mascota, agrega fotos y una ubicación aproximada. Sin complicaciones." },
            { icon: Bell, title: "Te avisamos de coincidencias", text: "Si alguien publica un caso que coincide con el tuyo, recibirás una notificación." },
            { icon: ShieldCheck, title: "Tu privacidad protegida", text: "Nunca mostramos tu dirección exacta ni tus datos de contacto sin tu permiso." },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-3xl p-6">
              <div className="w-12 h-12 rounded-full bg-secondary grid place-items-center text-secondary-foreground">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg mt-4">{f.title}</h3>
              <p className="text-muted-foreground mt-2">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA mapa */}
      <section className="max-w-6xl mx-auto px-4 mt-16 mb-4">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl">Explora el mapa de casos</h2>
            <p className="mt-2 opacity-90 font-semibold max-w-lg">
              Mira las mascotas perdidas, encontradas y en adopción cerca de tu zona.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="rounded-full font-bold bg-card text-foreground hover:bg-card/90">
            <Link to="/mapa"><MapPin className="w-5 h-5" /> Abrir el mapa</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
