import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  MapPin, Clock, Share2, Flag, Phone, Mail, MessageCircle, Check,
  ChevronLeft, ChevronRight, PartyPopper, Eye, Send, Copy, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { TypeBadge } from "@/components/PetCard";
import { MapView } from "@/components/MapView";
import {
  timeAgo, fmtDate, locationLabel, speciesLabel, sexLabel, ageLabel, sizeLabel,
  shareUrl, shareLinks, typeLabel,
} from "@/lib/patitas";
import { REASON_LABELS } from "@contracts/patitas";

export default function PublicacionDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const pub = trpc.publications.bySlug.useQuery({ slug: slug! }, { retry: false });
  const comments = trpc.comments.list.useQuery({ slug: slug! }, { enabled: !!pub.data });
  const sightings = trpc.sightings.list.useQuery({ slug: slug! }, { enabled: !!pub.data });

  const [imgIdx, setImgIdx] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [story, setStory] = useState("");

  const report = trpc.reports.create.useMutation();
  const resolve = trpc.publications.resolve.useMutation();
  const remove = trpc.publications.remove.useMutation();
  const addComment = trpc.comments.create.useMutation();
  const adoptionRequest = trpc.adoptions.request.useMutation();

  const p = pub.data;
  useEffect(() => {
    if (p) {
      document.title = `Patitas | ${p.petName ?? typeLabel(p.type)} ${typeLabel(p.type).toLowerCase()} en ${p.municipality ?? p.province}`;
    }
    return () => { document.title = "Patitas — Ayudemos a que vuelvan a casa"; };
  }, [p]);

  if (pub.isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-10"><div className="aspect-video rounded-3xl bg-muted animate-pulse" /></div>;
  }
  if (!p) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-extrabold text-3xl">Publicación no encontrada</h1>
        <p className="text-muted-foreground font-semibold mt-3">Puede haber sido eliminada u ocultada por moderación.</p>
        <Button asChild className="rounded-full font-bold mt-6"><Link to="/buscar">Volver a buscar</Link></Button>
      </div>
    );
  }

  const isOwner = p.isOwner === true;
  const resolved = p.status === "resolved";
  const links = shareLinks(p.slug, `${p.petName ?? "Esta mascota"} — ${typeLabel(p.type)} en ${locationLabel(p)}`);

  const waDigits = (p.contactWhatsapp ?? p.contactPhone ?? "").replace(/[^0-9]/g, "");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {resolved && (
        <div className="mb-6 rounded-3xl bg-secondary text-secondary-foreground p-6 text-center">
          <PartyPopper className="w-8 h-8 mx-auto" />
          <h2 className="font-display font-extrabold text-2xl mt-2">
            ¡{p.petName ?? "Esta mascota"} está de vuelta en casa!
          </h2>
          <p className="font-semibold mt-1">Gracias a todas las personas que ayudaron a compartir y difundir este caso.</p>
          {p.resolvedStory && <p className="mt-3 italic">“{p.resolvedStory}”</p>}
        </div>
      )}

      {/* Galería */}
      <div className="relative rounded-3xl overflow-hidden bg-muted border border-border aspect-[4/3] md:aspect-video">
        {p.images.length > 0 ? (
          <>
            <img src={p.images[imgIdx].url} alt={p.petName ?? "Mascota"} className="w-full h-full object-cover" />
            {p.images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((imgIdx - 1 + p.images.length) % p.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/80 grid place-items-center"
                  aria-label="Foto anterior"
                ><ChevronLeft className="w-5 h-5" /></button>
                <button
                  onClick={() => setImgIdx((imgIdx + 1) % p.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/80 grid place-items-center"
                  aria-label="Foto siguiente"
                ><ChevronRight className="w-5 h-5" /></button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {p.images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)} aria-label={`Foto ${i + 1}`}
                      className={`w-2.5 h-2.5 rounded-full ${i === imgIdx ? "bg-white" : "bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground font-semibold">Sin fotos</div>
        )}
        <div className="absolute top-4 left-4"><TypeBadge type={p.type} resolved={resolved} /></div>
        {p.reward && !resolved && (
          <span className="absolute top-4 right-4 bg-amber-400 text-amber-950 text-sm font-extrabold px-4 py-1.5 rounded-full">
            Se ofrece recompensa
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6 mt-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl">
            {p.petName || (p.type === "found" ? "Mascota encontrada" : "Sin nombre")}
          </h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground font-semibold mt-2">
            <span>{speciesLabel(p.species)}{p.breed && ` · ${p.breed}`}</span>
            <span>{sexLabel(p.sex)}</span>
            <span>{ageLabel(p.age)}</span>
            <span>{sizeLabel(p.size)}</span>
            {p.color && <span>{p.color}</span>}
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground font-semibold mt-2">
            <MapPin className="w-4 h-4" /> {locationLabel(p)} <span className="text-xs">(ubicación aproximada)</span>
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Clock className="w-4 h-4" /> Publicado {timeAgo(p.createdAt)}
            {p.eventDate && ` · Ocurrió el ${fmtDate(p.eventDate)}${p.eventTime ? ` a las ${p.eventTime}` : ""}`}
          </p>

          <div className="mt-6">
            <h2 className="font-display font-bold text-xl">Descripción</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{p.description}</p>
          </div>

          {(p.features || p.hasCollar || p.hasTag) && (
            <div className="mt-4 bg-card border border-border rounded-3xl p-4 space-y-1 font-semibold">
              {p.features && <p>Características: {p.features}</p>}
              {p.hasCollar && <p>✓ Lleva collar{p.hasTag ? " con placa identificativa" : ""}</p>}
            </div>
          )}
          {p.needsVet && (
            <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-4 font-semibold">
              Parece necesitar atención veterinaria. Esto no es un diagnóstico médico.
            </div>
          )}
          {p.specialNeeds && (
            <div className="mt-4 bg-card border border-border rounded-3xl p-4">
              <h3 className="font-display font-bold">Necesidades especiales</h3>
              <p className="mt-1 whitespace-pre-wrap">{p.specialNeeds}</p>
            </div>
          )}
          {p.instructions && (
            <div className="mt-4 bg-card border border-border rounded-3xl p-4">
              <h3 className="font-display font-bold">Instrucciones</h3>
              <p className="mt-1 whitespace-pre-wrap">{p.instructions}</p>
            </div>
          )}

          {/* Avistamientos */}
          {p.type === "lost" && (sightings.data?.length ?? 0) > 0 && (
            <div className="mt-6">
              <h2 className="font-display font-bold text-xl flex items-center gap-2"><Eye className="w-5 h-5" /> Avistamientos</h2>
              <ol className="mt-3 border-l-2 border-border pl-5 space-y-4">
                {sightings.data!.map((s) => (
                  <li key={s.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <p className="text-sm font-bold text-muted-foreground">
                      {fmtDate(s.seenAt)} · {[s.zone, s.municipality, s.province].filter(Boolean).join(", ") || "Zona no especificada"}
                    </p>
                    {s.note && <p className="mt-1">{s.note}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Contacto interno / comentarios */}
          {p.allowInternalContact && !resolved && (
            <div className="mt-8">
              <h2 className="font-display font-bold text-xl">Contacto mediante Patitas</h2>
              <p className="text-sm text-muted-foreground font-semibold mt-1">
                Los mensajes son visibles para la comunidad. No compartas datos personales sensibles.
              </p>
              {isAuthenticated ? (
                <form
                  className="flex gap-2 mt-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (commentText.trim().length < 2) return;
                    try {
                      await addComment.mutateAsync({ slug: p.slug, body: commentText.trim() });
                      setCommentText("");
                      utils.comments.list.invalidate({ slug: p.slug });
                    } catch {
                      toast.error("No pudimos enviar tu mensaje.");
                    }
                  }}
                >
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe un mensaje…"
                    className="rounded-full h-12 bg-card"
                    aria-label="Mensaje"
                  />
                  <Button type="submit" size="lg" className="rounded-full h-12 px-5" disabled={addComment.isPending} aria-label="Enviar">
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              ) : (
                <Button asChild variant="outline" className="rounded-full font-bold mt-3 bg-card">
                  <Link to="/login">Inicia sesión para responder</Link>
                </Button>
              )}
              <ul className="mt-4 space-y-3">
                {comments.data?.map((c) => (
                  <li key={c.id} className="bg-card border border-border rounded-3xl p-4">
                    <p className="text-sm font-bold">{c.authorName ?? "Usuario"} <span className="font-semibold text-muted-foreground">· {timeAgo(c.createdAt)}</span></p>
                    <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <aside className="space-y-3 md:sticky md:top-24 self-start">
          <div className="bg-card border border-border rounded-3xl p-5">
            <p className="text-sm font-semibold text-muted-foreground">Publicado por</p>
            <p className="font-display font-bold text-lg">{p.ownerName ?? "Usuario de Patitas"}</p>
            {!resolved && (
              <div className="space-y-2 mt-4">
                {p.contactWhatsapp && waDigits && (
                  <Button asChild className="w-full rounded-full font-bold bg-[#25D366] hover:bg-[#1fb857] text-white">
                    <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                {p.contactPhone && (
                  <Button asChild variant="outline" className="w-full rounded-full font-bold bg-card">
                    <a href={`tel:${p.contactPhone}`}><Phone className="w-4 h-4" /> Llamar</a>
                  </Button>
                )}
                {p.contactEmail && (
                  <Button asChild variant="outline" className="w-full rounded-full font-bold bg-card">
                    <a href={`mailto:${p.contactEmail}`}><Mail className="w-4 h-4" /> Correo</a>
                  </Button>
                )}
                {p.type === "adoption" && isAuthenticated && (
                  <Button
                    className="w-full rounded-full font-bold"
                    disabled={adoptionRequest.isPending || adoptionRequest.isSuccess}
                    onClick={() =>
                      adoptionRequest.mutate({ slug: p.slug }, {
                        onSuccess: () => toast.success("Solicitud de adopción enviada"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    {adoptionRequest.isSuccess ? "Solicitud enviada ✓" : "Quiero adoptar"}
                  </Button>
                )}
                {!p.contactPhone && !p.contactWhatsapp && !p.contactEmail && (
                  <p className="text-sm text-muted-foreground font-semibold">
                    {p.allowInternalContact
                      ? "Contacta mediante los mensajes de Patitas (aquí abajo)."
                      : "El responsable no compartió datos de contacto públicos."}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
            <p className="font-display font-bold">Compartir</p>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-full font-bold bg-card"><a href={links.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>
              <Button asChild variant="outline" size="sm" className="rounded-full font-bold bg-card"><a href={links.telegram} target="_blank" rel="noopener noreferrer">Telegram</a></Button>
              <Button asChild variant="outline" size="sm" className="rounded-full font-bold bg-card"><a href={links.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></Button>
              <Button
                variant="outline" size="sm" className="rounded-full font-bold bg-card"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl(p.slug));
                  toast.success("Enlace copiado");
                }}
              ><Copy className="w-3.5 h-3.5" /> Copiar</Button>
            </div>
            {typeof navigator.share === "function" && (
              <Button
                variant="secondary" size="sm" className="w-full rounded-full font-bold"
                onClick={() => navigator.share({ title: document.title, url: shareUrl(p.slug) }).catch(() => {})}
              ><Share2 className="w-3.5 h-3.5" /> Compartir…</Button>
            )}
          </div>

          {p.approxLat != null && p.approxLng != null && (
            <MapView
              pubs={[{
                slug: p.slug, type: p.type, status: p.status, petName: p.petName, species: p.species,
                sex: p.sex, age: p.age, province: p.province, municipality: p.municipality, zone: p.zone,
                approxLat: p.approxLat, approxLng: p.approxLng, reward: p.reward,
                createdAt: p.createdAt, resolvedAt: p.resolvedAt, imageUrl: p.images[0]?.url ?? null,
              }]}
              height="220px"
            />
          )}

          {p.type === "lost" && !resolved && isAuthenticated && <SightingForm slug={p.slug} onSaved={() => utils.sightings.list.invalidate({ slug: p.slug })} />}

          {isOwner && !resolved && (
            <Button className="w-full rounded-full font-bold" variant="secondary" onClick={() => setResolveOpen(true)}>
              <Check className="w-4 h-4" /> Marcar como resuelto
            </Button>
          )}
          {isOwner && (
            <Button
              variant="ghost" className="w-full rounded-full font-bold text-destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (confirm("¿Eliminar esta publicación? No podrás deshacerlo.")) {
                  remove.mutate({ slug: p.slug }, {
                    onSuccess: () => { toast.success("Publicación eliminada"); window.location.href = "/dashboard/publicaciones"; },
                    onError: () => toast.error("No pudimos eliminarla."),
                  });
                }
              }}
            ><Trash2 className="w-4 h-4" /> Eliminar</Button>
          )}

          <Button variant="ghost" className="w-full rounded-full font-bold text-muted-foreground" onClick={() => setReportOpen(true)}>
            <Flag className="w-4 h-4" /> Reportar publicación
          </Button>
        </aside>
      </div>

      {/* Reportar */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Reportar publicación</DialogTitle>
            <DialogDescription>Cuéntanos qué ocurre. El equipo de moderación lo revisará.</DialogDescription>
          </DialogHeader>
          <ReportForm
            onSubmit={async (reason, description) => {
              try {
                await report.mutateAsync({ slug: p.slug, reason: reason as never, description });
                toast.success("Reporte enviado. Gracias por avisarnos.");
                setReportOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "No pudimos enviar el reporte.");
              }
            }}
            pending={report.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Resolver */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">🎉 ¡Qué alegría!</DialogTitle>
            <DialogDescription>Marca el caso como resuelto y, si quieres, cuenta cómo fue el reencuentro.</DialogDescription>
          </DialogHeader>
          <Label htmlFor="story">Historia de recuperación (opcional)</Label>
          <Textarea id="story" value={story} onChange={(e) => setStory(e.target.value)} placeholder="Apareció gracias a un vecino que vio la publicación…" />
          <Button
            className="rounded-full font-bold w-full"
            disabled={resolve.isPending}
            onClick={() =>
              resolve.mutate({ slug: p.slug, story: story || undefined }, {
                onSuccess: () => { setResolveOpen(false); utils.publications.bySlug.invalidate({ slug: p.slug }); toast.success("¡Caso resuelto! 🎉"); },
                onError: () => toast.error("No pudimos actualizar la publicación."),
              })
            }
          ><Check className="w-4 h-4" /> Confirmar: ¡está en casa!</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportForm({ onSubmit, pending }: { onSubmit: (reason: string, description: string) => void; pending: boolean }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {Object.entries(REASON_LABELS).map(([k, v]) => (
          <label key={k} className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer font-semibold ${reason === k ? "border-primary bg-primary/5" : "border-border"}`}>
            <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} className="accent-primary" />
            {v}
          </label>
        ))}
      </div>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles adicionales (opcional)" />
      <Button className="rounded-full font-bold w-full" disabled={!reason || pending} onClick={() => onSubmit(reason, description)}>
        Enviar reporte
      </Button>
    </div>
  );
}

function SightingForm({ slug, onSaved }: { slug: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [zone, setZone] = useState("");
  const add = trpc.sightings.create.useMutation();
  return (
    <>
      <Button variant="outline" className="w-full rounded-full font-bold bg-card" onClick={() => setOpen(true)}>
        <Eye className="w-4 h-4" /> Reportar avistamiento
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Reportar avistamiento</DialogTitle>
            <DialogDescription>Cada pista ayuda a seguir el rastro.</DialogDescription>
          </DialogHeader>
          <Label htmlFor="sightZone">¿Dónde lo viste?</Label>
          <Input id="sightZone" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zona, reparto, calle…" className="rounded-2xl h-12" />
          <Label htmlFor="sightNote">Detalles</Label>
          <Textarea id="sightNote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hora, dirección en la que iba, estado…" />
          <Button
            className="rounded-full font-bold w-full"
            disabled={add.isPending}
            onClick={() =>
              add.mutate({ slug, note: note || undefined, zone: zone || undefined }, {
                onSuccess: () => { setOpen(false); onSaved(); toast.success("Avistamiento reportado. ¡Gracias!"); },
                onError: () => toast.error("No pudimos guardar el avistamiento."),
              })
            }
          >Enviar avistamiento</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
