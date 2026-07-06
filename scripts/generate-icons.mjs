/**
 * Generate PWA app icons with zero external dependencies.
 *
 * Renders the ShowTracker mark — a white "play" triangle on the accent-blue
 * background (#007AFF, matches --accent in the design system) — into PNG files
 * using only Node's built-in zlib for compression. Edges are anti-aliased via
 * 4x supersampling with premultiplied-alpha downsampling (no dark fringing).
 *
 * Run: node scripts/generate-icons.mjs
 */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const ACCENT = [0, 122, 255]; // #007AFF

// --- PNG encoding (RGBA, 8-bit, no interlace) ------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Geometry (normalized 0..1 coordinate space) ---------------------------

// Inside a full-canvas rounded rectangle with corner radius r (0 = square).
function inRoundedRect(x, y, r) {
  if (r <= 0) return true;
  const cx = Math.max(r, Math.min(1 - r, x));
  const cy = Math.max(r, Math.min(1 - r, y));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Inside the play triangle (points right, optically centered).
const TRI = [
  [0.38, 0.3],
  [0.38, 0.7],
  [0.73, 0.5],
];
function inTriangle(x, y) {
  const [a, b, c] = TRI;
  const d1 = (x - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (y - b[1]);
  const d2 = (x - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (y - c[1]);
  const d3 = (x - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (y - a[1]);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

// --- Rendering -------------------------------------------------------------

// radius: corner radius in normalized space (0 = full square, for maskable /
// apple-touch icons that the OS masks itself).
function renderIcon(size, radius) {
  const ss = 4; // supersampling factor
  const S = size * ss;
  const big = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = (x + 0.5) / S;
      const ny = (y + 0.5) / S;
      const i = (y * S + x) * 4;
      if (inRoundedRect(nx, ny, radius)) {
        if (inTriangle(nx, ny)) {
          big[i] = 255;
          big[i + 1] = 255;
          big[i + 2] = 255;
        } else {
          big[i] = ACCENT[0];
          big[i + 1] = ACCENT[1];
          big[i + 2] = ACCENT[2];
        }
        big[i + 3] = 255;
      }
    }
  }

  // Downsample with premultiplied-alpha box filter.
  const out = Buffer.alloc(size * size * 4);
  const n = ss * ss;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let pr = 0;
      let pg = 0;
      let pb = 0;
      let pa = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const i = ((y * ss + sy) * S + (x * ss + sx)) * 4;
          const a = big[i + 3];
          pr += big[i] * a;
          pg += big[i + 1] * a;
          pb += big[i + 2] * a;
          pa += a;
        }
      }
      const o = (y * size + x) * 4;
      out[o + 3] = Math.round(pa / n);
      if (pa > 0) {
        out[o] = Math.round(pr / pa);
        out[o + 1] = Math.round(pg / pa);
        out[o + 2] = Math.round(pb / pa);
      }
    }
  }
  return encodePNG(size, out);
}

// --- Output ----------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

const ROUNDED = 0.22; // iOS-like rounded corners for standalone "any" icons
const files = [
  ["icon-192.png", renderIcon(192, ROUNDED)],
  ["icon-512.png", renderIcon(512, ROUNDED)],
  ["icon-maskable-512.png", renderIcon(512, 0)], // full-bleed, OS applies mask
  ["apple-touch-icon.png", renderIcon(180, 0)], // full square, iOS rounds it
];

for (const [name, buf] of files) {
  writeFileSync(join(OUT_DIR, name), buf);
  console.log(`wrote public/icons/${name} (${buf.length} bytes)`);
}
