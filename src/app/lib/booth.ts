// Shared configuration for Sneha's Photobooth — templates, filters, stickers.

export type Screen = "landing" | "waiting" | "studio" | "export";

export interface Template {
  id: string;
  name: string;
  cuts: number; // number of paired shots
  cols: number; // strip grid columns
  rows: number;
  ratio: number; // width/height of a single person cell
  label: string;
}

export const TEMPLATES: Template[] = [
  { id: "cut4", name: "4-Cut Strip", cuts: 4, cols: 1, rows: 4, ratio: 1.5, label: "Classic vertical strip" },
  { id: "cut6", name: "6-Cut Grid", cuts: 6, cols: 2, rows: 3, ratio: 1.25, label: "Two-column keepsake" },
  { id: "cut8", name: "8-Cut Mosaic", cuts: 8, cols: 2, rows: 4, ratio: 1.1, label: "Playful mosaic wall" },
];

export interface Filter {
  id: string;
  name: string;
  css: string; // CSS/canvas filter string
  overlay?: string; // rgba tint drawn over the frame
  grain?: boolean;
}

export const FILTERS: Filter[] = [
  { id: "none", name: "Natural", css: "none" },
  { id: "vintage", name: "Warm Vintage", css: "sepia(0.32) contrast(1.06) saturate(1.25) brightness(1.04)", overlay: "rgba(214,154,146,0.12)" },
  { id: "pastel", name: "Soft Pastel", css: "saturate(0.82) brightness(1.09) contrast(0.94)", overlay: "rgba(246,213,207,0.18)" },
  { id: "grain", name: "Film Grain", css: "contrast(1.12) saturate(1.05) brightness(1.02)", grain: true },
  { id: "mono", name: "Crisp Monochrome", css: "grayscale(1) contrast(1.12) brightness(1.03)" },
];

// Sticker artwork as inline SVG so it can be rasterised onto the canvas.
export interface StickerDef {
  id: string;
  name: string;
  svg: string;
}

const S = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

/* Hearts */
const heart = S(`<path d="M50 84 C10 56 12 22 34 22 C44 22 50 32 50 32 C50 32 56 22 66 22 C88 22 90 56 50 84 Z" fill="#e5928a" stroke="#c9756c" stroke-width="2"/>`);
const heartPink = S(`<path d="M50 84 C10 56 12 22 34 22 C44 22 50 32 50 32 C50 32 56 22 66 22 C88 22 90 56 50 84 Z" fill="#f2b8c6" stroke="#d76d8a" stroke-width="2"/>`);
const heartScribble = S(`<path d="M50 82 C18 58 20 26 40 26 C48 26 50 34 50 34 C50 34 52 26 60 26 C80 26 82 58 50 82 Z" fill="none" stroke="#d76d8a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 34 C34 40 33 48 36 55" fill="none" stroke="#d76d8a" stroke-width="2" stroke-linecap="round" opacity="0.55"/>`);
const heartOutline = S(`<path d="M50 82 C18 58 20 26 40 26 C48 26 50 34 50 34 C50 34 52 26 60 26 C80 26 82 58 50 82 Z" fill="none" stroke="#b98a76" stroke-width="3.5" stroke-linecap="round"/>`);
const heartDouble = S(`<path d="M38 70 C16 52 18 28 34 28 C42 28 44 36 44 36 C44 36 46 28 54 28 C70 28 72 52 50 70 Z" fill="#f4c9d5" stroke="#d76d8a" stroke-width="2"/><path d="M56 82 C34 64 36 40 52 40 C60 40 62 48 62 48 C62 48 64 40 72 40 C88 40 90 64 68 82 Z" fill="#f7dbe3" stroke="#d76d8a" stroke-width="2"/>`);

