// Generates an animated, warm placeholder camera stream for environments where
// getUserMedia is blocked (e.g. sandboxed iframe previews). On a real Vercel
// deployment the true webcam is used and this is never invoked.

export interface PlaceholderStream {
  stream: MediaStream;
  stop: () => void;
}

export function createPlaceholderStream(): PlaceholderStream {
  const w = 1280;
  const h = 960;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const start = performance.now();
  let raf = 0;

  const roundRect = (x: number, y: number, rw: number, rh: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, r);
    ctx.arcTo(x + rw, y + rh, x, y + rh, r);
    ctx.arcTo(x, y + rh, x, y, r);
    ctx.arcTo(x, y, x + rw, y, r);
    ctx.closePath();
  };

  const draw = () => {
    const t = (performance.now() - start) / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);

    // Warm cream base + soft pulsing wash
    ctx.fillStyle = "#f6ead9";
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w * 0.72);
    g.addColorStop(0, `rgba(246,213,207,${0.45 + 0.32 * pulse})`);
    g.addColorStop(1, "rgba(205,211,191,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Drifting soft blobs
    for (let i = 0; i < 6; i++) {
      const a = t * 0.35 + i * 1.1;
      const cx = w / 2 + Math.cos(a) * (150 + i * 34);
      const cy = h / 2 + Math.sin(a * 0.8) * (100 + i * 26);
      ctx.beginPath();
      ctx.arc(cx, cy, 42 + 12 * Math.sin(t + i), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(217,154,146,${0.1 + 0.06 * pulse})`;
      ctx.fill();
    }

    // Gentle camera glyph
    const cxc = w / 2;
    const cyc = h / 2 - 30;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(255,250,243,0.9)";
    ctx.beginPath();
    ctx.arc(cxc, cyc, 96 + 6 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b98a76";
    roundRect(cxc - 58, cyc - 30, 116, 74, 16);
    ctx.fill();
    roundRect(cxc - 26, cyc - 46, 52, 22, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(255,250,243,0.95)";
    ctx.beginPath();
    ctx.arc(cxc, cyc + 8, 24 + 2 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Note: the readable label is rendered as a DOM overlay in the Studio (so it
    // is never affected by the video element's horizontal mirror transform).

    raf = requestAnimationFrame(draw);
  };
  draw();

  // Some browsers gate captureStream; guard just in case.
  const stream = (canvas as HTMLCanvasElement).captureStream
    ? canvas.captureStream(30)
    : new MediaStream();

  return {
    stream,
    stop: () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((tr) => tr.stop());
    },
  };
}
