import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RotateCcw, RotateCw, Share2, Trash2, Maximize2 } from "lucide-react";
import { motion } from "motion/react";
import {
  FRAME_COLORS,
  STICKERS,
  svgToDataUrl,
  type Filter,
  type PlacedSticker,
  type Template,
} from "../lib/booth";
import { composeStrip, type Pair } from "../lib/compose";
import { Footer } from "./Footer";
import { HomeButton } from "./HomeButton";

interface Props {
  template: Template;
  filter: Filter;
  pairs: Pair[];
  onHome: () => void;
  onRetake: () => void;
}

export function ExportScreen({ template, filter, pairs, onHome, onRetake }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [dims, setDims] = useState({ w: 1, h: 1 });
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [frameColor, setFrameColor] = useState<string>(FRAME_COLORS[0].value);
  const dragging = useRef<string | null>(null);

  const selectedSticker = stickers.find((s) => s.uid === selected) ?? null;

  // Compose the underlying strip (stickers are overlaid live on top).
  useEffect(() => {
    let alive = true;
    composeStrip({ template, filter, pairs, stickers: [], frameColor }).then((canvas) => {
      if (!alive) return;
      setBaseUrl(canvas.toDataURL("image/png"));
      setDims({ w: canvas.width, h: canvas.height });
    });
    return () => {
      alive = false;
    };
  }, [template, filter, pairs, frameColor]);

  const addSticker = (id: string) => {
    const uid = `${id}-${Date.now()}`;
    setStickers((s) => [...s, { uid, id, x: 0.5, y: 0.3, scale: 1, rot: 0 }]);
    setSelected(uid);
  };

  const updateSelected = (patch: Partial<PlacedSticker>) =>
    setStickers((s) => s.map((st) => (st.uid === selected ? { ...st, ...patch } : st)));

  const removeSelected = () => {
    setStickers((s) => s.filter((st) => st.uid !== selected));
    setSelected(null);
  };

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
    const canvas = await composeStrip({ template, filter, pairs, stickers, frameColor });
    const url = canvas.toDataURL("image/png"); // uncompressed PNG at native resolution
    const a = document.createElement("a");
    a.href = url;
    a.download = `snehas-photobooth-${Date.now()}.png`;
    a.click();
  };

  const share = async () => {
    try {
      const canvas = await composeStrip({ template, filter, pairs, stickers, frameColor });
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
    <div className="booth-bg min-h-screen">
      <div className="mx-auto flex max-w-5xl items-center px-6 pt-6">
        <HomeButton onClick={onHome} />
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-6 text-center">
        <p className="text-clay" style={{ fontSize: "0.8rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Nichepicks
        </p>
        {/* Brand header sits above the frame UI, not baked into the strip */}
        <h1 className="mt-1 text-ink" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 600 }}>
          Sneha&rsquo;s Photobooth
        </h1>
        <p className="mt-2 text-ink-soft">Decorate your strip, then keep it forever.</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-8 px-6 lg:grid-cols-[1fr_300px]">
        {/* Strip preview with draggable stickers */}
        <div className="flex justify-center">
          <div
            ref={stageRef}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-md"
            style={{ aspectRatio: `${dims.w} / ${dims.h}`, touchAction: "none" }}
            onPointerDown={() => setSelected(null)}
          >
            {baseUrl && <img src={baseUrl} alt="Your photo strip" className="h-full w-full select-none" draggable={false} />}
            {stickers.map((st) => {
              const def = STICKERS.find((d) => d.id === st.id)!;
              const widthPct = (150 * st.scale) / dims.w * 100;
              const isSel = st.uid === selected;
              return (
                <img
                  key={st.uid}
                  src={svgToDataUrl(def.svg)}
                  alt={def.name}
                  draggable={false}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelected(st.uid);
                    dragging.current = st.uid;
                  }}
                  className={`absolute cursor-grab touch-none select-none active:cursor-grabbing ${
                    isSel ? "rounded-sm outline outline-2 outline-primary/70" : ""
                  }`}
                  style={{
                    left: `${st.x * 100}%`,
                    top: `${st.y * 100}%`,
                    width: `${widthPct}%`,
                    transform: `translate(-50%, -50%) rotate(${st.rot}deg)`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div>
          {/* Frame color */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-ink" style={{ fontSize: "1.05rem" }}>Frame color</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {FRAME_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFrameColor(c.value)}
                  title={c.name}
                  className={`h-9 w-9 rounded-full border transition-transform hover:scale-105 ${
                    frameColor === c.value ? "border-primary ring-2 ring-primary/40" : "border-border"
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Sticker adjuster (shown when a sticker is selected) */}
          {selectedSticker && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-ink" style={{ fontSize: "1.05rem" }}>
                  <Maximize2 size={16} /> Adjust sticker
                </h3>
                <button onClick={removeSelected} className="inline-flex items-center gap-1 text-destructive" style={{ fontSize: "0.8rem" }}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <label className="mt-4 block text-ink-soft" style={{ fontSize: "0.8rem" }}>Size</label>
              <input
                type="range"
                min={0.4}
                max={2.6}
                step={0.02}
                value={selectedSticker.scale}
                onChange={(e) => updateSelected({ scale: parseFloat(e.target.value) })}
                className="mt-1 w-full accent-primary"
              />

              <div className="mt-3 flex items-center justify-between">
                <label className="text-ink-soft" style={{ fontSize: "0.8rem" }}>Rotate</label>
                <div className="flex gap-1">
                  <button onClick={() => updateSelected({ rot: selectedSticker.rot - 15 })} className="rounded-lg bg-background p-1.5 text-ink-soft hover:bg-cream-deep" aria-label="Rotate left">
                    <RotateCcw size={15} />
                  </button>
                  <button onClick={() => updateSelected({ rot: selectedSticker.rot + 15 })} className="rounded-lg bg-background p-1.5 text-ink-soft hover:bg-cream-deep" aria-label="Rotate right">
                    <RotateCw size={15} />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={selectedSticker.rot}
                onChange={(e) => updateSelected({ rot: parseInt(e.target.value, 10) })}
                className="mt-1 w-full accent-primary"
              />
            </motion.div>
          )}

          {/* Sticker tray */}
          <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-ink" style={{ fontSize: "1.05rem" }}>Stickers</h3>
            <p className="mt-1 text-ink-soft" style={{ fontSize: "0.8rem" }}>Tap to add · drag to place · tap to adjust</p>
            <div className="mt-4 grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1">
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
                onClick={() => {
                  setStickers([]);
                  setSelected(null);
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-background py-2 text-ink-soft transition-colors hover:bg-cream-deep"
                style={{ fontSize: "0.85rem" }}
              >
                <Trash2 size={15} /> Clear stickers
              </button>
            )}
          </div>

          {/* Actions */}
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
