import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Camera, Loader2, Sliders, LayoutGrid, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { FILTERS, TEMPLATES, type Filter, type Template } from "../lib/booth";
import { composeStrip, grabFrame, type Pair } from "../lib/compose";
import type { BoothMessage } from "../lib/usePeerBooth";

interface Props {
  isHost: boolean;
  connected: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  placeholder?: boolean;
  sendData: (m: BoothMessage) => void;
  onMessageRef: MutableRefObject<((m: BoothMessage) => void) | undefined>;
  onComplete: (canvas: HTMLCanvasElement, template: Template, filter: Filter, pairs: Pair[]) => void;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Soft staggered fade-in for items inside the toolbar drawers.
const drawerItem = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 0.61, 0.36, 1] as const },
});

export function Studio({ isHost, connected, localStream, remoteStream, placeholder, sendData, onMessageRef, onComplete }: Props) {
  const myVideo = useRef<HTMLVideoElement>(null);
  const partnerVideo = useRef<HTMLVideoElement>(null);

  const [template, setTemplate] = useState<Template>(TEMPLATES[0]);
  const [filter, setFilter] = useState<Filter>(FILTERS[1]);
  const [tab, setTab] = useState<"layout" | "filter">("layout");

  const [capturing, setCapturing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [shot, setShot] = useState(0);
  const [flash, setFlash] = useState(false);

  const partnerFrames = useRef<Record<number, string>>({});
  const remoteApply = useRef(false);

  const myRole: "self" | "partner" = isHost ? "self" : "partner";

  useEffect(() => {
    if (myVideo.current && localStream) myVideo.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (partnerVideo.current && remoteStream) partnerVideo.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Register the P2P message handler.
  useEffect(() => {
    onMessageRef.current = (msg: BoothMessage) => {
      if (msg.type === "config") {
        remoteApply.current = true;
        const t = TEMPLATES.find((x) => x.id === msg.template);
        const f = FILTERS.find((x) => x.id === msg.filter);
        if (t) setTemplate(t);
        if (f) setFilter(f);
        setTimeout(() => (remoteApply.current = false), 0);
      } else if (msg.type === "start") {
        const t = TEMPLATES.find((x) => x.id === msg.template) ?? template;
        const f = FILTERS.find((x) => x.id === msg.filter) ?? filter;
        runSequence(t, f, false);
      } else if (msg.type === "frame") {
        partnerFrames.current[msg.index as number] = msg.data as string;
      }
    };
    return () => {
      onMessageRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, filter]);

  // Broadcast config changes to the partner so both strips stay identical.
  useEffect(() => {
    if (remoteApply.current) return;
    sendData({ type: "config", template: template.id, filter: filter.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, filter]);

  const waitForPartnerFrame = async (i: number): Promise<string> => {
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      if (partnerFrames.current[i]) return partnerFrames.current[i];
      await wait(80);
    }
    // Fallback: reuse own frame if partner never arrives.
    return grabFrame(myVideo.current!);
  };

  const runSequence = async (tpl: Template, flt: Filter, initiator: boolean) => {
    if (capturing) return;
    partnerFrames.current = {};
    setCapturing(true);
    if (initiator) sendData({ type: "start", template: tpl.id, filter: flt.id });

    const selfFrames: string[] = [];
    const otherFrames: string[] = [];

    for (let i = 0; i < tpl.cuts; i++) {
      setShot(i + 1);
      for (const n of [3, 2, 1]) {
        setCount(n);
        await wait(850);
      }
      setCount(null);
      setFlash(true);
      await wait(140);

      const mine = grabFrame(myVideo.current!);
      sendData({ type: "frame", index: i, data: mine });

      let partner: string;
      if (connected && remoteStream) {
        partner = await waitForPartnerFrame(i);
      } else {
        partner = mine; // solo mode fallback
      }
      selfFrames[i] = mine;
      otherFrames[i] = partner;

      setFlash(false);
      await wait(550);
    }

    // Host frames sit on the left, guest frames on the right (identical on both devices).
    const pairs: Pair[] = tpl.cuts
      ? Array.from({ length: tpl.cuts }, (_, i) =>
          myRole === "self"
            ? { self: selfFrames[i], partner: otherFrames[i] }
            : { self: otherFrames[i], partner: selfFrames[i] }
        )
      : [];

    const canvas = await composeStrip({ template: tpl, filter: flt, pairs, stickers: [] });
    setCapturing(false);
    setShot(0);
    onComplete(canvas, tpl, flt, pairs);
  };

  const CamStage = ({ videoRef, label, mirror, live, note }: { videoRef: React.RefObject<HTMLVideoElement>; label: string; mirror: boolean; live: boolean; note?: string }) => (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-cream-deep shadow-sm"
      style={{ filter: filter.css }}
    >
      {live ? (
        <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${mirror ? "-scale-x-100" : ""}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-soft" style={{ filter: "none" }}>
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={26} className="animate-spin" />
            <span style={{ fontSize: "0.85rem" }}>waiting for partner…</span>
          </div>
        </div>
      )}
      <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-ink" style={{ fontSize: "0.75rem", filter: "none" }}>
        {label}
      </span>
      {note && (
        <motion.span
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-clay"
          style={{ fontSize: "0.72rem", filter: "none" }}
        >
          <Camera size={13} />
          {note}
        </motion.span>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: "radial-gradient(rgba(60,50,45,0.10) 1.4px, transparent 1.4px)", backgroundSize: "22px 22px" }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <h1 className="text-ink" style={{ fontSize: "1.5rem" }}>Sneha&rsquo;s Photobooth</h1>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${connected ? "bg-sage/50 text-ink" : "bg-blush-soft text-clay"}`}
          style={{ fontSize: "0.8rem" }}
        >
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connected ? "Partner connected" : "Solo preview"}
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="relative">
          <div className="grid gap-5 lg:grid-cols-2">
            <CamStage videoRef={myVideo} label="You" mirror live={!!localStream} note={placeholder ? "Webcam active on live deployment" : undefined} />
            <CamStage videoRef={partnerVideo} label="Partner" mirror={false} live={!!remoteStream} />
          </div>

          {/* Synchronized countdown / flash overlay */}
          <AnimatePresence>
            {capturing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                {flash && <div className="absolute inset-0 rounded-3xl bg-white/85" />}
                {count !== null && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.6, opacity: 0 }}
                    className="text-ink"
                    style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(6rem,18vw,12rem)", fontWeight: 600, textShadow: "0 4px 30px rgba(255,255,255,0.9)" }}
                  >
                    {count}
                  </motion.span>
                )}
                {shot > 0 && (
                  <span className="absolute top-4 rounded-full bg-white/85 px-4 py-1 text-ink" style={{ fontSize: "0.9rem" }}>
                    Shot {shot} of {template.cuts}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toolbar */}
        <div className="mt-6 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex gap-2">
            <ToolTab active={tab === "layout"} onClick={() => setTab("layout")} icon={LayoutGrid} label="Templates" />
            <ToolTab active={tab === "filter"} onClick={() => setTab("filter")} icon={Sliders} label="Filters" />
          </div>

          {tab === "layout" && (
            <div className="flex flex-wrap gap-3">
              {TEMPLATES.map((t, i) => (
                <motion.button
                  key={t.id}
                  {...drawerItem(i)}
                  disabled={capturing}
                  onClick={() => setTemplate(t)}
                  className={`flex-1 min-w-[150px] rounded-2xl border p-4 text-left transition-colors ${
                    template.id === t.id ? "border-primary bg-blush-soft" : "border-border bg-background hover:bg-cream-deep"
                  } disabled:opacity-50`}
                >
                  <div className="text-ink" style={{ fontSize: "1rem" }}>{t.name}</div>
                  <div className="mt-1 text-ink-soft" style={{ fontSize: "0.8rem" }}>{t.label}</div>
                </motion.button>
              ))}
            </div>
          )}

          {tab === "filter" && (
            <div className="flex flex-wrap gap-3">
              {FILTERS.map((f, i) => (
                <motion.button
                  key={f.id}
                  {...drawerItem(i)}
                  disabled={capturing}
                  onClick={() => setFilter(f)}
                  className={`rounded-2xl border px-5 py-3 transition-colors ${
                    filter.id === f.id ? "border-primary bg-blush-soft" : "border-border bg-background hover:bg-cream-deep"
                  } disabled:opacity-50`}
                  style={{ fontSize: "0.9rem" }}
                >
                  {f.name}
                </motion.button>
              ))}
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <button
              onClick={() => runSequence(template, filter, true)}
              disabled={capturing || !localStream}
              className="inline-flex items-center gap-3 rounded-full bg-primary px-9 py-4 text-primary-foreground shadow-sm transition-all hover:brightness-105 disabled:opacity-60"
              style={{ fontSize: "1.05rem" }}
            >
              {capturing ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
              {capturing ? "Say cheese…" : `Capture ${template.cuts}-cut strip`}
            </button>
          </div>
          {!connected && (
            <p className="mt-3 text-center text-ink-soft" style={{ fontSize: "0.8rem" }}>
              No partner yet. You can still take a solo strip to try it out.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function ToolTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof LayoutGrid; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-background text-ink-soft hover:bg-cream-deep"
      }`}
      style={{ fontSize: "0.9rem" }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
