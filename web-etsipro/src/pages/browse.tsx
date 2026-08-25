import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe2, MapPin, Search, SearchX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ServiceCard } from "@/components/service-card";
import { useData } from "@/lib/store";
import { CATEGORIES } from "@/lib/seed";
import type { DeliveryMode, PricingModel } from "@/lib/types";
import { cn } from "@/lib/utils";

type ModeFilter = "kaikki" | DeliveryMode;
type PricingFilter = "kaikki" | PricingModel;
type Sort = "suosituin" | "arvostelut" | "hinta_asc" | "hinta_desc";

const sortOptions: { value: Sort; label: string }[] = [
  { value: "suosituin", label: "Suosituimmat ensin" },
  { value: "arvostelut", label: "Parhaat arvostelut" },
  { value: "hinta_asc", label: "Hinta: halvin ensin" },
  { value: "hinta_desc", label: "Hinta: kallein ensin" },
];

const modeOptions: { value: ModeFilter; label: string; icon?: typeof MapPin }[] = [
  { value: "kaikki", label: "Kaikki toimitustavat" },
  { value: "paikan_paalla", label: "Paikan päällä", icon: MapPin },
  { value: "etana", label: "Etätyö", icon: Globe2 },
];

export default function Browse() {
  const { db } = useData();
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const cat = params.get("cat") ?? "";
  const mode = (params.get("mode") ?? "kaikki") as ModeFilter;
  const pricing = (params.get("pricing") ?? "kaikki") as PricingFilter;
  const sort = (params.get("sort") ?? "suosituin") as Sort;
  const city = params.get("city") ?? "";
  const radius = Number(params.get("radius") ?? "25");

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "kaikki") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    let list = [...db.services];
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((s) => {
        const provider = db.providers.find((p) => p.id === s.providerId);
        return (
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.tags.some((t) => t.toLowerCase().includes(query)) ||
          (provider?.name.toLowerCase().includes(query) ?? false)
        );
      });
    }
    if (cat) list = list.filter((s) => s.category === cat);
    if (mode !== "kaikki") list = list.filter((s) => s.delivery === mode);
    if (pricing !== "kaikki") list = list.filter((s) => s.pricing === pricing);
    if (mode === "paikan_paalla" && city.trim()) {
      const c = city.trim().toLowerCase();
      list = list.filter((s) => s.city?.toLowerCase().includes(c));
    }

    switch (sort) {
      case "arvostelut":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "hinta_asc":
        list.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
        break;
      case "hinta_desc":
        list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
        break;
      default:
        list.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return list;
  }, [db.services, db.providers, q, cat, mode, pricing, city, sort]);

  const resetFilters = () => setParams(new URLSearchParams(), { replace: true });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Selaa palveluita</h1>
        <p className="text-muted-foreground">
          {results.length} palvelua{cat ? ` kategoriassa ${CATEGORIES.find((c) => c.id === cat)?.label}` : ""}
        </p>
      </div>

      {/* Suodattimet */}
      <div className="sticky top-16 z-30 -mx-4 mt-6 border-y border-border/60 bg-white/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-4 sm:shadow-card">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
                placeholder="Hae palvelua, osaajaa tai avainsanaa…"
                className="h-11 rounded-xl pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={pricing} onValueChange={(v) => setParam("pricing", v)}>
                <SelectTrigger className="h-11 w-full rounded-xl lg:w-48">
                  <SelectValue placeholder="Hinnoittelu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kaikki">Kaikki hinnoittelut</SelectItem>
                  <SelectItem value="tunti">Tuntihinta</SelectItem>
                  <SelectItem value="paketti">Kiinteä hinta</SelectItem>
                  <SelectItem value="tarjous">Tarjouspyyntö</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
                <SelectTrigger className="h-11 w-full rounded-xl lg:w-52">
                  <SelectValue placeholder="Järjestys" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
            {modeOptions.map((o) => (
              <Button
                key={o.value}
                variant={mode === o.value ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 shrink-0 rounded-full border-slate-200 px-4 text-xs font-semibold",
                  mode === o.value && "shadow-cta",
                )}
                onClick={() => setParam("mode", o.value)}
              >
                {o.icon && <o.icon className="mr-1.5 size-3.5" />}
                {o.label}
              </Button>
            ))}
          </div>

          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
            <Button
              variant={!cat ? "default" : "outline"}
              size="sm"
              className={cn("h-9 shrink-0 rounded-full border-slate-200 px-4 text-xs font-semibold", !cat && "shadow-cta")}
              onClick={() => setParam("cat", "")}
            >
              Kaikki
            </Button>
            {CATEGORIES.map((c) => (
              <Button
                key={c.id}
                variant={cat === c.id ? "default" : "outline"}
                size="sm"
                className={cn("h-9 shrink-0 rounded-full border-slate-200 px-4 text-xs font-semibold", cat === c.id && "shadow-cta")}
                onClick={() => setParam("cat", c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {mode === "paikan_paalla" && (
            <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={city}
                  onChange={(e) => setParam("city", e.target.value)}
                  placeholder="Sijainti, esim. Helsinki"
                  className="h-10 rounded-xl bg-white pl-10"
                />
              </div>
              <div className="flex items-center gap-3 sm:w-72">
                <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
                <Slider
                  value={[radius]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={(v) => setParam("radius", String(v[0]))}
                  className="flex-1"
                />
                <span className="w-20 shrink-0 text-right text-xs font-semibold">{radius} km</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Näytetään toimittajat, jotka palvelevat alueella
                {city ? `: ${city} + ${radius} km` : "."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tulokset */}
      {results.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <SearchX className="size-8" strokeWidth={1.5} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Ei hakutuloksia</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Kokeile eri hakusanaa tai löysennä suodattimia.
            </p>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={resetFilters}>
            Tyhjennä suodattimet
          </Button>
        </div>
      )}
    </div>
  );
}
