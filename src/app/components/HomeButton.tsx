import { ArrowLeft } from "lucide-react";

interface Props {
  onClick: () => void;
  className?: string;
}

/** Minimal "Back to Home" control. Cleanup (streams/peer) happens on route away. */
export function HomeButton({ onClick, className = "" }: Props) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-ink-soft shadow-sm transition-colors hover:bg-cream-deep hover:text-ink ${className}`}
      style={{ fontSize: "0.85rem" }}
      aria-label="Back to home"
    >
      <ArrowLeft size={16} />
      Back to Home
    </button>
  );
}
