import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CalendarCheck2,
  ChevronRight,
  Clock,
  Globe2,
  Handshake,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingDialog } from "@/components/booking-dialog";
import { DeliveryBadge, PaymentModeBadges, ServiceCard } from "@/components/service-card";
import { SmartImage } from "@/components/smart-image";
import { useData } from "@/lib/store";
import { categoryById, PRICING_LABEL } from "@/lib/seed";
import { initials, priceWithModel } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, sessionUser, findOrCreateDirectThread } = useData();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);

  const service = db.services.find((s) => s.id === id);
  const provider = service ? db.providers.find((p) => p.id === service.providerId) : undefined;

  if (!service || !provider) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Palvelua ei löytynyt</h1>
        <Button className="rounded-xl" asChild>
          <Link to="/selaa">Selaa palveluita</Link>
        </Button>
      </div>
    );
  }

  const cat = categoryById(service.category);
  const isOwn = sessionUser?.providerId === provider.id;
  const images = service.images.length > 0 ? service.images : cat ? [cat.image] : [];
  const similar = db.services
    .filter((s) => s.id !== service.id && (s.category === service.category || s.providerId === provider.id))
    .slice(0, 3);

  const contactProvider = () => {
    const threadId = findOrCreateDirectThread(provider);
    if (threadId) navigate(`/viestit?t=${threadId}`);
    else navigate("/kirjaudu", { state: { from: `/palvelu/${service.id}` } });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/selaa" className="transition-colors hover:text-foreground">
          Palvelut
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to={`/selaa?cat=${service.category}`} className="transition-colors hover:text-foreground">
          {cat?.label}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate font-medium text-foreground">{service.title}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Vasen: kuvat + kuvaus */}
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-2xl shadow-card">
            <SmartImage src={images[imageIdx]} alt={service.title} className="aspect-[16/10] w-full object-cover" />
            <DeliveryBadge service={service} className="absolute left-4 top-4" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setImageIdx(i)}
                  className={cn(
                    "relative w-24 overflow-hidden rounded-xl border-2 transition-all",
                    imageIdx === i ? "border-primary shadow-sm" : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <SmartImage src={img} alt={`${service.title} kuva ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{service.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {service.rating.toLocaleString("fi-FI", { minimumFractionDigits: 1 })}
                <span className="font-normal text-muted-foreground">({service.reviewCount} arvostelua)</span>
              </span>
              <Badge variant="secondary" className="rounded-full">{cat?.label}</Badge>
              <Badge variant="secondary" className="rounded-full">{PRICING_LABEL[service.pricing]}</Badge>
            </div>
            <Separator className="my-6" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Palvelun kuvaus</h2>
            <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-foreground/85">
              {service.description.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {service.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {service.tags.map((t) => (
                  <Badge key={t} variant="outline" className="rounded-full font-medium">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {similar.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-xl font-semibold tracking-tight">Saatat pitää myös näistä</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Oikea: varauskortti */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-card-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {service.delivery === "etana" ? (
                <>
                  <Globe2 className="size-4 text-primary" /> Etätyö – saatavilla kaikkialla
                </>
              ) : (
                <>
                  <MapPin className="size-4 text-primary" /> {service.city}
                  {service.radiusKm ? `, palvelualue ${service.radiusKm} km` : ""}
                </>
              )}
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">{priceWithModel(service)}</p>
            {service.pricing === "tunti" && (
              <p className="mt-1 text-xs text-muted-foreground">Laskutus toteutuneen työajan mukaan.</p>
            )}

            <PaymentModeBadges modes={service.paymentModes} className="mt-4" />

            <div className="mt-5 space-y-2">
              {isOwn ? (
                <Button className="w-full rounded-xl" asChild>
                  <Link to="/ohjaamo">Muokkaa palvelua hallintapaneelissa</Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full rounded-xl shadow-cta" onClick={() => setBookingOpen(true)}>
                  Varaa nyt
                </Button>
              )}
              {!isOwn && (
                <Button variant="outline" className="w-full rounded-xl" onClick={contactProvider}>
                  <MessageSquare className="size-4" /> Lähetä viesti toimittajalle
                </Button>
              )}
            </div>

            <div className="mt-5 space-y-2.5 rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                {service.paymentModes.includes("alusta")
                  ? "Alustan kautta maksaessasi rahat siirtyvät toimittajalle vasta, kun työ on sovittu."
                  : "Maksusta sovitaan suoraan toimittajan kanssa."}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" /> Toimittaja vastaa tyypillisesti vuorokauden sisällä.
              </p>
            </div>
          </div>

          {/* Toimittajakortti */}
          <Link
            to={`/tarjoaja/${provider.id}`}
            className="group mt-4 flex items-center gap-3.5 rounded-2xl border border-border/70 bg-white p-5 shadow-card transition-all hover:shadow-card-lg"
          >
            <Avatar className="size-12 rounded-xl">
              <AvatarImage src={provider.avatarUrl} />
              <AvatarFallback className="rounded-xl bg-brand-100 font-bold text-brand-700">
                {initials(provider.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold tracking-tight group-hover:text-primary">{provider.name}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {provider.rating.toLocaleString("fi-FI", { minimumFractionDigits: 1 })}
                </span>
                · {provider.reviewCount} arvostelua · {provider.city}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{provider.tagline}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Näin varaat */}
          <div className="mt-4 rounded-2xl border border-border/70 bg-white p-5 shadow-card">
            <h3 className="text-sm font-semibold tracking-tight">Näin varaus etenee</h3>
            <ol className="mt-3 space-y-3">
              {[
                { icon: CalendarCheck2, text: "Valitset toivotun ajankohdan ja maksutavan." },
                { icon: service.paymentModes.includes("alusta") ? ShieldCheck : Handshake, text: service.paymentModes.includes("alusta") ? "Maksat turvallisesti kortilla alustan kautta." : "Sovitte yksityiskohdat viestiketjussa." },
                { icon: BadgeCheck, text: "Työ tehdään ja homma hoituu." },
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    <s.icon className="size-4" />
                  </span>
                  <span className="pt-1">{s.text}</span>
                </li>
              ))}
            </ol>
          </div>

          {provider.certifications.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border/70 bg-white p-5 shadow-card">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <Award className="size-4 text-primary" /> Sertifikaatit ja lisenssit
              </h3>
              <ul className="mt-3 space-y-2">
                {provider.certifications.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button variant="ghost" className="mt-3 rounded-xl" asChild>
            <Link to="/selaa">
              <ArrowLeft className="size-4" /> Takaisin hakuun
            </Link>
          </Button>
        </div>
      </div>

      <BookingDialog service={service} open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
}