/* Y2K stars & sparkles */
const star = S(`<path d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z" fill="#e9c46a" stroke="#ca9a45" stroke-width="2"/>`);
const starburst = S(`<path d="M50 8 C53 42 58 47 92 50 C58 53 53 58 50 92 C47 58 42 53 8 50 C42 47 47 42 50 8 Z" fill="#f4c9d5" stroke="#d76d8a" stroke-width="2"/>`);
const starburstY2K = S(`<g fill="#e9c46a" stroke="#ca9a45" stroke-width="1.5"><path d="M50 6 L56 44 L94 50 L56 56 L50 94 L44 56 L6 50 L44 44 Z"/><path d="M50 22 L53 47 L78 50 L53 53 L50 78 L47 53 L22 50 L47 47 Z" fill="#f6e3b0"/></g>`);
const sparkle = S(`<path d="M50 8 C54 40 60 46 92 50 C60 54 54 60 50 92 C46 60 40 54 8 50 C40 46 46 40 50 8 Z" fill="#f2d2c4" stroke="#dba892" stroke-width="1.5"/>`);
const sparkleGlow = S(`<g fill="#f6d9b0" stroke="#e0b47a" stroke-width="1.2"><path d="M34 34 C36 22 38 22 40 34 C52 36 52 38 40 40 C38 52 36 52 34 40 C22 38 22 36 34 34 Z"/><path d="M66 56 C68 46 70 46 72 56 C82 58 82 60 72 62 C70 72 68 72 66 62 C56 60 56 58 66 56 Z"/><circle cx="70" cy="30" r="4"/></g>`);
const twinkle = S(`<g fill="#f4c9d5"><path d="M50 20 L55 45 L80 50 L55 55 L50 80 L45 55 L20 50 L45 45 Z"/></g><circle cx="76" cy="26" r="5" fill="#e9c46a"/><circle cx="24" cy="72" r="4" fill="#e9c46a"/>`);

/* Coquette bows */
const bow = S(`<g fill="#f4c9d5" stroke="#d76d8a" stroke-width="2.5"><path d="M50 50 C34 33 12 33 16 50 C12 67 34 67 50 50 Z"/><path d="M50 50 C66 33 88 33 84 50 C88 67 66 67 50 50 Z"/><path d="M43 52 L40 76 L60 76 L57 52 Z"/><circle cx="50" cy="50" r="7"/></g>`);
const bowCream = S(`<g fill="#f3e4cf" stroke="#c9a986" stroke-width="2.5"><path d="M50 50 C34 33 12 33 16 50 C12 67 34 67 50 50 Z"/><path d="M50 50 C66 33 88 33 84 50 C88 67 66 67 50 50 Z"/><path d="M43 52 L40 76 L60 76 L57 52 Z"/><circle cx="50" cy="50" r="7"/></g>`);
const bowBrown = S(`<g fill="none" stroke="#9c6f57" stroke-width="3"><path d="M50 50 C34 33 12 33 16 50 C12 67 34 67 50 50 Z"/><path d="M50 50 C66 33 88 33 84 50 C88 67 66 67 50 50 Z"/><path d="M44 54 L41 76 L59 76 L56 54 Z"/><circle cx="50" cy="50" r="6"/></g>`);
const ribbon = S(`<g fill="#f2b8c6" stroke="#d76d8a" stroke-width="2"><path d="M50 46 C40 34 24 34 26 46 C24 58 40 58 50 46 Z"/><path d="M50 46 C60 34 76 34 74 46 C76 58 60 58 50 46 Z"/><circle cx="50" cy="46" r="5"/><path d="M46 50 C42 66 40 78 36 90" fill="none"/><path d="M54 50 C58 66 60 78 64 90" fill="none"/></g>`);

