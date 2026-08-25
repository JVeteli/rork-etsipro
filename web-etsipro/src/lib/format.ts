import { format } from "date-fns";
import { fi } from "date-fns/locale";
import type { PricingModel, Service } from "./types";

const nf0 = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });

export const euro = (n: number): string => `${nf0.format(n)} €`;

export const formatDate = (iso: string): string => format(new Date(iso), "d.M.yyyy");

export const formatDateTime = (iso: string): string =>
  format(new Date(iso), "d.M.yyyy HH:mm", { locale: fi });

export const formatMessageTime = (iso: string): string =>
  format(new Date(iso), "d.M. HH:mm", { locale: fi });

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/** Hintateksti palvelukorttiin. */
export function priceLabel(service: Service): string {
  if (service.pricing === "tarjous") return "Tarjouspyyntö";
  if (service.pricing === "tunti") return `alk. ${euro(service.price ?? 0)}/h`;
  return euro(service.price ?? 0);
}

export function priceWithModel(service: Service): string {
  if (service.pricing === "tarjous") return "Tarjouspyyntö";
  if (service.pricing === "tunti") return `${euro(service.price ?? 0)} / tunti`;
  return `Kiinteä hinta ${euro(service.price ?? 0)}`;
}

export const pricingModelLabel = (m: PricingModel): string =>
  m === "tunti" ? "Tuntihinta" : m === "paketti" ? "Kiinteä hinta" : "Tarjouspyyntö";
