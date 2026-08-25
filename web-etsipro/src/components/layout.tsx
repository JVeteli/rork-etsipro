import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useData } from "@/lib/store";
import { initials } from "@/lib/format";
import { CATEGORIES } from "@/lib/seed";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }), [pathname]);
  return null;
}

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
    isActive && "text-foreground",
  );

function UserMenu() {
  const { sessionUser, signOut, unread } = useData();
  const navigate = useNavigate();
  if (!sessionUser) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative hidden size-10 rounded-xl sm:inline-flex"
        aria-label="Viestit"
        onClick={() => navigate("/viestit")}
      >
        <MessageCircle className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 rounded-xl px-2">
            <Avatar className="size-7 rounded-lg">
              <AvatarFallback className="rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                {initials(sessionUser.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-28 truncate text-sm font-medium md:block">{sessionUser.name}</span>
            <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {sessionUser.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />
          {sessionUser.role === "tarjoaja" && (
            <DropdownMenuItem className="rounded-lg" onClick={() => navigate("/ohjaamo")}>
              <LayoutDashboard className="size-4" /> Hallintapaneeli
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="rounded-lg" onClick={() => navigate("/viestit")}>
            <MessageCircle className="size-4" /> Viestit
            {unread > 0 && (
              <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem className="rounded-lg text-destructive" onClick={signOut}>
            <LogOut className="size-4" /> Kirjaudu ulos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function Navbar() {
  const { sessionUser, signOut } = useData();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" aria-label="EtsiPRO etusivu">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/selaa" className={navLinkCls}>
              Selaa palveluita
            </NavLink>
            <NavLink to="/liity" className={navLinkCls}>
              Toimittajille
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <UserMenu />
          {!sessionUser && (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" className="h-10 rounded-xl" asChild>
                <Link to="/kirjaudu">Kirjaudu sisään</Link>
              </Button>
              <Button className="h-10 rounded-xl shadow-cta" asChild>
                <Link to="/liity">
                  Luo ilmainen profiili <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10 rounded-xl md:hidden" aria-label="Avaa valikko">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle className="flex items-center justify-between">
                  <Logo />
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setOpen(false)}>
                    <X className="size-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                <Button variant="ghost" className="justify-start rounded-xl" asChild onClick={() => setOpen(false)}>
                  <Link to="/selaa">Selaa palveluita</Link>
                </Button>
                <Button variant="ghost" className="justify-start rounded-xl" asChild onClick={() => setOpen(false)}>
                  <Link to="/liity">Toimittajille</Link>
                </Button>
                {sessionUser && (
                  <>
                    <Button variant="ghost" className="justify-start rounded-xl" asChild onClick={() => setOpen(false)}>
                      <Link to="/viestit">Viestit</Link>
                    </Button>
                    {sessionUser.role === "tarjoaja" && (
                      <Button variant="ghost" className="justify-start rounded-xl" asChild onClick={() => setOpen(false)}>
                        <Link to="/ohjaamo">Hallintapaneeli</Link>
                      </Button>
                    )}
                  </>
                )}
                <div className="my-2 border-t" />
                {!sessionUser ? (
                  <>
                    <Button variant="outline" className="rounded-xl" asChild onClick={() => setOpen(false)}>
                      <Link to="/kirjaudu">Kirjaudu sisään</Link>
                    </Button>
                    <Button className="rounded-xl shadow-cta" asChild onClick={() => setOpen(false)}>
                      <Link to="/liity">Luo ilmainen profiili</Link>
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="rounded-xl" onClick={signOut}>
                    <LogOut className="size-4" /> Kirjaudu ulos
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { resetDemo } = useData();
  return (
    <footer className="border-t bg-[#10131A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo className="[&>span:last-child]:text-white" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Palvelutori suomalaisille osaajille. Ja homma hoituu.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70">
              <span className="size-1.5 rounded-full bg-emerald-400" /> Ei liittymismaksua. Pidä 100 % tuloistasi.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Selaa</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              {CATEGORIES.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link className="transition-colors hover:text-white" to={`/selaa?cat=${c.id}`}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Toimittajille</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li>
                <Link className="transition-colors hover:text-white" to="/liity">
                  Luo ilmainen profiili
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" to="/selaa?cat=digi">
                  Digitaaliset palvelut
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" to="/selaa?cat=koti">
                  Koti ja asuminen
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Yritys</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li>
                <Link className="transition-colors hover:text-white" to="/selaa">
                  Kaikki palvelut
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={resetDemo}
                  className="inline-flex items-center gap-1.5 text-white/40 transition-colors hover:text-white/80"
                >
                  <RotateCcw className="size-3.5" /> Nollaa demo-data
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center">
          <p>© 2026 EtsiPRO Oy. Kaikki oikeudet pidätetään.</p>
          <p className="font-display italic text-white/50">Ja homma hoituu.</p>
        </div>
      </div>
    </footer>
  );
}

export function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
