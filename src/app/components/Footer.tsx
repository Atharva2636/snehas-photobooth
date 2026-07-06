import { Instagram } from "lucide-react";
import { FOOTER_COPY, INSTAGRAM_URL } from "../lib/booth";
import logo from "../../imports/656773709_18072208436288704_9063116031077012413_n.jpg";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-cream-deep/60">
      <div className="mx-auto max-w-4xl px-6 py-8 flex flex-col items-center gap-4 text-center">
        <ImageWithFallback
          src={logo}
          alt="Nichepicks — blue star logo"
          className="h-16 w-16 rounded-full object-cover shadow-sm"
        />
        <p className="max-w-2xl text-ink-soft" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
          {FOOTER_COPY}
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-ink transition-colors hover:bg-blush-soft"
          style={{ fontSize: "0.9rem" }}
        >
          <Instagram size={18} />
          @nichepickss
        </a>
      </div>
    </footer>
  );
}
