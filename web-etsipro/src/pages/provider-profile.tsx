import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  Briefcase,
  ChevronRight,
  Clock,
  Facebook,
  Globe2,
  Instagram,
  Languages,
  Linkedin,
  MapPin,
  MessageSquare,
  Play,
  Star,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ServiceCard } from "@/components/service-card";
import { SmartImage } from "@/components/smart-image";
import { useData } from "@/lib/store";
import { categoryById } from "@/lib/seed";
import { initials } from "@/lib/format";

const socialIcons = [
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "facebook", icon: Facebook, label: "Facebook" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
  { key: "website", icon: Globe2, label: "Verkkosivut" },
] as const;

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, sessionUser, findOrCreateDirectThread } = useData();
  const [lightbox, setLightbox] = useState<number | null>(null);

  const provider = db.providers.find((p) => p.id === id);

  if (!provider) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Profiilia ei löytynyt</h1>
        <Button className="rounded-xl" asChild>
          <Link to="/selaa">Selaa palveluita</Link>
        </Button>
      </div>
    );
  }

  const services = db.services.filter((s) => s.providerId === provider.id);
  const isOwn = sessionUser?.providerId === provider.id;
  const socials = socialIcons.filter((s) => provider.social[s.key]);

  const contactProvider = () => {
    const threadId = findOrCreateDirectThread(provider);
    if (threadId) navigate(`/viestit?t=${threadId}`);
    else navigate("/kirjaudu", { state: { from: `/tarjoaja/${provider.id}` } });
  };

  const toYoutubeEmbed = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };
  const embed = toYoutubeEmbed(provider.videoUrl);

  return (
    <div>
      {/* Banneri */}
      <div className="relative h-52 w-full overflow-hidden sm:h-64 lg:h-72">
        {provider.bannerUrl ? (
          <img src={provider.bannerUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-brand-100 via-brand-50 to-white" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Otsikkoalue */}
        <div className="relative -mt-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="size-24 rounded-2xl border-4 border-white shadow-card-lg sm:size-28">
              <AvatarImage src={provider.avatarUrl} />
              <AvatarFallback className="rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
                {initials(provider.name)}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{provider.name}</h1>
                {provider.isCompany && (
                  <Badge variant="secondary" className="rounded-full">Yritys</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">{provider.tagline}</p>
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            {!isOwn && (
              <Button className="rounded-xl shadow-cta" onClick={contactProvider}>
                <MessageSquare className="size-4" /> Lähetä viesti
              </Button>
            )}
            {isOwn && (
              <Button className="rounded-xl" asChild>
                <Link to="/ohjaamo">Muokkaa profiilia</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Metatiedot */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            <MapPin className="size-3.5 text-primary" /> {provider.city}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            <Languages className="size-3.5 text-primary" /> {provider.languages.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            <Briefcase className="size-3.5 text-primary" /> {provider.experienceYears} v kokemusta
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {provider.rating.toLocaleString("fi-FI", { minimumFractionDigits: 1 })} ({provider.reviewCount} arvostelua)
          </span>
          {socials.map((s) => (
            <a
              key={s.key}
              href={s.key === "website" ? provider.social[s.key] : `https://${s.key}.com/${provider.social[s.key]}`}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              <s.icon className="size-4" />
            </a>
          ))}
        </div>

        {/* Sisältö */}
        <div className="mt-8 grid gap-8 pb-20 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0 space-y-10">
            {/* Esittely */}
            <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8">
              <h2 className="font-display text-xl font-semibold tracking-tight">Esittely</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/85">
                {provider.bio.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            {/* Palvelut – heti esittelytekstin alapuolelle */}
            {services.length > 0 && (
              <section id="palvelut">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    Palvelut <span className="text-muted-foreground">({services.length})</span>
                  </h2>
                </div>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {services.map((s) => (
                    <ServiceCard key={s.id} service={s} />
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio */}
            {provider.portfolioImages.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold tracking-tight">Portfolio</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {provider.portfolioImages.map((img, i) => (
                    <button
                      key={img + i}
                      type="button"
                      onClick={() => setLightbox(i)}
                      className="group relative overflow-hidden rounded-xl shadow-card transition-all hover:shadow-card-lg"
                    >
                      <SmartImage src={img} alt={`Portfoliokuva ${i + 1}`} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/25">
                        <span className="flex size-10 scale-75 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                          <Play className="ml-0.5 size-4" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Video */}
            <section>
              <h2 className="font-display text-xl font-semibold tracking-tight">Esittelyvideo</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-card">
                {embed ? (
                  <iframe
                    src={embed}
                    title={`${provider.name} esittelyvideo`}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Play className="size-8" strokeWidth={1.5} />
                    <p className="text-sm">Esittelyvideo tulossa pian</p>
                  </div>
                )}
              </div>
            </section>

            {/* Sertifikaatit */}
            {provider.certifications.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold tracking-tight">Sertifikaatit ja lisenssit</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {provider.certifications.map((c) => (
                    <div key={c} className="flex items-start gap-3 rounded-xl border border-border/70 bg-white p-4 shadow-card">
                      <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold">{c}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Varmennettu osaaminen</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* UKK */}
            {provider.faq.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold tracking-tight">Usein kysyttyä</h2>
                <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-border/70 bg-white px-6 shadow-card">
                  {provider.faq.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </div>

          {/* Sivupalkki */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-card-lg">
              <Avatar className="size-14 rounded-xl">
                <AvatarImage src={provider.avatarUrl} />
                <AvatarFallback className="rounded-xl bg-brand-100 font-bold text-brand-700">
                  {initials(provider.name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-3 font-semibold tracking-tight">{provider.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Liittynyt EtsiPROhon {provider.joinedYear}</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
                <Clock className="size-4" /> Vastaa tyypillisesti alle 24 tunnissa
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-2.5 text-muted-foreground">
                  <MapPin className="size-4 text-primary" /> {provider.city}
                </li>
                <li className="flex items-center gap-2.5 text-muted-foreground">
                  <Languages className="size-4 text-primary" /> {provider.languages.join(", ")}
                </li>
                <li className="flex items-center gap-2.5 text-muted-foreground">
                  <Briefcase className="size-4 text-primary" /> {provider.experienceYears} vuotta kokemusta
                </li>
                <li className="flex items-center gap-2.5 text-muted-foreground">
                  <Award className="size-4 text-primary" /> {provider.certifications.length} sertifikaattia
                </li>
              </ul>
              {!isOwn && (
                <Button className="mt-5 w-full rounded-xl shadow-cta" onClick={contactProvider}>
                  <MessageSquare className="size-4" /> Ota yhteyttä
                </Button>
              )}
            </div>

            {services.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-card">
                <h3 className="text-sm font-semibold">Palvelut ({services.length})</h3>
                <ul className="mt-3 space-y-1">
                  {services.map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/palvelu/${s.id}`}
                        className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <SmartImage
                            src={s.images[0] ?? categoryById(s.category)?.image}
                            alt=""
                            className="size-9 shrink-0 rounded-lg object-cover"
                          />
                          <span className="truncate font-medium group-hover:text-primary">{s.title}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Portfolio-lightbox */}
      <Dialog open={lightbox !== null} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Portfoliokuva</DialogTitle>
          {lightbox !== null && provider.portfolioImages[lightbox] && (
            <div className="relative">
              <img
                src={provider.portfolioImages[lightbox]}
                alt={`Portfoliokuva ${lightbox + 1}`}
                className="max-h-[80vh] w-full rounded-2xl object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 right-0 size-9 rounded-xl bg-white text-foreground shadow-card"
                onClick={() => setLightbox(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
