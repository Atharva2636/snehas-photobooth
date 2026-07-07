import { STICKERS, svgToDataUrl, type Filter, type PlacedSticker, type Template } from "./booth";

/** Resolve once the video is actually decoding frames (avoids blank captures). */
export function waitForVideoReady(video: HTMLVideoElement | null, timeout = 4000): Promise<void> {
  return new Promise((resolve) => {
    if (!video) return resolve();
    const ready = () => video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
    if (ready()) return resolve();
    const start = Date.now();
    const iv = setInterval(() => {
      if (ready() || Date.now() - start > timeout) {
        clearInterval(iv);
        resolve();
      }
    }, 60);
  });
}

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
  frameColor?: string; // paper color behind the cells
}

const CELL_W = 560;
const GAP_IN = 14;
const GAP = 30;
const PAD = 44;
const TOP_MARGIN = 52;
const BOTTOM_MARGIN = 52;

/**
 * Compose the final high-resolution photo strip. No text watermark is baked into
 * the image; branding lives in the surrounding UI instead.
 */
export async function composeStrip({ template, filter, pairs, stickers, frameColor = "#f6ead9" }: ComposeArgs): Promise<HTMLCanvasElement> {
  const cellH = Math.round(CELL_W / template.ratio);
  const pairW = CELL_W * 2 + GAP_IN;
  const { cols, rows } = template;

  const width = PAD * 2 + cols * pairW + (cols - 1) * GAP;
  const height = TOP_MARGIN + rows * cellH + (rows - 1) * GAP + BOTTOM_MARGIN;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Warm paper background + inner tinted panel
  ctx.fillStyle = "#fdf6ee";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = frameColor;
  roundRect(ctx, 12, 12, width - 24, height - 24, 26);
  ctx.fill();

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
    const py = TOP_MARGIN + row * (cellH + GAP);
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

  // Stickers on top (with per-sticker scale + rotation)
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
    ctx.save();
    ctx.translate(s.x * width, s.y * height);
    ctx.rotate(((s.rot ?? 0) * Math.PI) / 180);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
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
