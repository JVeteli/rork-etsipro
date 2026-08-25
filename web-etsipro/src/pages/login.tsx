import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, UserRound, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/lib/store";

const loginSchema = z.object({
  email: z.string().email("Tarkista sähköpostiosoite"),
  password: z.string().min(1, "Salasana on pakollinen"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nimi on pakollinen"),
  email: z.string().email("Tarkista sähköpostiosoite"),
  password: z.string().min(8, "Salasanan on oltava vähintään 8 merkkiä"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const { signIn, registerCustomer } = useData();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const afterAuth = (isProvider: boolean) => {
    if (from) navigate(from);
    else navigate(isProvider ? "/ohjaamo" : "/selaa");
  };

  const onLogin = loginForm.handleSubmit((values) => {
    const res = signIn(values.email, values.password);
    if (!res.ok) return setError(res.error ?? "Kirjautuminen epäonnistui.");
    afterAuth(false);
  });

  const onRegister = registerForm.handleSubmit((values) => {
    registerCustomer(values.name, values.email, values.password);
    afterAuth(false);
  });

  const demoLogin = (email: string) => {
    const res = signIn(email, "demo1234");
    if (res.ok) {
      afterAuth(email === "mikko@etsipro.fi");
    }
  };

  return (
    <div className="bg-muted/40 py-12 sm:py-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {mode === "login" ? "Tervetuloa takaisin" : "Luo asiakastili"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Kirjaudu sisään varataksesi palveluita."
              : "Rekisteröityminen on ilmaista. Tarjoatko palveluita?"}{" "}
            {mode === "register" && (
              <Link to="/liity" className="font-medium text-primary hover:underline">
                Luo toimittajaprofiili
              </Link>
            )}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border/70 bg-white p-6 shadow-card-lg sm:p-8">
          <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
            {(
              [
                { value: "login", label: "Kirjaudu" },
                { value: "register", label: "Luo tili" },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setMode(t.value);
                  setError(null);
                }}
                className={
                  mode === t.value
                    ? "rounded-lg bg-white py-2 text-sm font-semibold shadow-sm"
                    : "rounded-lg py-2 text-sm font-medium text-muted-foreground"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <form onSubmit={onLogin} className="mt-6 space-y-4" noValidate>
              <div className="grid gap-2">
                <Label htmlFor="li-email">Sähköposti</Label>
                <Input id="li-email" type="email" placeholder="sinä@esimerkki.fi" className="rounded-xl" {...loginForm.register("email")} />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="li-pass">Salasana</Label>
                <Input id="li-pass" type="password" placeholder="••••••••" className="rounded-xl" {...loginForm.register("password")} />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-xl shadow-cta">
                Kirjaudu sisään <ArrowRight className="size-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={onRegister} className="mt-6 space-y-4" noValidate>
              <div className="grid gap-2">
                <Label htmlFor="re-name">Nimi</Label>
                <Input id="re-name" placeholder="Liisa Niemi" className="rounded-xl" {...registerForm.register("name")} />
                {registerForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="re-email">Sähköposti</Label>
                <Input id="re-email" type="email" placeholder="sinä@esimerkki.fi" className="rounded-xl" {...registerForm.register("email")} />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="re-pass">Salasana</Label>
                <Input id="re-pass" type="password" placeholder="Vähintään 8 merkkiä" className="rounded-xl" {...registerForm.register("password")} />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-xl shadow-cta">
                Luo tili <ArrowRight className="size-4" />
              </Button>
            </form>
          )}

          <Separator className="my-6" />
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Kokeile demoa yhdellä klikkauksella
          </p>
          <div className="mt-3 grid gap-2">
            <Button variant="outline" className="w-full rounded-xl" onClick={() => demoLogin("liisa@etsipro.fi")}>
              <UserRound className="size-4 text-primary" /> Demo: asiakas (Liisa)
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => demoLogin("mikko@etsipro.fi")}>
              <Briefcase className="size-4 text-primary" /> Demo: palveluntarjoaja (Mikko)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
