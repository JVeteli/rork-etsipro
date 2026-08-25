import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeEuro,
  CalendarCheck2,
  Check,
  Handshake,
  Search,
  Sparkles,
  Star,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/service-card";
import { SmartImage } from "@/components/smart-image";
import { useData } from "@/lib/store";
import { CATEGORIES } from "@/lib/seed";
import { ASSETS } from "@/lib/assets";

const benefits = [
  {
    n: "01",
    icon: Store,
    title: "Oma digitaalinen näyteikkuna",
    text: "Esittele työsi kuvilla, videolla ja omalla profiilisivulla – avoinna 24/7.",
  },
  {
    n: "02",
    icon: BadgeEuro,
    title: "Täysi vapaus päättää hinnat",
    text: "Tuntihinta, kiinteä pakettihinta tai tarjouspyyntö. Sinä päätät, mitä työstäsi veloitat.",
  },
  {
    n: "03",
    icon: Users,
    title: "Me tuomme asiakkaat",
    text: "Näkyvyyttä tuhansille palveluita etsiville – sinä keskityt itse tekemiseen.",
  },
];

const steps = [
  { icon: Search, title: "Selaa ja vertaile", text: "Löydä oikea osaaja kategorioista, arvosteluista ja hinnoista." },
  { icon: CalendarCheck2, title: "Varaa ja maksa", text: "Varaa verkossa ja maksa turvallisesti – tai sovi suoraan toimittajan kanssa." },
  { icon: Handshake, title: "Homma hoituu", text: "Sovitte yksityiskohdat viestiketjussa ja työ tulee tehdyksi." },
];

const stats = [
  { value: "1 200+", label: "Palvelua" },
  { value: "380", label: "Ammattilaista" },
  { value: "4,9 / 5", label: "Keskimääräinen arvio" },
  { value: "100 %", label: "Tuloista sinulle" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50/70 via-white to-white" />
      <div className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-brand-100/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
            <Sparkles className="size-3.5" /> Palvelutori suomalaisille ammattilaisille
          </span>
          <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[4.2rem]">
            Sinä teet työt.
            <br />
            <span className="text-primary">Me tuomme asiakkaat.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            EtsiPRO on ilmainen palvelukatalogi osaajille. Rakenna oma digitaalinen näyteikkunasi
            minuuteissa – me hoidamme näkyvyyden.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="h-12 rounded-xl px-7 text-base shadow-cta" asChild>
              <Link to="/liity">
                Luo ilmainen profiili <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-xl border-slate-200 px-7 text-base" asChild>
              <Link to="/selaa">Selaa palveluita</Link>
            </Button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <Check className="size-4" strokeWidth={3} /> Ei liittymismaksua. Pidä 100 % tuloistasi.
          </p>
          <p className="mt-6 font-display text-lg italic text-foreground/70">
            <span className="mr-1 text-2xl leading-none text-primary">”</span>Ja homma hoituu.
          </p>
        </div>

        <div className="relative animate-fade-up lg:pl-6" style={{ animationDelay: "120ms" }}>
          <div className="relative mx-auto max-w-md">
            <div className="overflow-hidden rounded-[2rem] shadow-card-lg">
              <SmartImage src={ASSETS.hero} alt="Ammattilainen työssään" className="aspect-[4/5] w-full object-cover" />
            </div>

            <div className="absolute -left-6 top-10 animate-float rounded-2xl border border-border/60 bg-white/95 p-3.5 shadow-card-lg backdrop-blur sm:-left-10">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Check className="size-5" strokeWidth={3} />
                </span>
                <div>
                  <p className="text-xs font-semibold">Uusi tilaus</p>
                  <p className="text-[11px] text-muted-foreground">Kylpyhuoneremontti · 4 900 €</p>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-6 -right-4 animate-float rounded-2xl border border-border/60 bg-white/95 p-3.5 shadow-card-lg backdrop-blur sm:-right-8"
              style={{ animationDelay: "1.4s" }}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-1.5 text-xs font-medium">”Loistavaa työtä – suosittelen!”</p>
              <p className="text-[11px] text-muted-foreground">Liisa · 2 viikkoa sitten</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-y border-border/60 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/60 px-4 sm:px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="px-2 py-6 text-center sm:py-7">
              <p className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="bg-muted/50 py-20 lg:py-24" id="toimittajille">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Toimittajille</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Miksi ammattilaiset valitsevat EtsiPROn?
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.n}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg"
            >
              <span className="absolute -right-3 -top-6 font-display text-[7rem] font-semibold leading-none text-muted/70 transition-colors group-hover:text-brand-100">
                {b.n}
              </span>
              <span className="relative flex size-12 items-center justify-center rounded-xl bg-primary text-white shadow-cta">
                <b.icon className="size-6" strokeWidth={1.8} />
              </span>
              <h3 className="relative mt-5 text-lg font-semibold tracking-tight">{b.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Selaa kategorioittain</h2>
            <p className="mt-2 text-muted-foreground">Löydä oikea osaaja jokaiseen tarpeeseen.</p>
          </div>
          <Button variant="ghost" className="hidden rounded-xl sm:inline-flex" asChild>
            <Link to="/selaa">
              Kaikki palvelut <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/selaa?cat=${c.id}`}
              className="group relative overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg"
            >
              <SmartImage src={c.image} alt={c.label} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-semibold tracking-tight text-white">{c.label}</p>
                <p className="text-[11px] text-white/70">{c.blurb}</p>
              </div>
            </Link>
          ))}
          <Link
            to="/liity"
            className="group flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/60 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-brand-50"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-cta">
              <ArrowRight className="size-5" />
            </span>
            <p className="text-sm font-semibold text-brand-700">Tarjoatko palveluita?</p>
            <p className="text-xs text-muted-foreground">Luo ilmainen profiili</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Featured() {
  const { db } = useData();
  const featured = [...db.services].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6);

  return (
    <section className="bg-muted/50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Suosituimmat juuri nyt</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Palvelut, joita asiakkaat varaavat
            </h2>
          </div>
          <Button variant="ghost" className="hidden rounded-xl sm:inline-flex" asChild>
            <Link to="/selaa">
              Selaa kaikkia <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Asiakkaille</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Näin se toimii</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border/70 bg-white p-7 shadow-card">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
                  <s.icon className="size-6" strokeWidth={1.8} />
                </span>
                <span className="font-display text-4xl font-semibold text-muted/80">{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:pb-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#10131A] px-6 py-16 text-center shadow-card-lg sm:px-12 lg:py-20">
        <div className="bg-dot-grid absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Aloita tänään. <span className="italic text-brand-500">Ja homma hoituu.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/60 sm:text-base">
            Luo ilmainen profiili minuutissa – ei liittymismaksua, pidät 100 % tuloistasi.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 rounded-xl bg-white px-7 text-base text-foreground hover:bg-white/90" asChild>
              <Link to="/liity">
                Luo ilmainen profiili <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-xl border-white/25 px-7 text-base text-white hover:bg-white/10 hover:text-white" asChild>
              <Link to="/selaa">Selaa palveluita</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Hero />
      <Benefits />
      <Categories />
      <Featured />
      <HowItWorks />
      <CtaBand />
    </>
  );
}
