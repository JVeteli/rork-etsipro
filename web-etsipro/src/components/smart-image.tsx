import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/** Kuva, joka näyttää siistin gradientti-fallbackin jos lataus epäonnistuu. */
export function SmartImage({ src, alt, className, fallbackClassName }: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200",
          className,
          fallbackClassName,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="size-8 text-slate-300" strokeWidth={1.5} />
      </div>
    );
  }

  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}
