import { Link } from "react-router-dom";
import { Globe2, MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/lib/store";
import { categoryById } from "@/lib/seed";
import { initials, priceLabel } from "@/lib/format";
import type { ProviderProfile, Service } from "@/lib/types";
import { SmartImage } from "./smart-image";
import { cn } from "@/lib/utils";

export function DeliveryBadge({ service, className }: { service: Service; className?: string }) {
  if (service.delivery === "etana") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm",
          className,
        )}
      >
        <Globe2 className="size-3" /> Etätyö
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm",
        className,
      )}
    >
      <MapPin className="size-3" /> {service.city}
      {service.radiusKm ? ` +${service.radiusKm} km` : ""}
    </span>
  );
}

export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", className)}>
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      {rating.toLocaleString("fi-FI", { minimumFractionDigits: 1 })}
    </span>
  );
}

export function ServiceCard({ service, className }: { service: Service; className?: string }) {
  const { db } = useData();
  const provider = db.providers.find((p) => p.id === service.providerId);
  const cat = categoryById(service.category);
  if (!provider) return null;

  return (
    <Link
      to={`/palvelu/${service.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SmartImage
          src={service.images[0] ?? cat?.image}
          alt={service.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-foreground/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          {cat?.label}
        </span>
        <DeliveryBadge service={service} className="absolute right-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Avatar className="size-6 rounded-md">
            <AvatarImage src={provider.avatarUrl} />
            <AvatarFallback className="rounded-md bg-brand-100 text-[10px] font-bold text-brand-700">
              {initials(provider.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs font-medium text-muted-foreground">{provider.name}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight group-hover:text-primary">
          {service.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">
              {service.rating.toLocaleString("fi-FI", { minimumFractionDigits: 1 })}
            </span>
            ({service.reviewCount})
          </span>
          <span className="text-sm font-bold tracking-tight text-foreground">{priceLabel(service)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ProviderChip({ provider, className }: { provider: ProviderProfile; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Avatar className="size-6 rounded-md">
        <AvatarImage src={provider.avatarUrl} />
        <AvatarFallback className="rounded-md bg-brand-100 text-[10px] font-bold text-brand-700">
          {initials(provider.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{provider.name}</span>
    </span>
  );
}

export function PaymentModeBadges({ modes, className }: { modes: Service["paymentModes"]; className?: string }) {
  return (
    <span className={cn("flex flex-wrap gap-1.5", className)}>
      {modes.includes("alusta") && (
        <Badge variant="brand" className="rounded-full font-medium">
          Maksu alustan kautta
        </Badge>
      )}
      {modes.includes("ulkopuolella") && (
        <Badge variant="outline" className="rounded-full font-medium">
          Maksu alustan ulkopuolella
        </Badge>
      )}
    </span>
  );
}