/* Flowers */
const flower = S(`<g fill="#cdd3bf" stroke="#a9b199" stroke-width="1.5"><ellipse cx="50" cy="24" rx="12" ry="18"/><ellipse cx="76" cy="50" rx="18" ry="12"/><ellipse cx="50" cy="76" rx="12" ry="18"/><ellipse cx="24" cy="50" rx="18" ry="12"/></g><circle cx="50" cy="50" r="11" fill="#e9c46a"/>`);
const daisy = S(`<g fill="#fffaf3" stroke="#e2c98f" stroke-width="1.5"><ellipse cx="50" cy="20" rx="9" ry="16"/><ellipse cx="71" cy="29" rx="9" ry="16" transform="rotate(45 71 29)"/><ellipse cx="80" cy="50" rx="16" ry="9"/><ellipse cx="71" cy="71" rx="9" ry="16" transform="rotate(-45 71 71)"/><ellipse cx="50" cy="80" rx="9" ry="16"/><ellipse cx="29" cy="71" rx="9" ry="16" transform="rotate(45 29 71)"/><ellipse cx="20" cy="50" rx="16" ry="9"/><ellipse cx="29" cy="29" rx="9" ry="16" transform="rotate(-45 29 29)"/></g><circle cx="50" cy="50" r="12" fill="#e9c46a"/>`);
const daisyPink = S(`<g fill="#f7dbe3" stroke="#d76d8a" stroke-width="1.3"><ellipse cx="50" cy="22" rx="8" ry="15"/><ellipse cx="78" cy="50" rx="15" ry="8"/><ellipse cx="50" cy="78" rx="8" ry="15"/><ellipse cx="22" cy="50" rx="15" ry="8"/><ellipse cx="70" cy="30" rx="8" ry="14" transform="rotate(45 70 30)"/><ellipse cx="70" cy="70" rx="8" ry="14" transform="rotate(-45 70 70)"/><ellipse cx="30" cy="70" rx="8" ry="14" transform="rotate(45 30 70)"/><ellipse cx="30" cy="30" rx="8" ry="14" transform="rotate(-45 30 30)"/></g><circle cx="50" cy="50" r="11" fill="#e9c46a"/>`);
const cherry = S(`<g><path d="M52 20 C58 32 74 30 78 46" fill="none" stroke="#9c6f57" stroke-width="2.5"/><path d="M52 20 C50 32 40 34 34 48" fill="none" stroke="#9c6f57" stroke-width="2.5"/><path d="M52 18 C60 14 72 18 70 26" fill="#cdd3bf" stroke="#a9b199" stroke-width="1.5"/><circle cx="32" cy="60" r="15" fill="#e5928a" stroke="#c9756c" stroke-width="2"/><circle cx="76" cy="58" r="15" fill="#e5928a" stroke="#c9756c" stroke-width="2"/></g>`);

/* Aesthetic extras */
const butterfly = S(`<g fill="#f2b8c6" stroke="#d76d8a" stroke-width="2"><path d="M50 50 C30 20 8 30 16 50 C8 70 34 74 50 54 Z"/><path d="M50 50 C70 20 92 30 84 50 C92 70 66 74 50 54 Z"/></g><path d="M50 44 L50 78" stroke="#9c6f57" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="42" r="4" fill="#9c6f57"/>`);
const moon = S(`<path d="M64 12 A40 40 0 1 0 64 88 A32 32 0 1 1 64 12 Z" fill="#e9c46a" stroke="#cca245" stroke-width="2"/>`);
const cloud = S(`<path d="M28 70 Q10 70 12 54 Q12 40 28 42 Q30 24 50 26 Q70 26 70 44 Q90 42 88 60 Q88 72 72 70 Z" fill="#fbe6e2" stroke="#e2b6ae" stroke-width="2"/>`);
const frame = S(`<rect x="8" y="8" width="84" height="84" rx="8" fill="none" stroke="#b98a76" stroke-width="4" stroke-dasharray="2 6"/>`);
const polaroidStamp = S(`<rect x="6" y="34" width="88" height="32" rx="6" fill="#3c322d" opacity="0.82"/><text x="50" y="56" text-anchor="middle" font-family="'Courier New',monospace" font-size="18" fill="#f2a65a" letter-spacing="1">'26 07 06</text>`);
const filmStrip = S(`<rect x="20" y="8" width="60" height="84" rx="4" fill="#3c322d"/><rect x="30" y="18" width="40" height="30" rx="2" fill="#f6ead9"/><rect x="30" y="54" width="40" height="30" rx="2" fill="#f6ead9"/><g fill="#f6ead9"><rect x="23" y="14" width="4" height="6"/><rect x="23" y="26" width="4" height="6"/><rect x="23" y="38" width="4" height="6"/><rect x="23" y="50" width="4" height="6"/><rect x="23" y="62" width="4" height="6"/><rect x="23" y="74" width="4" height="6"/><rect x="73" y="14" width="4" height="6"/><rect x="73" y="26" width="4" height="6"/><rect x="73" y="38" width="4" height="6"/><rect x="73" y="50" width="4" height="6"/><rect x="73" y="62" width="4" height="6"/><rect x="73" y="74" width="4" height="6"/></g>`);

