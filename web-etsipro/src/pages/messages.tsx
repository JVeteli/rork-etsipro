import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/lib/store";
import { formatMessageTime, initials } from "@/lib/format";
import type { Thread, User } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { db, sessionUser, sendMessage, markThreadRead } = useData();
  const [params, setParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const user = sessionUser;

  const threads = useMemo(() => {
    if (!user) return [];
    return db.threads
      .filter((t) => t.participantIds.includes(user.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [db.threads, user]);

  const activeId = params.get("t");
  const active = threads.find((t) => t.id === activeId) ?? threads[0] ?? null;

  useEffect(() => {
    if (active && user) markThreadRead(active.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.messages.length, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  if (!user) {
    return <Navigate to="/kirjaudu" state={{ from: "/viestit" }} replace />;
  }

  const userById = (id: string): User | undefined => db.users.find((u) => u.id === id);

  const threadTitle = (t: Thread): string => {
    const service = t.serviceId ? db.services.find((s) => s.id === t.serviceId) : undefined;
    if (service) return service.title;
    const other = t.participantIds.find((id) => id !== user.id);
    return other ? (userById(other)?.name ?? "Keskustelu") : "Keskustelu";
  };

  const threadAvatar = (t: Thread): string | undefined => {
    const other = t.participantIds.find((id) => id !== user.id);
    const otherUser = other ? userById(other) : undefined;
    if (otherUser?.providerId) {
      return db.providers.find((p) => p.id === otherUser.providerId)?.avatarUrl;
    }
    return undefined;
  };

  const unreadFor = (t: Thread): number =>
    Math.max(0, t.messages.length - (t.readCount[user.id] ?? 0));

  const submit = () => {
    const text = draft.trim();
    if (!text || !active) return;
    sendMessage(active.id, text);
    setDraft("");
  };

  const listPane = (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <h1 className="font-display text-xl font-semibold tracking-tight">Viestit</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Varauspyynnöt ja sopiminen yhdessä paikassa.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <MessageCircle className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Ei viestejä vielä. Varaa palvelu, niin viestiketju avautuu automaattisesti.
            </p>
            <Button variant="outline" className="mt-2 rounded-xl" asChild>
              <Link to="/selaa">Selaa palveluita</Link>
            </Button>
          </div>
        )}
        {threads.map((t) => {
          const last = t.messages[t.messages.length - 1];
          const lastAuthor = last ? userById(last.authorId) : undefined;
          const unread = unreadFor(t);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setParams({ t: t.id });
                setMobileOpen(false);
              }}
              className={cn(
                "flex w-full items-start gap-3 border-b px-4 py-3.5 text-left transition-colors hover:bg-muted/60",
                active?.id === t.id && "bg-accent/60 hover:bg-accent/60",
              )}
            >
              <Avatar className="mt-0.5 size-10 rounded-xl">
                <AvatarImage src={threadAvatar(t)} />
                <AvatarFallback className="rounded-xl bg-brand-100 text-xs font-bold text-brand-700">
                  {initials(threadTitle(t))}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm font-semibold", unread === 0 && "font-medium")}>
                    {threadTitle(t)}
                  </span>
                  {last && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatMessageTime(last.createdAt)}
                    </span>
                  )}
                </span>
                {last && (
                  <span className={cn("mt-0.5 block truncate text-xs", unread > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {last.system ? (
                      <span className="text-brand-700">{last.text}</span>
                    ) : (
                      <>
                        {last.authorId === user.id ? "Sinä: " : `${lastAuthor?.name.split(" ")[0]}: `}
                        {last.text}
                      </>
                    )}
                  </span>
                )}
              </span>
              {unread > 0 && (
                <span className="mt-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const chatPane = (
    <div className="flex h-full min-w-0 flex-col">
      {active ? (
        <>
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Avatar className="size-9 rounded-xl">
              <AvatarImage src={threadAvatar(active)} />
              <AvatarFallback className="rounded-xl bg-brand-100 text-xs font-bold text-brand-700">
                {initials(threadTitle(active))}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{threadTitle(active)}</p>
              {active.serviceId && (
                <Link
                  to={`/palvelu/${active.serviceId}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Katso palvelu
                </Link>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-4 py-5">
            {active.messages.map((m) => {
              if (m.system) {
                return (
                  <div key={m.id} className="flex justify-center">
                    <span className="max-w-md rounded-full bg-brand-50 px-4 py-1.5 text-center text-[11px] font-medium leading-relaxed text-brand-700">
                      {m.text}
                    </span>
                  </div>
                );
              }
              const mine = m.authorId === user.id;
              const author = userById(m.authorId);
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border/70 bg-white text-foreground",
                    )}
                  >
                    {!mine && <p className="mb-0.5 text-[11px] font-semibold text-muted-foreground">{author?.name}</p>}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className={cn("mt-1 text-right text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {formatMessageTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="border-t bg-white p-3">
            <div className="flex items-end gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
                placeholder="Kirjoita viesti…"
                className="rounded-xl"
              />
              <Button size="icon" className="size-11 shrink-0 rounded-xl shadow-cta" onClick={submit} aria-label="Lähetä">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <MessageCircle className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Valitse viestiketju aloittaaksesi.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-0 py-0 sm:px-4 sm:py-8 lg:px-6">
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden sm:h-[calc(100vh-8rem)] sm:rounded-2xl sm:border sm:border-border/70 sm:shadow-card">
        <aside className={cn("w-full border-r bg-white sm:w-80 lg:w-96", mobileOpen ? "block" : "hidden sm:block")}>
          {listPane}
        </aside>
        <main className={cn("min-w-0 flex-1 bg-white", !mobileOpen ? "block" : "hidden sm:block")}>{chatPane}</main>
      </div>
    </div>
  );
}
