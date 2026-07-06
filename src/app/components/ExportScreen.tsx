import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RotateCcw, Share2, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { STICKERS, svgToDataUrl, type Filter, type PlacedSticker, type Template } from "../lib/booth";
import { composeStrip, type Pair } from "../lib/compose";
import { Footer } from "./Footer";

interface Props {
  template: Template;
  filter: Filter;
  pairs: Pair[];
  onRetake: () => void;
}

export function ExportScreen({ template, filter, pairs, onRetake }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [dims, setDims] = useState({ w: 1, h: 1 });
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const dragging = useRef<string | null>(null);

  // Compose the underlying strip once (without stickers — those are overlaid live).
  useEffect(() => {
    let alive = true;
    composeStrip({ template, filter, pairs, stickers: [] }).then((canvas) => {
      if (!alive) return;
      setBaseUrl(canvas.toDataURL("image/png"));
      setDims({ w: canvas.width, h: canvas.height });
    });
    return () => {
      alive = false;
    };
  }, [template, filter, pairs]);

  const addSticker = (id: string) =>
    setStickers((s) => [...s, { uid: `${id}-${Date.now()}`, id, x: 0.5, y: 0.3, scale: 1 }]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setStickers((s) => s.map((st) => (st.uid === dragging.current ? { ...st, x, y } : st)));
  }, []);

  useEffect(() => {
    const up = () => (dragging.current = null);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", up);
    };
  }, [onPointerMove]);

  const download = async () => {
    const canvas = await composeStrip({ template, filter, pairs, stickers });
    const url = canvas.toDataURL("image/png"); // uncompressed PNG at native resolution
    const a = document.createElement("a");
    a.href = url;
    a.download = `snehas-photobooth-${Date.now()}.png`;
    a.click();
  };

  const share = async () => {
    try {
      const canvas = await composeStrip({ template, filter, pairs, stickers });
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const file = new File([blob], "snehas-photobooth.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Sneha's Photobooth", text: "Made with Nichepicks 💌" });
      } else {
        await download();
      }
    } catch {
      /* share cancelled */
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: "radial-gradient(rgba(60,50,45,0.10) 1.4px, transparent 1.4px)", backgroundSize: "22px 22px" }}
    >
      <div className="mx-auto max-w-5xl px-6 pt-10 text-center">
        <h1 className="text-ink" style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 600 }}>
          Your strip is ready
        </h1>
        <p className="mt-2 text-ink-soft">Decorate it with stickers, then keep it forever.</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-8 px-6 lg:grid-cols-[1fr_280px]">
        {/* Strip preview with draggable stickers */}
        <div className="flex justify-center">
          <div
            ref={stageRef}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-md"
            style={{ aspectRatio: `${dims.w} / ${dims.h}`, touchAction: "none" }}
          >
            {baseUrl && <img src={baseUrl} alt="Your photo strip" className="h-full w-full select-none" draggable={false} />}
            {stickers.map((st) => {
              const def = STICKERS.find((d) => d.id === st.id)!;
              return (
                <img
                  key={st.uid}
                  src={svgToDataUrl(def.svg)}
                  alt={def.name}
                  draggable={false}
                  onPointerDown={() => (dragging.current = st.uid)}
                  className="absolute cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${st.x * 100}%`,
                    top: `${st.y * 100}%`,
                    width: "18%",
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Sticker tray + actions */}
        <div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-ink" style={{ fontSize: "1.05rem" }}>Stickers</h3>
            <p className="mt-1 text-ink-soft" style={{ fontSize: "0.8rem" }}>Tap to add · drag to place</p>
            <div className="mt-4 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto pr-1">
              {STICKERS.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.03, ease: [0.22, 0.61, 0.36, 1] }}
                  onClick={() => addSticker(s.id)}
                  className="aspect-square rounded-xl border border-border bg-background p-2 transition-colors hover:bg-blush-soft"
                  title={s.name}
                >
                  <img src={svgToDataUrl(s.svg)} alt={s.name} className="h-full w-full" />
                </motion.button>
              ))}
            </div>
            {stickers.length > 0 && (
              <button
                onClick={() => setStickers([])}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-background py-2 text-ink-soft transition-colors hover:bg-cream-deep"
                style={{ fontSize: "0.85rem" }}
              >
                <Trash2 size={15} /> Clear stickers
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={download}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-primary-foreground shadow-sm transition-all hover:brightness-105"
            >
              <Download size={20} /> Download High-Res HQ
            </button>
            <button
              onClick={share}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-ink transition-colors hover:bg-cream-deep"
            >
              <Share2 size={18} /> Share
            </button>
            <button
              onClick={onRetake}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-transparent px-6 py-3 text-ink-soft transition-colors hover:bg-cream-deep"
            >
              <RotateCcw size={18} /> Take another
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
