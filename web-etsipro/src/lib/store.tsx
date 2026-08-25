import { useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { toast } from "sonner";
import type {
  BookingInput,
  DB,
  NewProviderInput,
  NewServiceInput,
  Order,
  OrderStatus,
  ProviderProfile,
  Role,
  Service,
  User,
} from "./types";
import { buildSeed } from "./seed";

const DB_KEY = "etsipro_db_v1";
const SESSION_KEY = "etsipro_session_v1";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* vaurioitunut tallennus -> aloitetaan alusta */
  }
  return buildSeed();
}

function loadSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Koko sovelluksen tila ja toimintalogiikka.
 * Demo-versiossa data säilyy selaimen localStorageen.
 */
const [DataProvider, useData] = createContextHook(() => {
  const [db, setDb] = useState<DB>(loadDB);
  const [sessionUserId, setSessionUserId] = useState<string | null>(loadSession);

  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      /* tallennustila täynnä – demo jatkaa muistissa */
    }
  }, [db]);

  useEffect(() => {
    try {
      if (sessionUserId) localStorage.setItem(SESSION_KEY, sessionUserId);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ei kriittistä */
    }
  }, [sessionUserId]);

  const api = useMemo(() => {
    const sessionUser: User | null = db.users.find((u) => u.id === sessionUserId) ?? null;

    const setSession = (id: string | null) => setSessionUserId(id);

    const signIn = (email: string, password: string): { ok: boolean; error?: string } => {
      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
      );
      if (!user) return { ok: false, error: "Sähköposti tai salasana on virheellinen." };
      setSession(user.id);
      return { ok: true };
    };

    const signOut = () => setSession(null);

    const registerCustomer = (name: string, email: string, password: string): string => {
      const id = uid("u");
      const user: User = { id, name, email, password, role: "asiakas" };
      setDb((d) => ({ ...d, users: [...d.users, user] }));
      setSession(id);
      return id;
    };

    /** Luo toimittajatili, profiilin ja halutessa ensimmäisen palvelun. */
    const registerProvider = (
      input: NewProviderInput,
      service?: NewServiceInput,
    ): { userId: string; providerId: string; serviceId?: string } => {
      const providerId = uid("p");
      const userId = uid("u");
      const provider: ProviderProfile = {
        id: providerId,
        name: input.name,
        tagline: input.tagline || "Ammattilainen palveluksessasi.",
        bio: input.bio || "",
        avatarUrl: input.avatarUrl || undefined,
        bannerUrl: input.bannerUrl || undefined,
        city: input.city,
        languages: input.languages.length ? input.languages : ["suomi"],
        experienceYears: input.experienceYears,
        categories: service ? [service.category] : [],
        rating: 5,
        reviewCount: 0,
        joinedYear: new Date().getFullYear(),
        social: {},
        certifications: [],
        faq: [],
        portfolioImages: service?.imageUrl ? [service.imageUrl] : [],
      };
      const user: User = {
        id: userId,
        name: input.name,
        email: input.email,
        password: input.password,
        role: "tarjoaja",
        providerId,
      };

      let serviceId: string | undefined;
      let services = db.services;
      if (service) {
        serviceId = uid("s");
        services = [
          ...db.services,
          {
            id: serviceId,
            providerId,
            title: service.title,
            description: service.description,
            category: service.category,
            delivery: service.delivery,
            pricing: service.pricing,
            price: service.price,
            paymentModes: service.paymentModes,
            city: service.city,
            radiusKm: service.radiusKm,
            images: service.imageUrl ? [service.imageUrl] : [],
            tags: [],
            rating: 5,
            reviewCount: 0,
          },
        ];
      }

      setDb((d) => ({
        ...d,
        users: [...d.users, user],
        providers: [...d.providers, provider],
        services,
      }));
      setSession(userId);
      return { userId, providerId, serviceId };
    };

    const addService = (input: NewServiceInput): string | null => {
      if (!sessionUser?.providerId) return null;
      const id = uid("s");
      const service: Service = {
        id,
        providerId: sessionUser.providerId,
        title: input.title,
        description: input.description,
        category: input.category,
        delivery: input.delivery,
        pricing: input.pricing,
        price: input.price,
        paymentModes: input.paymentModes,
        city: input.city,
        radiusKm: input.radiusKm,
        images: input.imageUrl ? [input.imageUrl] : [],
        tags: [],
        rating: 5,
        reviewCount: 0,
      };
      setDb((d) => ({ ...d, services: [...d.services, service] }));
      return id;
    };

    const updateService = (id: string, input: NewServiceInput) => {
      setDb((d) => ({
        ...d,
        services: d.services.map((s) =>
          s.id === id
            ? {
                ...s,
                title: input.title,
                description: input.description,
                category: input.category,
                delivery: input.delivery,
                pricing: input.pricing,
                price: input.price,
                paymentModes: input.paymentModes,
                city: input.city,
                radiusKm: input.radiusKm,
                images: input.imageUrl ? [input.imageUrl] : s.images,
              }
            : s,
        ),
      }));
    };

    const deleteService = (id: string) => {
      setDb((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) }));
      toast.success("Palvelu poistettu");
    };

    const updateProvider = (id: string, patch: Partial<ProviderProfile>) => {
      setDb((d) => ({
        ...d,
        providers: d.providers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      toast.success("Profiili tallennettu");
    };

    const findOrCreateDirectThread = (provider: ProviderProfile): string => {
      if (!sessionUser) return "";
      const providerUser = db.users.find((u) => u.providerId === provider.id);
      if (!providerUser) return "";
      const existing = db.threads.find(
        (t) =>
          !t.orderId && t.participantIds.includes(sessionUser.id) && t.participantIds.includes(providerUser.id),
      );
      if (existing) return existing.id;
      const id = uid("t");
      const now = new Date().toISOString();
      setDb((d) => ({
        ...d,
        threads: [
          ...d.threads,
          {
            id,
            participantIds: [sessionUser.id, providerUser.id],
            messages: [
              {
                id: uid("m"),
                authorId: "system",
                text: `Keskustelu aloitettu palveluntarjoajan ${provider.name} kanssa.`,
                createdAt: now,
                system: true,
              },
            ],
            updatedAt: now,
            readCount: { [sessionUser.id]: 1 },
          },
        ],
      }));
      return id;
    };

    /** Luo tilaus ja avaa samalla viestiketjun. */
    const createBooking = (
      input: BookingInput,
    ): { ok: boolean; orderId?: string; threadId?: string; error?: string } => {
      if (!sessionUser) return { ok: false, error: "Kirjaudu sisään varataksesi." };
      const service = db.services.find((s) => s.id === input.serviceId);
      if (!service) return { ok: false, error: "Palvelua ei löytynyt." };
      const providerUser = db.users.find((u) => u.providerId === service.providerId);
      if (!providerUser) return { ok: false, error: "Toimittajan tiliä ei löytynyt." };

      const orderId = uid("o");
      const threadId = uid("t");
      const now = new Date().toISOString();
      const order: Order = {
        id: orderId,
        serviceId: service.id,
        providerId: service.providerId,
        customerId: sessionUser.id,
        channel: input.channel,
        status: input.channel === "alusta" ? "maksettu" : "sovitaan",
        amount: input.channel === "alusta" ? input.amount ?? service.price : null,
        notes: [input.date ? `Toivottu ajankohta: ${input.date}.` : "", input.notes].filter(Boolean).join(" "),
        createdAt: now,
        threadId,
      };
      const systemText =
        input.channel === "alusta"
          ? `Maksu suoritettu alustan kautta – ${order.amount != null ? `${order.amount} €` : "maksu vahvistettu"}. Kiitos tilauksestasi!`
          : `Varauspyyntö lähetetty: ${service.title}. Maksu sovitaan suoraan toimittajan kanssa.`;

      setDb((d) => ({
        ...d,
        orders: [...d.orders, order],
        threads: [
          ...d.threads,
          {
            id: threadId,
            orderId,
            serviceId: service.id,
            participantIds: [sessionUser.id, providerUser.id],
            messages: [
              { id: uid("m"), authorId: "system", text: systemText, createdAt: now, system: true },
              ...(input.notes
                ? [{ id: uid("m"), authorId: sessionUser.id, text: input.notes, createdAt: now }]
                : []),
            ],
            updatedAt: now,
            readCount: { [sessionUser.id]: 2 },
          },
        ],
      }));
      return { ok: true, orderId, threadId };
    };

    const sendMessage = (threadId: string, text: string) => {
      if (!sessionUser) return;
      const now = new Date().toISOString();
      setDb((d) => ({
        ...d,
        threads: d.threads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [...t.messages, { id: uid("m"), authorId: sessionUser.id, text, createdAt: now }],
                updatedAt: now,
                readCount: { ...t.readCount, [sessionUser.id]: t.messages.length + 1 },
              }
            : t,
        ),
      }));
    };

    const markThreadRead = (threadId: string) => {
      if (!sessionUser) return;
      setDb((d) => ({
        ...d,
        threads: d.threads.map((t) =>
          t.id === threadId
            ? { ...t, readCount: { ...t.readCount, [sessionUser.id]: t.messages.length } }
            : t,
        ),
      }));
    };

    const updateOrderStatus = (orderId: string, status: OrderStatus) => {
      setDb((d) => ({ ...d, orders: d.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) }));
      toast.success("Tilauksen tila päivitetty");
    };

    const resetDemo = () => {
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem(SESSION_KEY);
      setDb(buildSeed());
      setSession(null);
      toast.success("Demo-data palautettu alkutilaan");
    };

    const unreadCount = (userId: string | null): number => {
      if (!userId) return 0;
      return db.threads.reduce(
        (sum, t) => sum + Math.max(0, t.messages.length - (t.readCount[userId] ?? 0)),
        0,
      );
    };

    return {
      db,
      sessionUser,
      unread: unreadCount(sessionUser?.id ?? null),
      signIn,
      signOut,
      registerCustomer,
      registerProvider,
      addService,
      updateService,
      deleteService,
      updateProvider,
      findOrCreateDirectThread,
      createBooking,
      sendMessage,
      markThreadRead,
      updateOrderStatus,
      resetDemo,
    };
  }, [db, sessionUserId]);

  return api;
});

export { DataProvider, useData };

export type { Role };