export const STICKERS: StickerDef[] = [
  { id: "heart", name: "Heart", svg: heart },
  { id: "heartPink", name: "Pink Heart", svg: heartPink },
  { id: "heartScribble", name: "Scribble Heart", svg: heartScribble },
  { id: "heartOutline", name: "Outline Heart", svg: heartOutline },
  { id: "heartDouble", name: "Double Heart", svg: heartDouble },
  { id: "star", name: "Star", svg: star },
  { id: "starburst", name: "Starburst", svg: starburst },
  { id: "starburstY2K", name: "Y2K Burst", svg: starburstY2K },
  { id: "sparkle", name: "Sparkle", svg: sparkle },
  { id: "sparkleGlow", name: "Glow Sparkle", svg: sparkleGlow },
  { id: "twinkle", name: "Twinkle", svg: twinkle },
  { id: "bow", name: "Pink Bow", svg: bow },
  { id: "bowCream", name: "Cream Bow", svg: bowCream },
  { id: "bowBrown", name: "Brown Bow", svg: bowBrown },
  { id: "ribbon", name: "Ribbon", svg: ribbon },
  { id: "flower", name: "Flower", svg: flower },
  { id: "daisy", name: "Daisy", svg: daisy },
  { id: "daisyPink", name: "Pink Daisy", svg: daisyPink },
  { id: "cherry", name: "Cherries", svg: cherry },
  { id: "butterfly", name: "Butterfly", svg: butterfly },
  { id: "moon", name: "Moon", svg: moon },
  { id: "cloud", name: "Cloud", svg: cloud },
  { id: "frame", name: "Frame", svg: frame },
  { id: "polaroidStamp", name: "Date Stamp", svg: polaroidStamp },
  { id: "filmStrip", name: "Film", svg: filmStrip },
];

export interface PlacedSticker {
  uid: string;
  id: string;
  x: number; // 0..1 relative to strip
  y: number;
  scale: number;
  rot: number; // degrees
}

// Soft Pinterest-core paper tones for the photo strip frame.
export interface FrameColor {
  id: string;
  name: string;
  value: string;
}

export const FRAME_COLORS: FrameColor[] = [
  { id: "cream", name: "Buttery Cream", value: "#f6ead9" },
  { id: "blush", name: "Soft Blush", value: "#fbe6e2" },
  { id: "sage", name: "Muted Sage", value: "#dbe1cf" },
  { id: "lavender", name: "Lavender Gray", value: "#e4e0ec" },
  { id: "sky", name: "Dusty Sky", value: "#d9e6ec" },
];

export const svgToDataUrl = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export function makeRoomId() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

export function roomLink(roomId: string) {
  return `${window.location.origin}/room/${roomId}`;
}

/** Extract a room id from either /room/<id> or the legacy ?room=<id> form. */
export function readRoomFromUrl(): string | null {
  const path = window.location.pathname.match(/\/room\/([A-Za-z0-9_-]+)/);
  if (path) return path[1];
  return new URLSearchParams(window.location.search).get("room");
}

export const INSTAGRAM_URL = "https://www.instagram.com/nichepickss";
export const FOOTER_COPY =
  "Brought to you by Nichepicks – 'niché' category of handmade, pintresty gifts as per your preferences. we're open to custom orders 💌 10 days pre order. Rajnandgaon 📍";
