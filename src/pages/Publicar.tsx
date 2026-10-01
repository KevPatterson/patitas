import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Search, Heart, Eye, Home, AlertCircle, ArrowLeft, ArrowRight, Check,
  Upload, X, ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LocationPicker } from "@/components/MapView";
import { TypeBadge } from "@/components/PetCard";
import { PROVINCES, CUBA, SPECIES_LABELS, SEX_LABELS, AGE_LABELS, SIZE_LABELS, MAX_IMAGES } from "@contracts/patitas";
import { speciesLabel, sexLabel, ageLabel, sizeLabel, toBase64 } from "@/lib/patitas";

const TYPE_OPTIONS = [
  { value: "lost", icon: AlertCircle, title: "Mi mascota está perdida", desc: "Publica para que la comunidad te ayude a buscarla" },
  { value: "found", icon: Search, title: "Encontré una mascota", desc: "Ayuda a que vuelva con su familia" },
  { value: "abandoned", icon: Home, title: "Encontré una mascota abandonada", desc: "Reporta su situación y ubicación" },
  { value: "adoption", icon: Heart, title: "Mascota en adopción", desc: "Búscale un hogar responsable" },
  { value: "sighting", icon: Eye, title: "Vi una mascota", desc: "Un avistamiento puede ser la pista clave" },
] as const;

type Draft = {
  type: "lost" | "found" | "abandoned" | "adoption" | "sighting" | "";
  petName: string; species: string; breed: string; sex: string; age: string; size: string;
  color: string; features: string; hasCollar: boolean; hasTag: boolean; microchip: string;
  description: string;
  province: string; municipality: string; zone: string;
  lat: number | null; lng: number | null;
  eventDate: string; eventTime: string;
  reward: boolean; rewardDetails: string; needsVet: boolean; specialNeeds: string; instructions: string;
  contactPhone: string; contactWhatsapp: string; contactEmail: string;
  showPhone: boolean; showEmail: boolean; allowInternalContact: boolean;
};

const initialDraft: Draft = {
  type: "", petName: "", species: "", breed: "", sex: "unknown", age: "unknown", size: "unknown",
  color: "", features: "", hasCollar: false, hasTag: false, microchip: "", description: "",
  province: "", municipality: "", zone: "", lat: null, lng: null,
  eventDate: "", eventTime: "",
  reward: false, rewardDetails: "", needsVet: false, specialNeeds: "", instructions: "",
  contactPhone: "", contactWhatsapp: "", contactEmail: "",
  showPhone: false, showEmail: false, allowInternalContact: true,
};

const STEPS = ["Tipo", "Información", "Ubicación", "Fecha", "Fotos", "Contacto", "Adicional", "Vista previa"];

