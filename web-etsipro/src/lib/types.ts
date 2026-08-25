export type CategoryId =
  | "koti"
  | "digi"
  | "hyvinvointi"
  | "tapahtumat"
  | "kuljetus"
  | "opetus"
  | "muut";

export type DeliveryMode = "paikan_paalla" | "etana";
export type PricingModel = "tunti" | "paketti" | "tarjous";
export type PaymentMode = "alusta" | "ulkopuolella";
export type OrderStatus = "sovitaan" | "maksettu" | "valmis" | "peruttu";
export type Role = "asiakas" | "tarjoaja";

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ProviderProfile {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  avatarUrl?: string;
  bannerUrl?: string;
  city: string;
  languages: string[];
  experienceYears: number;
  categories: CategoryId[];
  rating: number;
  reviewCount: number;
  joinedYear: number;
  social: SocialLinks;
  certifications: string[];
  faq: FaqItem[];
  portfolioImages: string[];
  videoUrl?: string;
  isCompany?: boolean;
}

export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: CategoryId;
  delivery: DeliveryMode;
  pricing: PricingModel;
  /** Euron hinta. null = tarjouspyyntö */
  price: number | null;
  paymentModes: PaymentMode[];
  city?: string;
  radiusKm?: number;
  images: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  providerId?: string;
}

export interface Order {
  id: string;
  serviceId: string;
  providerId: string;
  customerId: string;
  channel: PaymentMode;
  status: OrderStatus;
  amount: number | null;
  notes: string;
  createdAt: string;
  threadId: string;
}

export interface Message {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  system?: boolean;
}

export interface Thread {
  id: string;
  orderId?: string;
  serviceId?: string;
  participantIds: string[];
  messages: Message[];
  updatedAt: string;
  /** viimeksi luettu viestimäärä käyttäjää kohden (lukemattomien laskentaan) */
  readCount: Record<string, number>;
}

export interface DB {
  users: User[];
  providers: ProviderProfile[];
  services: Service[];
  orders: Order[];
  threads: Thread[];
}

export interface BookingInput {
  serviceId: string;
  channel: PaymentMode;
  notes: string;
  date?: string;
  amount?: number | null;
}

export interface NewProviderInput {
  name: string;
  email: string;
  password: string;
  city: string;
  tagline: string;
  bio: string;
  languages: string[];
  experienceYears: number;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface NewServiceInput {
  title: string;
  description: string;
  category: CategoryId;
  delivery: DeliveryMode;
  pricing: PricingModel;
  price: number | null;
  paymentModes: PaymentMode[];
  city?: string;
  radiusKm?: number;
  imageUrl?: string;
}
