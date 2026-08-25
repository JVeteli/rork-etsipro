import { cn } from "@/lib/utils";

/** EtsiPRO-logo: suurennuslasi + valintamerkki. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-primary shadow-cta",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="6" />
        <path d="m14.5 14.5 5 5" />
        <path d="M13 5.5 15 7.5l3.5-3" />
      </svg>
    </span>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="text-lg font-bold tracking-tight text-foreground">
        Etsi<span className="text-primary">PRO</span>
      </span>
    </span>
  );
}
