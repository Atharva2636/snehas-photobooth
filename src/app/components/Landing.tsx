import { Camera, Heart, Star } from "lucide-react";
import { motion } from "motion/react";
import { STICKERS, svgToDataUrl } from "../lib/booth";
import { Footer } from "./Footer";
import { NavBar } from "./NavBar";

interface Props {
  onCreate: () => void;
}

const dotted = {
  backgroundImage: "radial-gradient(rgba(60,50,45,0.10) 1.4px, transparent 1.4px)",
  backgroundSize: "22px 22px",
};

// Scattered scrapbook stickers around the hero, like the reference boards.
const floaters: { key: string; id: string; top: string; left: string; rot: number; size: number }[] = [
  { key: "a", id: "bow", top: "16%", left: "5%", rot: -14, size: 62 },
  { key: "b", id: "heartScribble", top: "9%", left: "24%", rot: 10, size: 46 },
  { key: "c", id: "sparkleGlow", top: "30%", left: "90%", rot: 0, size: 50 },
  { key: "d", id: "heartPink", top: "60%", left: "3%", rot: 8, size: 52 },
  { key: "e", id: "daisy", top: "74%", left: "12%", rot: -8, size: 58 },
  { key: "f", id: "starburst", top: "12%", left: "82%", rot: 6, size: 48 },
  { key: "g", id: "bowCream", top: "80%", left: "86%", rot: 12, size: 60 },
  { key: "h", id: "twinkle", top: "46%", left: "95%", rot: 0, size: 40 },
  { key: "i", id: "bowBrown", top: "88%", left: "50%", rot: -6, size: 44 },
  { key: "j", id: "sparkle", top: "6%", left: "60%", rot: 0, size: 38 },
  { key: "k", id: "heartOutline", top: "68%", left: "94%", rot: -12, size: 46 },
  { key: "l", id: "daisyPink", top: "40%", left: "2%", rot: 10, size: 50 },
];

// Small tilted polaroid frame decorations.
const polaroids: { key: string; top: string; left: string; rot: number; tint: string }[] = [
  { key: "p1", top: "22%", left: "13%", rot: -8, tint: "#f0d6dd" },
  { key: "p2", top: "58%", left: "88%", rot: 7, tint: "#e9d9c3" },
];

// Soft scroll-reveal preset (fade + gentle slide up).
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] as const },
});

export function Landing({ onCreate }: Props) {
  return (
    <div className="min-h-screen bg-background" style={dotted}>
      <NavBar onOpenStudio={onCreate} cta="Open Studio" />

      <section className="relative mx-auto max-w-6xl px-6 pt-6 pb-20">
        {/* Floating decorative stickers */}
        {floaters.map((f, i) => {
          const def = STICKERS.find((s) => s.id === f.id)!;
          return (
            <motion.img
              key={f.key}
              src={svgToDataUrl(def.svg)}
              alt=""
              aria-hidden
              initial={{ opacity: 0, rotate: f.rot }}
              animate={{ opacity: 1, y: [0, -9, 0], rotate: f.rot }}
              transition={{
                opacity: { delay: 0.25 + i * 0.07, duration: 0.7 },
                y: { repeat: Infinity, duration: 3.4 + (i % 4), ease: "easeInOut" },
              }}
              className="pointer-events-none absolute hidden md:block"
              style={{ top: f.top, left: f.left, width: f.size, transform: "translate(-50%,-50%)" }}
            />
          );
        })}

        {/* Floating polaroid frames */}
        {polaroids.map((p, i) => (
          <motion.div
            key={p.key}
            aria-hidden
            initial={{ opacity: 0, rotate: p.rot }}
            animate={{ opacity: 1, y: [0, -7, 0], rotate: p.rot }}
            transition={{
              opacity: { delay: 0.4 + i * 0.15, duration: 0.8 },
              y: { repeat: Infinity, duration: 4.2 + i, ease: "easeInOut" },
            }}
            className="pointer-events-none absolute hidden w-20 rounded-sm bg-white p-1.5 shadow-md lg:block"
            style={{ top: p.top, left: p.left, transform: "translate(-50%,-50%)" }}
          >
            <div className="aspect-square w-full rounded-sm" style={{ backgroundColor: p.tint }} />
            <div className="h-4" />
          </motion.div>
        ))}

        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Hero card with staggered reveals */}
          <div className="relative z-10 rounded-[2rem] border border-border bg-card/90 p-8 shadow-sm sm:p-10">
            <motion.span
              {...reveal(0)}
              className="inline-flex items-center gap-2 rounded-full bg-blush-soft px-3 py-1 text-clay"
              style={{ fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              <Star size={13} /> Nichepicks presents
            </motion.span>
            <motion.h1 {...reveal(0.12)} className="mt-5 text-ink" style={{ fontSize: "clamp(2.4rem,5.5vw,3.8rem)", lineHeight: 1.08, fontWeight: 600 }}>
              Snap matching{" "}
              <span className="text-primary" style={{ fontStyle: "italic" }}>photo strips</span>
              <br />together, from anywhere.
            </motion.h1>
            <motion.p {...reveal(0.26)} className="mt-5 max-w-md text-ink-soft" style={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
              Create a room, send the link to your favorite person, and snap matching photo strips
              together in real-time. No matter how many miles are between you, you're always in the
              same frame.
            </motion.p>

            <motion.div {...reveal(0.4)} className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-primary-foreground shadow-sm transition-all hover:brightness-105 hover:shadow-md"
                style={{ fontSize: "1.02rem" }}
              >
                <Camera size={20} />
                Create a Photobooth Room
              </button>
              <span className="inline-flex items-center gap-1.5 text-ink-soft" style={{ fontSize: "0.85rem" }}>
                <Heart size={15} className="text-rose" /> Free · no sign-up
              </span>
            </motion.div>
          </div>

          {/* Polaroid printer mock */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative mx-auto"
          >
            <div className="mx-auto w-56 rounded-3xl bg-cream-deep p-3 shadow-md">
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-ink/90 px-4 py-3">
                <span className="h-2 w-10 rounded-full bg-cream/40" />
                <span className="h-2 w-2 rounded-full bg-rose" />
              </div>
              <PrintedStrip />
            </div>
          </motion.div>
        </div>

        {/* Testimonial pills — scroll reveal, staggered */}
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          {["“Felt like we were in the same room.”", "Warm, soft & so aesthetic", "Our long-distance ritual now 💌"].map((t, i) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 0.61, 0.36, 1] }}
              className="rounded-full border border-border bg-card/80 px-4 py-2 text-ink-soft shadow-sm"
              style={{ fontSize: "0.85rem" }}
            >
              {t}
            </motion.span>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PrintedStrip() {
  const cells = ["#e7c8be", "#dfe3d2", "#f0d6dd", "#e9d9c3"];
  return (
    <div className="rounded-2xl bg-cream p-2 shadow-sm">
      <div className="flex flex-col gap-1.5">
        {cells.map((c, i) => (
          <div key={i} className="aspect-[3/2] w-full rounded-lg" style={{ backgroundColor: c }} />
        ))}
        <p className="pt-1 pb-1 text-center text-ink-soft" style={{ fontFamily: "var(--font-serif)", fontSize: "0.7rem", fontStyle: "italic" }}>
          Sneha&rsquo;s Photobooth
        </p>
      </div>
    </div>
  );
}
