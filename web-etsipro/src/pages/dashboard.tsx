import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  BadgeEuro,
  CircleDollarSign,
  CreditCard,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Store,
  Trash2,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartImage } from "@/components/smart-image";
import { useData } from "@/lib/store";
import { CATEGORIES, ORDER_STATUS_LABEL, PAYMENT_LABEL, PRICING_LABEL } from "@/lib/seed";
import { euro, formatDateTime, initials, priceLabel } from "@/lib/format";
import type {
  CategoryId,
  DeliveryMode,
  NewServiceInput,
  Order,
  PaymentMode,
  PricingModel,
  ProviderProfile,
  Service,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------- Yhteiset osat ---------- */

function ChannelBadge({ channel }: { channel: Order["channel"] }) {
  if (channel === "alusta") {
    return (
      <Badge variant="brand" className="gap-1 rounded-full font-medium">
        <CreditCard className="size-3" /> Maksu alustan kautta
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 rounded-full border-amber-300 bg-amber-50 font-medium text-amber-700">
      <Handshake className="size-3" /> Maksu alustan ulkopuolella
    </Badge>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const styles: Record<Order["status"], string> = {
    sovitaan: "border-amber-300 bg-amber-50 text-amber-700",
    maksettu: "border-emerald-300 bg-emerald-50 text-emerald-700",
    valmis: "border-slate-300 bg-slate-100 text-slate-600",
    peruttu: "border-red-300 bg-red-50 text-red-600",
  };
  return <Badge variant="outline" className={cn("rounded-full font-medium", styles[status])}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

interface ServiceFormState {
  open: boolean;
  editing?: Service;
}

function ServiceFormDialog({
  state,
  onClose,
  defaultProviderId,
}: {
  state: ServiceFormState;
  onClose: () => void;
  defaultProviderId?: string;
}) {
  const { db, addService, updateService } = useData();
  const s = state.editing;
  const [title, setTitle] = useState(s?.title ?? "");
  const [description, setDescription] = useState(s?.description ?? "");
  const [category, setCategory] = useState<CategoryId>(s?.category ?? "koti");
  const [delivery, setDelivery] = useState<DeliveryMode>(s?.delivery ?? "paikan_paalla");
  const [city, setCity] = useState(s?.city ?? "");
  const [radius, setRadius] = useState(s?.radiusKm ?? 20);
  const [pricing, setPricing] = useState<PricingModel>(s?.pricing ?? "tunti");
  const [price, setPrice] = useState(s?.price != null ? String(s.price) : "");
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>(s?.paymentModes ?? ["alusta"]);
  const [imageUrl, setImageUrl] = useState(s?.images[0] ?? "");
  const [error, setError] = useState<string | null>(null);

  const catImage = CATEGORIES.find((c) => c.id === category)?.image;
  const providerCity = db.providers.find((p) => p.id === defaultProviderId)?.city;

  const togglePayment = (m: PaymentMode) =>
    setPaymentModes((ms) => (ms.includes(m) ? ms.filter((x) => x !== m) : [...ms, m]));

  const submit = () => {
    if (title.trim().length < 5) return setError("Anna palvelulle nimi.");
    if (description.trim().length < 20) return setError("Kuvaile palvelua tarkemmin.");
    if (pricing !== "tarjous" && (price === "" || Number(price) <= 0)) return setError("Anna hinta.");
    if (delivery === "paikan_paalla" && city.trim().length < 2) return setError("Kerro sijainti.");
    if (paymentModes.length === 0) return setError("Valitse vähintään yksi maksutapa.");

    const input: NewServiceInput = {
      title: title.trim(),
      description: description.trim(),
      category,
      delivery,
      pricing,
      price: pricing === "tarjous" ? null : Number(price),
      paymentModes,
      city: delivery === "paikan_paalla" ? city.trim() : undefined,
      radiusKm: delivery === "paikan_paalla" ? radius : undefined,
      imageUrl: imageUrl.trim() || undefined,
    };
    if (state.editing) updateService(state.editing.id, input);
    else addService(input);
    onClose();
  };

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent key={state.editing?.id ?? "new"} className="max-h-[90vh] max-w-lg overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{state.editing ? "Muokkaa palvelua" : "Uusi palvelu"}</DialogTitle>
          <DialogDescription>
            {state.editing ? "Päivitä palvelun tiedot." : "Lisää uusi palvelu näyteikkunaasi."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label>Palvelun nimi</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label>Kategoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CategoryId)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Toteutustapa</Label>
            <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as DeliveryMode)} className="grid grid-cols-2 gap-2">
              {(["paikan_paalla", "etana"] as const).map((o) => (
                <label
                  key={o}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border p-3",
                    delivery === o ? "border-primary bg-accent" : "border-border",
                  )}
                >
                  <RadioGroupItem value={o} />
                  <span className="text-sm font-medium">{o === "paikan_paalla" ? "Paikan päällä" : "Etätyö"}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          {delivery === "paikan_paalla" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Sijainti</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={providerCity ?? "esim. Helsinki"}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Palvelualue (km)</Label>
                <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 30, 50, 100].map((r) => (
                      <SelectItem key={r} value={String(r)}>{r} km</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Hinnoittelu</Label>
            <RadioGroup value={pricing} onValueChange={(v) => setPricing(v as PricingModel)} className="grid grid-cols-3 gap-2">
              {(["tunti", "paketti", "tarjous"] as const).map((o) => (
                <label
                  key={o}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border p-3",
                    pricing === o ? "border-primary bg-accent" : "border-border",
                  )}
                >
                  <RadioGroupItem value={o} />
                  <span className="text-xs font-medium">{PRICING_LABEL[o]}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          {pricing !== "tarjous" && (
            <div className="grid gap-2">
              <Label>Hinta (€{pricing === "tunti" ? " / tunti" : ""})</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-40 rounded-xl" />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Maksutavat</Label>
            <div className="grid gap-2">
              {(["alusta", "ulkopuolella"] as const).map((o) => (
                <label
                  key={o}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-3",
                    paymentModes.includes(o) ? "border-primary bg-accent" : "border-border",
                  )}
                >
                  <Checkbox checked={paymentModes.includes(o)} onCheckedChange={() => togglePayment(o)} />
                  <span className="text-sm font-medium">{PAYMENT_LABEL[o]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Kuvaus</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label>Kuva (URL, valinnainen)</Label>
            <div className="flex items-center gap-3">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Tyhjä = kategorian kuva"
                className="rounded-xl"
              />
              <SmartImage src={imageUrl.trim() || catImage} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full rounded-xl shadow-cta" onClick={submit}>
            {state.editing ? "Tallenna muutokset" : "Julkaise palvelu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Asiakasnäkymä ---------- */

function CustomerOrders() {
  const { db, sessionUser } = useData();
  const navigate = useNavigate();
  if (!sessionUser) return null;
  const orders = db.orders
    .filter((o) => o.customerId === sessionUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Tilaukseni</h1>
      <p className="mt-1 text-muted-foreground">Varaamasi palvelut ja niiden maksutilanne.</p>
      <div className="mt-6 space-y-3">
        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Et ole vielä varannut palveluita.</p>
            <Button className="mt-4 rounded-xl" asChild>
              <Link to="/selaa">Selaa palveluita</Link>
            </Button>
          </div>
        )}
        {orders.map((o) => {
          const service = db.services.find((s) => s.id === o.serviceId);
          const provider = db.providers.find((p) => p.id === o.providerId);
          if (!service || !provider) return null;
          return (
            <div key={o.id} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-white p-5 shadow-card sm:flex-row sm:items-center">
              <SmartImage src={service.images[0]} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={`/palvelu/${service.id}`} className="font-semibold tracking-tight hover:text-primary">
                  {service.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {provider.name} · {formatDateTime(o.createdAt)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ChannelBadge channel={o.channel} />
                  <StatusBadge status={o.status} />
                  {o.amount != null && <span className="text-sm font-bold">{euro(o.amount)}</span>}
                </div>
              </div>
              <Button variant="outline" className="shrink-0 rounded-xl" onClick={() => navigate(`/viestit?t=${o.threadId}`)}>
                <MessageCircle className="size-4" /> Viestit
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Toimittajan hallintapaneeli ---------- */

function ProviderDashboard({ provider }: { provider: ProviderProfile }) {
  const { db, deleteService, updateOrderStatus } = useData();
  const navigate = useNavigate();
  const [serviceForm, setServiceForm] = useState<ServiceFormState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [orderFilter, setOrderFilter] = useState<"kaikki" | PaymentMode>("kaikki");

  const services = db.services.filter((s) => s.providerId === provider.id);
  const orders = db.orders
    .filter((o) => o.providerId === provider.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const platformRevenue = orders
    .filter((o) => o.channel === "alusta" && o.amount != null && o.status !== "peruttu")
    .reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const outsideCount = orders.filter((o) => o.channel === "ulkopuolella" && o.status !== "peruttu").length;
  const filteredOrders = orderFilter === "kaikki" ? orders : orders.filter((o) => o.channel === orderFilter);

  const orderCard = (o: Order) => {
    const service = db.services.find((s) => s.id === o.serviceId);
    const customer = db.users.find((u) => u.id === o.customerId);
    return (
      <div key={o.id} className="rounded-2xl border border-border/70 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/palvelu/${o.serviceId}`} className="font-semibold tracking-tight hover:text-primary">
              {service?.title ?? "Poistettu palvelu"}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Asiakas: {customer?.name ?? "Asiakas"} · {formatDateTime(o.createdAt)}
            </p>
          </div>
          {o.amount != null && <span className="text-lg font-bold tracking-tight">{euro(o.amount)}</span>}
        </div>
        {o.notes && <p className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{o.notes}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ChannelBadge channel={o.channel} />
          <StatusBadge status={o.status} />
          <div className="ml-auto flex gap-2">
            {o.status === "sovitaan" && (
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => updateOrderStatus(o.id, "valmis")}>
                Merkitse valmiiksi
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => navigate(`/viestit?t=${o.threadId}`)}>
              <MessageCircle className="size-3.5" /> Keskustelu
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 rounded-2xl">
            <AvatarImage src={provider.avatarUrl} />
            <AvatarFallback className="rounded-2xl bg-brand-100 text-lg font-bold text-brand-700">
              {initials(provider.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Hei, {provider.name}!</h1>
            <p className="text-sm text-muted-foreground">Tässä on näyteikkunasi tilanne.</p>
          </div>
        </div>
        <Button className="rounded-xl shadow-cta" onClick={() => setServiceForm({ open: true })}>
          <Plus className="size-4" /> Lisää palvelu
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Package, label: "Palveluita", value: String(services.length), sub: "julkaistu näyteikkunassa" },
          { icon: CircleDollarSign, label: "Alustan kautta laskutettu", value: euro(platformRevenue), sub: "maksetut tilaukset" },
          { icon: Handshake, label: "Ulkopuolella sovitut", value: String(outsideCount), sub: "sovi maksu asiakkaan kanssa" },
          { icon: Wallet, label: "Tulosi", value: "100 %", sub: "ei komissioita, ei maksuja" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/70 bg-white p-5 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
              <s.icon className="size-5" />
            </span>
            <p className="mt-3 text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground/70">{s.sub}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="tilaukset" className="mt-10">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted p-1 sm:w-auto">
          <TabsTrigger value="yleiskatsaus" className="gap-1.5 rounded-lg">
            <LayoutDashboard className="size-4" /> Yleiskatsaus
          </TabsTrigger>
          <TabsTrigger value="palvelut" className="gap-1.5 rounded-lg">
            <Package className="size-4" /> Palvelut
          </TabsTrigger>
          <TabsTrigger value="tilaukset" className="gap-1.5 rounded-lg">
            <CreditCard className="size-4" /> Tilaukset
          </TabsTrigger>
          <TabsTrigger value="profiili" className="gap-1.5 rounded-lg">
            <UserIcon className="size-4" /> Profiili
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yleiskatsaus" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Viimeisimmät tilaukset</h2>
              <div className="mt-4 space-y-3">
                {orders.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Ei vielä tilauksia. Ne näkyvät täällä heti, kun asiakas varaa palvelusi.
                  </p>
                ) : (
                  orders.slice(0, 4).map(orderCard)
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-card">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Store className="size-4 text-primary" /> Näyteikkunasi
                </h3>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Profiili: <Link to={`/tarjoaja/${provider.id}`} className="font-medium text-primary hover:underline">Katso julkisesti</Link></p>
                  <p>Palveluita: {services.length} kpl</p>
                  <p>Arvosteluja: {provider.reviewCount} kpl</p>
                </div>
                <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => navigate(`/tarjoaja/${provider.id}`)}>
                  Avaa profiili
                </Button>
              </div>
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                  <BadgeEuro className="size-4" /> Muista: 100 % tuloistasi on sinun
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-brand-700/80">
                  EtsiPRO ei peri komissiota eikä liittymismaksua. Alustan kautta maksetut tilaukset
                  siirtyvät sinulle kokonaisuudessaan.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="palvelut" className="mt-6">
          <div className="space-y-3">
            {services.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="text-sm text-muted-foreground">Sinulla ei ole vielä palveluita.</p>
                <Button className="mt-4 rounded-xl" onClick={() => setServiceForm({ open: true })}>
                  <Plus className="size-4" /> Lisää ensimmäinen palvelu
                </Button>
              </div>
            )}
            {services.map((s) => (
              <div key={s.id} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-white p-4 shadow-card sm:flex-row sm:items-center">
                <SmartImage src={s.images[0]} alt="" className="h-20 w-32 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/palvelu/${s.id}`} className="font-semibold tracking-tight hover:text-primary">
                    {s.title}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary" className="rounded-full">
                      {CATEGORIES.find((c) => c.id === s.category)?.label}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">{PRICING_LABEL[s.pricing]}</Badge>
                    <span className="font-bold">{priceLabel(s)}</span>
                    <span className="text-muted-foreground">
                      {s.paymentModes.map((m) => (m === "alusta" ? "Alusta" : "Ulkopuolella")).join(" · ")}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="icon" className="size-9 rounded-xl" onClick={() => setServiceForm({ open: true, editing: s })}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-9 rounded-xl text-destructive hover:text-destructive" onClick={() => setDeleteTarget(s)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tilaukset" className="mt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-3 gap-1 rounded-xl bg-muted p-1 sm:w-auto">
              {(
                [
                  { value: "kaikki", label: "Kaikki" },
                  { value: "alusta", label: "Maksu alustan kautta" },
                  { value: "ulkopuolella", label: "Maksu ulkopuolella" },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setOrderFilter(t.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm",
                    orderFilter === t.value ? "bg-white text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length} tilausta
              {orderFilter === "alusta" && ` · ${euro(filteredOrders.reduce((s, o) => s + (o.amount ?? 0), 0))} laskutettu`}
            </p>
          </div>
          <div className="space-y-3">
            {filteredOrders.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Ei tilauksia tällä suodattimella.
              </p>
            )}
            {filteredOrders.map(orderCard)}
          </div>
        </TabsContent>

        <TabsContent value="profiili" className="mt-6">
          <ProfileEdit provider={provider} />
        </TabsContent>
      </Tabs>

      <ServiceFormDialog state={serviceForm} onClose={() => setServiceForm({ open: false })} defaultProviderId={provider.id} />
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Poista palvelu?</AlertDialogTitle>
            <AlertDialogDescription>
              Palvelu ”{deleteTarget?.title}” poistetaan pysyvästi. Tätä ei voi kumota.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Peruuta</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteService(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Poista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProfileEdit({ provider }: { provider: ProviderProfile }) {
  const { updateProvider } = useData();
  const [form, setForm] = useState<ProviderProfile>(provider);
  const set = <K extends keyof ProviderProfile>(key: K, value: ProviderProfile[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const certs = useMemo(() => form.certifications, [form.certifications]);
  const faq = useMemo(() => form.faq, [form.faq]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid gap-2">
        <Label>Iskulause</Label>
        <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="rounded-xl" />
      </div>
      <div className="grid gap-2">
        <Label>Esittelyteksti</Label>
        <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={5} className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Kaupunki</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} className="rounded-xl" />
        </div>
        <div className="grid gap-2">
          <Label>Kokemus vuosina</Label>
          <Input
            type="number"
            value={form.experienceYears}
            onChange={(e) => set("experienceYears", Number(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Sertifikaatit (yksi per rivi)</Label>
        <Textarea
          value={certs.join("\n")}
          onChange={(e) => set("certifications", e.target.value.split("\n").filter(Boolean))}
          rows={3}
          className="rounded-xl"
          placeholder={"S2-sähköpätevyys\nEnsiapukortti"}
        />
      </div>
      <div className="grid gap-2">
        <Label>UKK (muodossa: Kysymys | Vastaus, yksi per rivi)</Label>
        <Textarea
          value={faq.map((f) => `${f.q} | ${f.a}`).join("\n")}
          onChange={(e) =>
            set(
              "faq",
              e.target.value
                .split("\n")
                .map((line) => {
                  const [q, a] = line.split("|");
                  return q && a ? { q: q.trim(), a: a.trim() } : null;
                })
                .filter((x): x is { q: string; a: string } => x !== null),
            )
          }
          rows={3}
          className="rounded-xl"
        />
      </div>
      <div className="grid gap-2">
        <Label>Esittelyvideo (YouTube-URL, valinnainen)</Label>
        <Input
          value={form.videoUrl ?? ""}
          onChange={(e) => set("videoUrl", e.target.value || undefined)}
          placeholder="https://youtube.com/watch?v=…"
          className="rounded-xl"
        />
      </div>
      <div className="grid gap-2">
        <Label>Profiilikuva (URL)</Label>
        <Input
          value={form.avatarUrl ?? ""}
          onChange={(e) => set("avatarUrl", e.target.value || undefined)}
          placeholder="https://…"
          className="rounded-xl"
        />
      </div>
      <div className="grid gap-2">
        <Label>Kansikuva (URL)</Label>
        <Input
          value={form.bannerUrl ?? ""}
          onChange={(e) => set("bannerUrl", e.target.value || undefined)}
          placeholder="https://…"
          className="rounded-xl"
        />
      </div>
      <Button className="rounded-xl shadow-cta" onClick={() => updateProvider(provider.id, form)}>
        Tallenna profiili
      </Button>
    </div>
  );
}

/* ---------- Päänäkymä ---------- */

export default function Dashboard() {
  const { db, sessionUser } = useData();

  if (!sessionUser) {
    return <Navigate to="/kirjaudu" state={{ from: "/ohjaamo" }} replace />;
  }

  if (sessionUser.role === "asiakas") {
    return <CustomerOrders />;
  }

  const provider = db.providers.find((p) => p.id === sessionUser.providerId);
  if (!provider) {
    return <Navigate to="/liity" replace />;
  }

  return <ProviderDashboard provider={provider} />;
}
