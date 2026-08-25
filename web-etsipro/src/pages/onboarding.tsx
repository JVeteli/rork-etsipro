import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ImageIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartImage } from "@/components/smart-image";
import { useData } from "@/lib/store";
import { CATEGORIES, LANGUAGES } from "@/lib/seed";
import type { CategoryId, DeliveryMode, PaymentMode, PricingModel } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Tili", "Näyteikkuna", "Ensimmäinen palvelu", "Valmis"];

const accountSchema = z.object({
  name: z.string().min(2, "Nimi on pakollinen"),
  email: z.string().email("Tarkista sähköpostiosoite"),
  password: z.string().min(8, "Salasanan on oltava vähintään 8 merkkiä"),
});

type AccountValues = z.infer<typeof accountSchema>;

const RADIUS_OPTIONS = [5, 10, 20, 30, 50, 100];

export default function Onboarding() {
  const navigate = useNavigate();
  const { sessionUser, registerProvider } = useData();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<{ providerId?: string } | null>(null);

  // Vaihe 1: tili
  const accountForm = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Vaihe 2: näyteikkuna
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(["suomi"]);
  const [years, setYears] = useState(5);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Vaihe 3: palvelu
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("koti");
  const [delivery, setDelivery] = useState<DeliveryMode>("paikan_paalla");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState(20);
  const [pricing, setPricing] = useState<PricingModel>("tunti");
  const [price, setPrice] = useState("");
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>(["alusta"]);
  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const catImage = useMemo(() => CATEGORIES.find((c) => c.id === category)?.image, [category]);

  const next = () => {
    setError(null);
    setStep((s) => s + 1);
  };
  const prev = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const submitAccount = () => {
    accountForm.handleSubmit(() => next())();
  };

  const toggleLang = (lang: string) =>
    setLanguages((ls) => (ls.includes(lang) ? ls.filter((l) => l !== lang) : [...ls, lang]));

  const togglePayment = (m: PaymentMode) =>
    setPaymentModes((ms) => (ms.includes(m) ? ms.filter((x) => x !== m) : [...ms, m]));

  const priceValid = pricing === "tarjous" || (price !== "" && Number(price) > 0);

  const submitService = () => {
    if (title.trim().length < 5) return setError("Anna palvelulle nimi (vähintään 5 merkkiä).");
    if (description.trim().length < 20) return setError("Kuvaile palvelua hieman tarkemmin (vähintään 20 merkkiä).");
    if (pricing !== "tarjous" && !priceValid) return setError("Anna palvelulle hinta.");
    if (delivery === "paikan_paalla" && city.trim().length < 2) return setError("Kerro sijainti, jossa palvelet.");
    if (paymentModes.length === 0) return setError("Valitse vähintään yksi maksutapa.");

    setSubmitting(true);
    window.setTimeout(() => {
      const values = accountForm.getValues();
      const res = registerProvider(
        {
          name: values.name,
          email: values.email,
          password: values.password,
          city: city.trim() || "Suomi",
          tagline,
          bio,
          languages,
          experienceYears: years,
          avatarUrl: avatarUrl.trim() || undefined,
          bannerUrl: bannerUrl.trim() || undefined,
        },
        {
          title: title.trim(),
          description: description.trim(),
          category,
          delivery,
          pricing,
          price: pricing === "tarjous" ? null : Number(price),
          paymentModes,
          city: delivery === "paikan_paalla" ? city.trim() : undefined,
          radiusKm: delivery === "paikan_paalla" ? radius : undefined,
          imageUrl: imageUrl.trim() || catImage,
        },
      );
      setSubmitting(false);
      setDone({ providerId: res.providerId });
      setStep(3);
    }, 900);
  };

  // Jo kirjautunut toimittaja → ohjaamo
  if (sessionUser?.role === "tarjoaja" && step === 0 && !done) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <CheckCircle2 className="size-12 text-emerald-500" strokeWidth={1.5} />
        <h1 className="font-display text-2xl font-semibold">Sinulla on jo toimittajaprofiili</h1>
        <p className="text-muted-foreground">Voit hallita profiiliasi ja palveluitasi hallintapaneelissa.</p>
        <Button className="rounded-xl shadow-cta" onClick={() => navigate("/ohjaamo")}>
          Avaa hallintapaneeli <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Luo ilmainen profiili
          </h1>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
            <ShieldCheck className="size-4" /> Ei liittymismaksua. Pidä 100 % tuloistasi.
          </p>
        </div>

        {/* Edistyminen */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-primary text-white shadow-cta"
                      : "bg-white text-muted-foreground border border-border",
                )}
              >
                {i < step ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-8 bg-border sm:w-12" />}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border/70 bg-white p-6 shadow-card-lg sm:p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Perustiedot</h2>
              <div className="grid gap-2">
                <Label htmlFor="ob-name">Nimi tai yrityksen nimi</Label>
                <Input id="ob-name" placeholder="Matti Meikäläinen" className="rounded-xl" {...accountForm.register("name")} />
                {accountForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{accountForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-email">Sähköposti</Label>
                <Input id="ob-email" type="email" placeholder="matti@yritys.fi" className="rounded-xl" {...accountForm.register("email")} />
                {accountForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{accountForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-pass">Salasana</Label>
                <Input id="ob-pass" type="password" placeholder="Vähintään 8 merkkiä" className="rounded-xl" {...accountForm.register("password")} />
                {accountForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{accountForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button className="rounded-xl shadow-cta" onClick={submitAccount}>
                  Jatka <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Oma digitaalinen näyteikkuna</h2>
              <div className="grid gap-2">
                <Label htmlFor="ob-tagline">Iskulause</Label>
                <Input
                  id="ob-tagline"
                  placeholder="esim. Remontit ammattitaidolla – ilman yllätyksiä."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-bio">Esittelyteksti</Label>
                <Textarea
                  id="ob-bio"
                  placeholder="Kerro itsestäsi, osaamisestasi ja työtavastasi…"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Puhutut kielet</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLang(lang)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                        languages.includes(lang)
                          ? "border-primary bg-accent text-brand-700"
                          : "border-border text-muted-foreground hover:border-slate-300",
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-years">Kokemus vuosina</Label>
                <Input
                  id="ob-years"
                  type="number"
                  min={0}
                  max={60}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value) || 0)}
                  className="w-32 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-avatar">Profiilikuva (URL, valinnainen)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="ob-avatar"
                    placeholder="https://…"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="rounded-xl"
                  />
                  {avatarUrl.trim() ? (
                    <SmartImage src={avatarUrl} alt="Profiilikuva" className="size-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <ImageIcon className="size-5" />
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-banner">Kansikuva (URL, valinnainen)</Label>
                <Input
                  id="ob-banner"
                  placeholder="https://…"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" className="rounded-xl" onClick={prev}>
                  <ArrowLeft className="size-4" /> Takaisin
                </Button>
                <Button className="rounded-xl shadow-cta" onClick={next}>
                  Jatka <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold tracking-tight">
                Ensimmäinen palvelusi <span className="ml-1 text-sm font-normal text-muted-foreground">(voit lisätä myöhemmin lisää)</span>
              </h2>
              <div className="grid gap-2">
                <Label htmlFor="svc-title">Palvelun nimi</Label>
                <Input
                  id="svc-title"
                  placeholder="esim. Siivouspalvelu koteihin"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Kategoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as CategoryId)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Toteutustapa</Label>
                <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as DeliveryMode)} className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      { value: "paikan_paalla", title: "Paikan päällä", sub: "Palvelet tietyllä alueella" },
                      { value: "etana", title: "Etätyö", sub: "Saatavilla kaikkialla" },
                    ] as const
                  ).map((o) => (
                    <label
                      key={o.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all",
                        delivery === o.value ? "border-primary bg-accent" : "border-border hover:border-slate-300",
                      )}
                    >
                      <RadioGroupItem value={o.value} id={`del-${o.value}`} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-semibold">{o.title}</span>
                        <span className="block text-xs text-muted-foreground">{o.sub}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              {delivery === "paikan_paalla" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="svc-city">Sijainti</Label>
                    <Input
                      id="svc-city"
                      placeholder="esim. Helsinki"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Palvelualue (km)</Label>
                    <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RADIUS_OPTIONS.map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            {r} km
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Hinnoittelu</Label>
                <RadioGroup value={pricing} onValueChange={(v) => setPricing(v as PricingModel)} className="grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      { value: "tunti", title: "Tuntihinta", sub: "€ / tunti" },
                      { value: "paketti", title: "Kiinteä hinta", sub: "€ / paketti" },
                      { value: "tarjous", title: "Tarjouspyyntö", sub: "Hinta pyynnöstä" },
                    ] as const
                  ).map((o) => (
                    <label
                      key={o.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 transition-all",
                        pricing === o.value ? "border-primary bg-accent" : "border-border hover:border-slate-300",
                      )}
                    >
                      <RadioGroupItem value={o.value} id={`pr-${o.value}`} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-semibold">{o.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{o.sub}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              {pricing !== "tarjous" && (
                <div className="grid gap-2">
                  <Label htmlFor="svc-price">Hinta (€{pricing === "tunti" ? " / tunti" : ""})</Label>
                  <Input
                    id="svc-price"
                    type="number"
                    min={1}
                    placeholder={pricing === "tunti" ? "65" : "490"}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-40 rounded-xl"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Maksutavat</Label>
                <div className="grid gap-2">
                  {(
                    [
                      { value: "alusta", label: "Maksu alustan kautta", sub: "Asiakas maksaa turvallisesti EtsiPROssa" },
                      { value: "ulkopuolella", label: "Maksu alustan ulkopuolella", sub: "Sovitte maksun suoraan asiakkaan kanssa" },
                    ] as const
                  ).map((o) => (
                    <label
                      key={o.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all",
                        paymentModes.includes(o.value) ? "border-primary bg-accent" : "border-border hover:border-slate-300",
                      )}
                    >
                      <Checkbox
                        checked={paymentModes.includes(o.value)}
                        onCheckedChange={() => togglePayment(o.value)}
                        id={`pm-${o.value}`}
                      />
                      <span>
                        <span className="block text-sm font-semibold">{o.label}</span>
                        <span className="block text-xs text-muted-foreground">{o.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-desc">Kuvaus</Label>
                <Textarea
                  id="svc-desc"
                  placeholder="Mitä palvelusi sisältää? Kenelle se on tarkoitettu?"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-img">Kuva (URL, valinnainen)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="svc-img"
                    placeholder="https://… – tyhjäksi jätettynä käytämme kategorian kuvaa"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="rounded-xl"
                  />
                  <SmartImage
                    src={imageUrl.trim() || catImage}
                    alt="Palvelun kuva"
                    className="h-12 w-20 shrink-0 rounded-lg object-cover"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-between pt-1">
                <Button variant="ghost" className="rounded-xl" onClick={prev} disabled={submitting}>
                  <ArrowLeft className="size-4" /> Takaisin
                </Button>
                <Button className="rounded-xl shadow-cta" onClick={submitService} disabled={submitting}>
                  {submitting ? (
                    <>Luodaan profiilia…</>
                  ) : (
                    <>
                      <Sparkles className="size-4" /> Luo profiili ja palvelu
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-16 text-emerald-500" strokeWidth={1.4} />
              <h2 className="font-display text-2xl font-semibold tracking-tight">Tervetuloa EtsiPROhon!</h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Profiilisi ja ensimmäinen palvelusi ovat nyt julkisia. Asiakkaat voivat löytää ja varata
                palveluitasi heti.
              </p>
              <p className="font-display text-lg italic text-foreground/70">Ja homma hoituu.</p>
              <div className="mt-3 w-full space-y-2 sm:w-auto sm:min-w-72">
                <Button className="w-full rounded-xl shadow-cta" onClick={() => navigate("/ohjaamo")}>
                  Avaa hallintapaneeli <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <button onClick={() => done?.providerId && navigate(`/tarjoaja/${done.providerId}`)}>
                    Katso profiilisi
                  </button>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
