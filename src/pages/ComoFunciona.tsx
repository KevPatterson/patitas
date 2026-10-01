import { Link } from "react-router";
import { Camera, MapPin, Bell, ShieldCheck, Share2, Flag, CheckCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    icon: Camera,
    title: "Publica en menos de unos minutos",
    text: "Describe a la mascota paso a paso: especie, color, zona, fotos y cómo contactarte. No necesitas conocimientos técnicos.",
  },
  {
    icon: MapPin,
    title: "Todo geolocalizado y buscable",
    text: "Cada caso aparece en el mapa y en el buscador con filtros por tipo de caso, animal, provincia, fecha y más. Nada se pierde como en los estados de WhatsApp.",
  },
  {
    icon: Bell,
    title: "Coincidencias automáticas",
    text: "Cuando alguien publica un caso compatible con el tuyo (misma especie, zona y características), Patitas te avisa con una notificación.",
  },
  {
    icon: Eye,
    title: "Avistamientos con línea temporal",
    text: "Si alguien vio a tu mascota, puede reportarlo desde tu publicación. Cada avistamiento se suma a una línea temporal que ayuda a seguir su rastro.",
  },
  {
    icon: ShieldCheck,
    title: "Tu privacidad primero",
    text: "Nunca mostramos tu dirección exacta: las ubicaciones se difuminan automáticamente. Tu teléfono y correo solo se muestran si tú lo decides, y puedes recibir mensajes mediante Patitas.",
  },
  {
    icon: Share2,
    title: "Comparte con un enlace",
    text: "Cada publicación tiene un enlace único listo para compartir por WhatsApp, Facebook o Telegram.",
  },
  {
    icon: Flag,
    title: "Comunidad cuidada por moderación",
    text: "Cualquier persona puede reportar publicaciones falsas, spam o estafas. Un equipo de moderación revisa cada reporte.",
  },
  {
    icon: CheckCircle,
    title: "Los finales felices se celebran",
    text: "Cuando una mascota vuelve a casa, el caso se marca como resuelto y queda en el historial como una historia de esperanza para la comunidad.",
  },
];

export default function ComoFunciona() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display font-extrabold text-3xl md:text-4xl">Cómo funciona Patitas</h1>
      <p className="text-muted-foreground font-semibold mt-3 text-lg">
        Patitas es el lugar donde buscas cuando una mascota desaparece. Centralizamos
        los casos de mascotas perdidas, encontradas, abandonadas y en adopción para que
        ninguna publicación se pierda.
      </p>
      <div className="mt-10 space-y-6">
        {SECTIONS.map((s, i) => (
          <div key={s.title} className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-secondary grid place-items-center text-secondary-foreground">
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">
                <span className="text-primary mr-1">{i + 1}.</span> {s.title}
              </h2>
              <p className="text-muted-foreground mt-1 leading-relaxed">{s.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 rounded-3xl bg-primary text-primary-foreground p-8 text-center">
        <h2 className="font-display font-extrabold text-2xl">Ayudemos a que vuelvan a casa.</h2>
        <Button asChild size="lg" variant="secondary" className="rounded-full font-bold mt-5 bg-card text-foreground hover:bg-card/90">
          <Link to="/publicar">Publicar un caso</Link>
        </Button>
      </div>
    </div>
  );
}
