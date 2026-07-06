import { STICKERS, svgToDataUrl, type Filter, type PlacedSticker, type Template } from "./booth";

/** Grab a single video frame at its native resolution (mirrored, like a selfie). */
export function grabFrame(video: HTMLVideoElement): string {
  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  return c.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const ir = img.width / img.height;
  const r = dw / dh;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > r) {
    sh = img.height;
    sw = sh * r;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / r;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface Pair {
  self: string; // data url
  partner: string; // data url
}

export interface ComposeArgs {
  template: Template;
  filter: Filter;
  pairs: Pair[];
  stickers: PlacedSticker[];
}

const CELL_W = 560;
const GAP_IN = 14;
const GAP = 30;
const PAD = 44;
const HEADER_H = 130;
const FOOTER_H = 96;

/** Compose the final high-resolution photo strip onto a canvas. */
export async function composeStrip({ template, filter, pairs, stickers }: ComposeArgs): Promise<HTMLCanvasElement> {
  const cellH = Math.round(CELL_W / template.ratio);
  const pairW = CELL_W * 2 + GAP_IN;
  const { cols, rows } = template;

  const width = PAD * 2 + cols * pairW + (cols - 1) * GAP;
  const height = HEADER_H + rows * cellH + (rows - 1) * GAP + FOOTER_H + PAD;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Warm paper background
  ctx.fillStyle = "#fdf6ee";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#f6ead9";
  roundRect(ctx, 12, 12, width - 24, height - 24, 26);
  ctx.fill();

  // Header
  ctx.fillStyle = "#3c322d";
  ctx.textAlign = "center";
  ctx.font = "600 54px 'Playfair Display', Georgia, serif";
  ctx.fillText("Sneha’s Photobooth", width / 2, HEADER_H - 52);
  ctx.fillStyle = "#8a7a6e";
  ctx.font = "400 22px 'Inter', sans-serif";
  ctx.fillText("presented by Nichepicks", width / 2, HEADER_H - 20);

  // Preload all frames
  const loaded = await Promise.all(
    pairs.map(async (p) => ({
      self: await loadImage(p.self),
      partner: await loadImage(p.partner),
    }))
  );

  for (let i = 0; i < template.cuts; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = PAD + col * (pairW + GAP);
    const py = HEADER_H + row * (cellH + GAP);
    const frame = loaded[i];
    if (!frame) continue;

    const cells: Array<[HTMLImageElement, number]> = [
      [frame.self, px],
      [frame.partner, px + CELL_W + GAP_IN],
    ];

    for (const [img, cx] of cells) {
      ctx.save();
      roundRect(ctx, cx, py, CELL_W, cellH, 16);
      ctx.clip();
      ctx.filter = filter.css;
      drawCover(ctx, img, cx, py, CELL_W, cellH);
      ctx.filter = "none";
      if (filter.overlay) {
        ctx.fillStyle = filter.overlay;
        ctx.fillRect(cx, py, CELL_W, cellH);
      }
      if (filter.grain) drawGrain(ctx, cx, py, CELL_W, cellH);
      ctx.restore();

      ctx.strokeStyle = "rgba(60,50,45,0.10)";
      ctx.lineWidth = 2;
      roundRect(ctx, cx, py, CELL_W, cellH, 16);
      ctx.stroke();
    }
  }

  // Footer band
  ctx.fillStyle = "#8a7a6e";
  ctx.textAlign = "center";
  ctx.font = "italic 400 26px 'Playfair Display', Georgia, serif";
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  ctx.fillText(`made with love · ${date}`, width / 2, height - FOOTER_H + 46);
  ctx.font = "400 18px 'Inter', sans-serif";
  ctx.fillText("nichepicks · Rajnandgaon", width / 2, height - FOOTER_H + 76);

  // Stickers on top
  const stickerImgs = await Promise.all(
    stickers.map(async (s) => {
      const def = STICKERS.find((d) => d.id === s.id);
      if (!def) return null;
      return { img: await loadImage(svgToDataUrl(def.svg)), s };
    })
  );
  for (const item of stickerImgs) {
    if (!item) continue;
    const { img, s } = item;
    const size = 150 * s.scale;
    ctx.drawImage(img, s.x * width - size / 2, s.y * height - size / 2, size, size);
  }

  return canvas;
}

function drawGrain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const density = Math.floor((w * h) / 90);
  ctx.save();
  for (let i = 0; i < density; i++) {
    const a = Math.random() * 0.09;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(60,50,45,${a})`;
    ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1.4, 1.4);
  }
  ctx.restore();
}
