import { useEffect, useRef, useState } from "react";
import { Check, Copy, Heart, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { roomLink, type BoothStatus } from "../lib/booth";
import { HomeButton } from "./HomeButton";

interface Props {
  roomId: string;
  isHost: boolean;
  status: BoothStatus;
  localStream: MediaStream | null;
  onHome: () => void;
}

export function WaitingRoom({ roomId, isHost, status, localStream, onHome }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);
  const link = roomLink(roomId);

  useEffect(() => {
    if (videoRef.current && localStream) videoRef.current.srcObject = localStream;
  }, [localStream]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback for restricted clipboard environments
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success("Link copied! Send it to your favorite person 💌");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="relative min-h-screen bg-background flex items-center justify-center px-6 py-12"
      style={{ backgroundImage: "radial-gradient(rgba(60,50,45,0.10) 1.4px, transparent 1.4px)", backgroundSize: "22px 22px" }}
    >
      <div className="absolute left-6 top-6">
        <HomeButton onClick={onHome} />
      </div>
      <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 shadow-sm text-center">
        <div className="relative mx-auto mb-6 aspect-[4/3] w-full overflow-hidden rounded-3xl bg-cream-deep">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover -scale-x-100" />
          <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-ink" style={{ fontSize: "0.75rem" }}>
            You
          </span>
        </div>

        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="mx-auto mb-4 inline-flex rounded-full bg-blush-soft p-3 text-rose"
        >
          <Heart size={22} />
        </motion.div>

        <h1 className="text-ink" style={{ fontSize: "1.8rem" }}>
          {status === "connected" ? "Connected!" : "Waiting for your partner…"}
        </h1>
        <p className="mt-2 text-ink-soft" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
          {status === "connected"
            ? "Stepping into the studio together."
            : isHost
            ? "Send this link to the person you want to pose with."
            : "Hang tight — connecting you to the room."}
        </p>

        {isHost && status !== "connected" && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-input-background p-2">
            <span className="flex-1 truncate px-2 text-left text-ink-soft" style={{ fontSize: "0.85rem" }}>
              {link}
            </span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-primary-foreground transition-colors hover:brightness-105"
              style={{ fontSize: "0.85rem" }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {status !== "connected" && (
          <div className="mt-6 inline-flex items-center gap-2 text-ink-soft" style={{ fontSize: "0.85rem" }}>
            <Loader2 size={16} className="animate-spin" />
            {isHost ? "Room is live" : "Dialing in…"}
          </div>
        )}
      </div>
    </div>
  );
}
