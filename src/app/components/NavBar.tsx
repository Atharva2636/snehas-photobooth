import { Camera } from "lucide-react";
import logo from "../../imports/656773709_18072208436288704_9063116031077012413_n.jpg";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Props {
  onOpenStudio?: () => void;
  cta?: string;
}

export function NavBar({ onOpenStudio, cta = "Open Studio" }: Props) {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 shadow-sm">
        <ImageWithFallback src={logo} alt="Nichepicks" className="h-7 w-7 rounded-full object-cover" />
        <span className="text-ink" style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem" }}>
          Sneha&rsquo;s Photobooth
        </span>
      </div>

      <div className="hidden items-center gap-7 text-ink-soft sm:flex" style={{ fontSize: "0.9rem" }}>
        <a href="https://www.instagram.com/nichepickss" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
          Nichepicks
        </a>
        <span className="text-ink">How it works</span>
      </div>

      {onOpenStudio && (
        <button
          onClick={onOpenStudio}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-cream transition-all hover:brightness-110"
          style={{ fontSize: "0.9rem" }}
        >
          <Camera size={16} />
          {cta}
        </button>
      )}
    </nav>
  );
}