export default function Publicar() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [images, setImages] = useState<{ key: string; preview: string; uploading: boolean }[]>([]);
  const [publishing, setPublishing] = useState(false);

  const uploadImage = trpc.publications.uploadImage.useMutation();
  const create = trpc.publications.create.useMutation();

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  if (isLoading) return <div className="max-w-xl mx-auto px-4 py-20 text-center text-muted-foreground font-semibold">Cargando…</div>;
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-extrabold text-3xl">Inicia sesión para publicar</h1>
        <p className="text-muted-foreground font-semibold mt-3">
          Necesitas una cuenta para publicar un caso y recibir notificaciones cuando alguien responda.
        </p>
        <Button asChild className="rounded-full font-bold mt-6" size="lg">
          <Link to="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  const canNext = () => {
    if (step === 0) return draft.type !== "";
    if (step === 1) return draft.species !== "" && draft.description.trim().length >= 10;
    if (step === 2) return draft.province !== "";
    return true;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { toast.error(`Máximo ${MAX_IMAGES} fotos`); return; }
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`${file.name}: formato no permitido (JPG, PNG o WebP)`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name}: supera los 8 MB`);
        continue;
      }
      const preview = URL.createObjectURL(file);
      setImages((imgs) => [...imgs, { key: "", preview, uploading: true }]);
      try {
        const { key } = await uploadImage.mutateAsync({
          name: file.name,
          contentBase64: await toBase64(file),
          contentType: file.type,
        });
        setImages((imgs) => imgs.map((i) => (i.preview === preview ? { ...i, key, uploading: false } : i)));
      } catch {
        setImages((imgs) => imgs.filter((i) => i.preview !== preview));
        toast.error(`No pudimos subir ${file.name}. Inténtalo de nuevo.`);
      }
    }
  };

  const publish = async () => {
    if (images.some((i) => i.uploading)) { toast.error("Espera a que terminen de subir las fotos"); return; }
    setPublishing(true);
    try {
      const { slug } = await create.mutateAsync({
        type: draft.type as never,
        petName: draft.petName,
        species: draft.species as never,
        breed: draft.breed,
        sex: draft.sex as never,
        age: draft.age as never,
        size: draft.size as never,
        color: draft.color,
        features: draft.features,
        hasCollar: draft.hasCollar,
        hasTag: draft.hasTag,
        microchip: draft.microchip,
        description: draft.description,
        province: draft.province,
        municipality: draft.municipality,
        zone: draft.zone,
        approxLat: draft.lat ?? undefined,
        approxLng: draft.lng ?? undefined,
        eventDate: draft.eventDate ? new Date(draft.eventDate) : undefined,
        eventTime: draft.eventTime,
        reward: draft.reward,
        rewardDetails: draft.rewardDetails,
        needsVet: draft.needsVet,
        specialNeeds: draft.specialNeeds,
        instructions: draft.instructions,
        contactPhone: draft.contactPhone,
        contactWhatsapp: draft.contactWhatsapp,
        contactEmail: draft.contactEmail,
        showPhone: draft.showPhone,
        showEmail: draft.showEmail,
        allowInternalContact: draft.allowInternalContact,
        imageKeys: images.filter((i) => i.key).map((i) => i.key),
      });
      toast.success("¡Publicación creada! Gracias por ayudar.");
      navigate(`/p/${slug}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos publicar. Inténtalo de nuevo.");
    } finally {
      setPublishing(false);
    }
  };

  const municipalities = draft.province ? CUBA[draft.province] ?? [] : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display font-extrabold text-3xl">Publicar un caso</h1>

      {/* Progreso */}
      <div className="flex gap-1.5 mt-5" aria-label={`Paso ${step + 1} de ${STEPS.length}: ${STEPS[step]}`}>
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-sm font-bold text-muted-foreground mt-2">Paso {step + 1} de {STEPS.length} — {STEPS[step]}</p>

      <div className="mt-6">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-display font-bold text-xl">¿Qué quieres publicar?</h2>
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => set("type", t.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-colors min-h-11 ${
                  draft.type === t.value ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"
                }`}
                aria-pressed={draft.type === t.value}
              >
                <span className="grid place-items-center w-12 h-12 rounded-full bg-secondary text-secondary-foreground shrink-0">
                  <t.icon className="w-6 h-6" />
                </span>
                <span>
                  <span className="font-display font-bold block">{t.title}</span>
                  <span className="text-sm text-muted-foreground">{t.desc}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl">Información de la mascota</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="petName">Nombre (si lo sabes)</Label>
                <Input id="petName" value={draft.petName} onChange={(e) => set("petName", e.target.value)} placeholder="Toby" className="rounded-2xl h-12 bg-card" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Especie *</Label>
                <Select value={draft.species} onValueChange={(v) => set("species", v)}>
                  <SelectTrigger className="rounded-2xl h-12 bg-card" aria-label="Especie"><SelectValue placeholder="Elige…" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPECIES_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="breed">Raza</Label>
                <Input id="breed" value={draft.breed} onChange={(e) => set("breed", e.target.value)} className="rounded-2xl h-12 bg-card" />
              </div>
              <div>
                <Label>Sexo</Label>
                <Select value={draft.sex} onValueChange={(v) => set("sex", v)}>
                  <SelectTrigger className="rounded-2xl h-12 bg-card" aria-label="Sexo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEX_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Edad aproximada</Label>
                <Select value={draft.age} onValueChange={(v) => set("age", v)}>
                  <SelectTrigger className="rounded-2xl h-12 bg-card" aria-label="Edad"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tamaño</Label>
                <Select value={draft.size} onValueChange={(v) => set("size", v)}>
                  <SelectTrigger className="rounded-2xl h-12 bg-card" aria-label="Tamaño"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SIZE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" value={draft.color} onChange={(e) => set("color", e.target.value)} placeholder="Caramelo con blanco" className="rounded-2xl h-12 bg-card" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="features">Características especiales</Label>
                <Input id="features" value={draft.features} onChange={(e) => set("features", e.target.value)} placeholder="Mancha en la oreja izquierda, cojera…" className="rounded-2xl h-12 bg-card" />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 bg-card border border-border rounded-3xl p-4">
              <label className="flex items-center gap-2 font-semibold"><Switch checked={draft.hasCollar} onCheckedChange={(v) => set("hasCollar", v)} /> Tiene collar</label>
              <label className="flex items-center gap-2 font-semibold"><Switch checked={draft.hasTag} onCheckedChange={(v) => set("hasTag", v)} /> Tiene placa</label>
            </div>
            <div>
              <Label htmlFor="microchip">Microchip (no se mostrará públicamente)</Label>
              <Input id="microchip" value={draft.microchip} onChange={(e) => set("microchip", e.target.value)} className="rounded-2xl h-12 bg-card" />
            </div>
            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Cuenta lo más importante: cómo es, cuándo y dónde lo viste por última vez…"
                className="rounded-2xl bg-card min-h-32"
              />
              {draft.description.trim().length > 0 && draft.description.trim().length < 10 && (
                <p className="text-sm text-destructive font-semibold mt-1">Escribe al menos 10 caracteres.</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl">¿Dónde ocurrió?</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label>Provincia *</Label>
                <Select value={draft.province} onValueChange={(v) => { set("province", v); set("municipality", ""); }}>
                  <SelectTrigger className="rounded-2xl h-12 bg-card" aria-label="Provincia"><SelectValue placeholder="Elige…" /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Municipio</Label>
                <Select value={draft.municipality} onValueChange={(v) => set("municipality", v)} disabled={municipalities.length === 0}>
                  <SelectTrigger className="rounded-2xl h-12 bg-card" aria-label="Municipio"><SelectValue placeholder="Elige…" /></SelectTrigger>
                  <SelectContent>
                    {municipalities.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="zone">Zona o reparto</Label>
                <Input id="zone" value={draft.zone} onChange={(e) => set("zone", e.target.value)} placeholder="Cerca del parque, calle principal…" className="rounded-2xl h-12 bg-card" />
              </div>
            </div>
            <div>
              <Label>Ubicación aproximada en el mapa (toca para marcar)</Label>
              <LocationPicker value={draft.lat != null && draft.lng != null ? { lat: draft.lat, lng: draft.lng } : null} onChange={(v) => { set("lat", v.lat); set("lng", v.lng); }} />
              <p className="text-sm text-muted-foreground font-semibold mt-2">
                Por tu privacidad, nunca mostramos la ubicación exacta: la difuminamos automáticamente.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl">¿Cuándo ocurrió?</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="eventDate">Fecha del evento</Label>
                <Input id="eventDate" type="date" value={draft.eventDate} onChange={(e) => set("eventDate", e.target.value)} className="rounded-2xl h-12 bg-card" max={new Date().toISOString().slice(0, 10)} />
              </div>
              <div>
                <Label htmlFor="eventTime">Hora aproximada</Label>
                <Input id="eventTime" type="time" value={draft.eventTime} onChange={(e) => set("eventTime", e.target.value)} className="rounded-2xl h-12 bg-card" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl">Fotografías</h2>
            <p className="text-sm text-muted-foreground font-semibold">
              Hasta {MAX_IMAGES} fotos (JPG, PNG o WebP, máximo 8 MB cada una). Las fotos claras ayudan muchísimo.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.preview} className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
                  <img src={img.preview} alt="Foto subida" className="w-full h-full object-cover" />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-background/60 grid place-items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={() => setImages((imgs) => imgs.filter((i) => i.preview !== img.preview))}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-foreground/70 text-background grid place-items-center"
                    aria-label="Quitar foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-border bg-card grid place-items-center cursor-pointer hover:bg-muted transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
                  <span className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImagePlus className="w-7 h-7" />
                    <span className="text-xs font-bold">Agregar</span>
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl">¿Cómo pueden contactarte?</h2>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="wa">WhatsApp</Label>
                <Input id="wa" value={draft.contactWhatsapp} onChange={(e) => set("contactWhatsapp", e.target.value)} placeholder="+53 5 123 4567" className="rounded-2xl h-12 bg-card" inputMode="tel" />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={draft.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className="rounded-2xl h-12 bg-card" inputMode="tel" />
              </div>
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" value={draft.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="rounded-2xl h-12 bg-card" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-4 space-y-3">
              <label className="flex items-center justify-between gap-3 font-semibold">
                Mostrar mi teléfono / WhatsApp públicamente
                <Switch checked={draft.showPhone} onCheckedChange={(v) => set("showPhone", v)} />
              </label>
              <label className="flex items-center justify-between gap-3 font-semibold">
                Mostrar mi correo públicamente
                <Switch checked={draft.showEmail} onCheckedChange={(v) => set("showEmail", v)} />
              </label>
              <label className="flex items-center justify-between gap-3 font-semibold">
                Permitir contacto mediante Patitas (recomendado)
                <Switch checked={draft.allowInternalContact} onCheckedChange={(v) => set("allowInternalContact", v)} />
              </label>
            </div>
            <p className="text-sm text-muted-foreground font-semibold">
              Tú decides qué datos son visibles. El contacto mediante Patitas protege tu información personal.
            </p>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl">Información adicional (opcional)</h2>
            <label className="flex items-center gap-2 font-semibold bg-card border border-border rounded-3xl p-4">
              <Switch checked={draft.reward} onCheckedChange={(v) => set("reward", v)} /> Ofrezco recompensa
            </label>
            {draft.reward && (
              <div>
                <Label htmlFor="rewardDetails">Detalles de la recompensa</Label>
                <Input id="rewardDetails" value={draft.rewardDetails} onChange={(e) => set("rewardDetails", e.target.value)} className="rounded-2xl h-12 bg-card" />
              </div>
            )}
            {(draft.type === "abandoned" || draft.type === "found" || draft.type === "adoption") && (
              <label className="flex items-center gap-2 font-semibold bg-card border border-border rounded-3xl p-4">
                <Switch checked={draft.needsVet} onCheckedChange={(v) => set("needsVet", v)} /> Parece necesitar atención veterinaria
              </label>
            )}
            <div>
              <Label htmlFor="specialNeeds">Necesidades especiales o medicamentos</Label>
              <Textarea id="specialNeeds" value={draft.specialNeeds} onChange={(e) => set("specialNeeds", e.target.value)} className="rounded-2xl bg-card" />
            </div>
            <div>
              <Label htmlFor="instructions">Instrucciones para quien la encuentre</Label>
              <Textarea id="instructions" value={draft.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="Es asustadiza, no la persigas, llámala por su nombre…" className="rounded-2xl bg-card" />
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl">Así verá tu publicación la comunidad</h2>
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="aspect-video bg-muted">
                {images[0] ? (
                  <img src={images[0].preview} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground"><Upload className="w-10 h-10 opacity-40" /></div>
                )}
              </div>
              <div className="p-5">
                <TypeBadge type={draft.type} />
                <h3 className="font-display font-bold text-2xl mt-2">{draft.petName || "Sin nombre"}</h3>
                <p className="font-semibold text-muted-foreground mt-1">
                  {speciesLabel(draft.species)} · {sexLabel(draft.sex)} · {ageLabel(draft.age)} · {sizeLabel(draft.size)}
                  {draft.color && ` · ${draft.color}`}
                </p>
                <p className="font-semibold text-muted-foreground mt-1">
                  📍 {[draft.zone, draft.municipality, draft.province].filter(Boolean).join(", ")}
                </p>
                <p className="mt-3 whitespace-pre-wrap">{draft.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegación del wizard */}
      <div className="flex justify-between gap-3 mt-8">
        {step > 0 ? (
          <Button variant="outline" size="lg" className="rounded-full font-bold bg-card" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="w-4 h-4" /> {step === 7 ? "Editar" : "Atrás"}
          </Button>
        ) : <span />}
        {step < 7 ? (
          <Button size="lg" className="rounded-full font-bold" disabled={!canNext()} onClick={() => setStep(step + 1)}>
            Continuar <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="lg" className="rounded-full font-bold" disabled={publishing} onClick={publish}>
            <Check className="w-4 h-4" /> {publishing ? "Publicando…" : "Publicar"}
          </Button>
        )}
      </div>
    </div>
  );
}
