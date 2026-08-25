import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/lib/store";
import { euro, priceWithModel } from "@/lib/format";
import type { PaymentMode, Service } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = "login" | "channel" | "pay" | "done";

interface BookingDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({ service, open, onOpenChange }: BookingDialogProps) {
  const { sessionUser, createBooking } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("login");
  const [channel, setChannel] = useState<PaymentMode>("alusta");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState<number | null>(service.price);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<{ orderId: string; threadId: string } | null>(null);

  useEffect(() => {
    if (open) {
      setStep(sessionUser ? "channel" : "login");
      setChannel(service.paymentModes.includes("alusta") ? "alusta" : "ulkopuolella");
      setNotes("");
      setDate("");
      setAmount(service.price);
      setCard({ number: "", expiry: "", cvc: "", name: "" });
      setPaying(false);
      setResult(null);
    }
  }, [open, sessionUser, service]);

  const isTarjous = service.pricing === "tarjous";
  const payDisabled =
    card.number.replace(/\s/g, "").length < 12 || card.expiry.length < 4 || card.cvc.length < 3 || card.name.length < 2;

  const submitOutside = () => {
    const res = createBooking({ serviceId: service.id, channel: "ulkopuolella", notes, date: date || undefined });
    if (res.ok && res.orderId && res.threadId) {
      setResult({ orderId: res.orderId, threadId: res.threadId });
      setStep("done");
    }
  };

  const submitPay = () => {
    setPaying(true);
    window.setTimeout(() => {
      const res = createBooking({
        serviceId: service.id,
        channel: "alusta",
        notes,
        date: date || undefined,
        amount: isTarjous ? amount : service.price,
      });
      setPaying(false);
      if (res.ok && res.orderId && res.threadId) {
        setResult({ orderId: res.orderId, threadId: res.threadId });
        setStep("done");
      }
    }, 1400);
  };

  const title = step === "done" ? null : step === "pay" ? "Turvallinen maksu" : "Varaa palvelu";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl">
        {step !== "done" && (
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
            <DialogDescription className="line-clamp-1 text-xs">{service.title}</DialogDescription>
          </DialogHeader>
        )}

        {step === "login" && (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
              <Lock className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Kirjaudu sisään lähettääksesi varauspyynnön. Rekisteröityminen on ilmaista.
            </p>
            <Button className="w-full rounded-xl shadow-cta" asChild>
              <Link to="/kirjaudu" state={{ from: `/palvelu/${service.id}` }}>
                Kirjaudu sisään <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}

        {step === "channel" && (
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              {service.paymentModes.includes("alusta") && (
                <button
                  type="button"
                  onClick={() => setChannel("alusta")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    channel === "alusta"
                      ? "border-primary bg-accent shadow-sm ring-1 ring-primary/60"
                      : "border-border hover:border-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      channel === "alusta" ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <ShieldCheck className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Maksa alustan kautta</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      Turvallinen korttimaksu. Rahat siirtyvät toimittajalle, kun työ on sovittu.
                    </span>
                  </span>
                </button>
              )}
              {service.paymentModes.includes("ulkopuolella") && (
                <button
                  type="button"
                  onClick={() => setChannel("ulkopuolella")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    channel === "ulkopuolella"
                      ? "border-primary bg-accent shadow-sm ring-1 ring-primary/60"
                      : "border-border hover:border-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      channel === "ulkopuolella" ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <MessageSquare className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Sovi maksu toimittajan kanssa</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      Lähetät varauspyynnön ja sovitte yksityiskohdat ja maksun viestiketjussa.
                    </span>
                  </span>
                </button>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bk-date" className="text-xs text-muted-foreground">
                Toivottu ajankohta (valinnainen)
              </Label>
              <Input id="bk-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bk-notes" className="text-xs text-muted-foreground">
                Viesti toimittajalle
              </Label>
              <Textarea
                id="bk-notes"
                placeholder="Kerro lyhyesti, mitä tarvitset…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">Yhteenveto</span>
              <span className="text-sm font-bold">{isTarjous && channel === "alusta" ? "Sovittava hinta" : priceWithModel(service)}</span>
            </div>

            <Button
              className="w-full rounded-xl shadow-cta"
              onClick={() => (channel === "alusta" ? setStep("pay") : submitOutside())}
            >
              {channel === "alusta" ? "Jatka maksamaan" : "Lähetä varauspyyntö"} <ArrowRight className="size-4" />
            </Button>
            {channel === "ulkopuolella" && (
              <p className="text-center text-[11px] text-muted-foreground">
                Varauspyyntö avaa viestiketjun sinun ja toimittajan välille.
              </p>
            )}
          </div>
        )}

        {step === "pay" && (
          <div className="space-y-3 px-6 py-5">
            <div className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-medium text-brand-700">
              <Lock className="size-3.5" /> 256-bittinen salattu maksuyhteys
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-name" className="text-xs text-muted-foreground">Kortinhaltija</Label>
              <Input id="card-name" placeholder="Liisa Niemi" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-number" className="text-xs text-muted-foreground">Kortin numero</Label>
              <Input
                id="card-number"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) =>
                  setCard({ ...card, number: e.target.value.replace(/[^\d]/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").slice(0, 19) })
                }
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="card-exp" className="text-xs text-muted-foreground">Voimassa</Label>
                <Input
                  id="card-exp"
                  inputMode="numeric"
                  placeholder="12/28"
                  value={card.expiry}
                  onChange={(e) =>
                    setCard({
                      ...card,
                      expiry: e.target.value
                        .replace(/[^\d]/g, "")
                        .replace(/(\d{2})(?=\d)/, "$1/")
                        .slice(0, 5),
                    })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="card-cvc" className="text-xs text-muted-foreground">CVC</Label>
                <Input
                  id="card-cvc"
                  inputMode="numeric"
                  placeholder="123"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })}
                  className="rounded-xl"
                />
              </div>
            </div>
            {isTarjous && (
              <div className="grid gap-2">
                <Label htmlFor="pay-amount" className="text-xs text-muted-foreground">Ehdotettu summa (€)</Label>
                <Input
                  id="pay-amount"
                  inputMode="numeric"
                  placeholder="500"
                  value={amount ?? ""}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value.replace(/[^\d]/g, "")) : null)}
                  className="rounded-xl"
                />
              </div>
            )}
            <Button className="w-full rounded-xl shadow-cta" disabled={paying || payDisabled} onClick={submitPay}>
              {paying ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Käsitellään maksua…
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  Maksa {isTarjous ? (amount != null ? euro(amount) : "") : priceWithModel(service)}
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Demo-maksu – korttitietoja ei tallenneta eikä veloiteta.
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <CheckCircle2 className="size-14 text-emerald-500" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold tracking-tight">
              {channel === "alusta" ? "Maksu onnistui!" : "Varauspyyntö lähetetty!"}
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              {channel === "alusta"
                ? "Kiitos tilauksestasi. Toimittaja on saanut tilauksen ja viestiketju on avattu."
                : "Toimittaja on saanut pyyntösi. Voitte sopia yksityiskohdista ja maksusta viestiketjussa."}
            </p>
            <div className="mt-2 w-full space-y-2">
              <Button className="w-full rounded-xl shadow-cta" onClick={() => navigate(`/viestit?t=${result?.threadId}`)}>
                Avaa viestiketju <MessageSquare className="size-4" />
              </Button>
              <Button variant="ghost" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
                Sulje
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
