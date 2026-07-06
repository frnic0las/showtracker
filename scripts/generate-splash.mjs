/**
 * Generate iOS PWA launch (splash) screens with zero external dependencies.
 *
 * Renders the ShowTracker mark — an accent-blue "play" triangle — centered on
 * a solid background for both light and dark mode, into PNG files using only
 * Node's built-in zlib for compression. Reuses the PNG-encoding helpers from
 * generate-icons.mjs. Only the small centered mark region is supersampled for
 * anti-aliasing; the rest of the canvas is filled flat for speed.
 *
 * Run: node scripts/generate-splash.mjs
 */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "splash");

// Matches --accent in docs/DESIGN_SYSTEM.md for light / dark mode.
const LIGHT_BG = [255, 255, 255]; // #FFFFFF
const LIGHT_MARK = [0, 122, 255]; // #007AFF
const DARK_BG = [0, 0, 0]; // #000000
const DARK_MARK = [10, 132, 255]; // #0A84FF

const MARK_SIZE = 256; // device-px size of the centered square mark region

// Portrait iOS device pixel sizes (width x height) to cover.
const SIZES = [
  [1179, 2556], // iPhone 14 Pro / 15 / 16
  [1290, 2796], // iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max
  [1170, 2532], // iPhone 12 / 13 / 14
  [1284, 2778], // iPhone 12/13 Pro Max, 14 Plus
  [1125, 2436], // iPhone X / XS / 11 Pro / 12 mini
  [1242, 2688], // iPhone XS Max / 11 Pro Max
  [828, 1792], // iPhone XR / 11
  [750, 1334], // iPhone SE 2/3, 8, 7, 6s
  [1242, 2208], // iPhone 8 Plus / 7 Plus
];

// --- PNG encoding (RGBA, 8-bit, no interlace) ------------------------------
// (identical helpers to generate-icons.mjs)

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

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
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

// --- Geometry (normalized 0..1 coordinate space, within the mark region) ---

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

// Renders the anti-aliased mark region (markSize x markSize) once, to be
// composited onto every canvas at the same logical size.
function renderMark(markSize, bg, markColor) {
  const ss = 4; // supersampling factor
  const S = markSize * ss;
  const big = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = (x + 0.5) / S;
      const ny = (y + 0.5) / S;
      const i = (y * S + x) * 4;
      const [r, g, b] = inTriangle(nx, ny) ? markColor : bg;
      big[i] = r;
      big[i + 1] = g;
      big[i + 2] = b;
      big[i + 3] = 255;
    }
  }

  // Downsample with a box filter (fully opaque source, no alpha blending
  // needed against the canvas since bg == mark region background).
  const out = Buffer.alloc(markSize * markSize * 4);
  const n = ss * ss;
  for (let y = 0; y < markSize; y++) {
    for (let x = 0; x < markSize; x++) {
      let pr = 0;
      let pg = 0;
      let pb = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const i = ((y * ss + sy) * S + (x * ss + sx)) * 4;
          pr += big[i];
          pg += big[i + 1];
          pb += big[i + 2];
        }
      }
      const o = (y * markSize + x) * 4;
      out[o] = Math.round(pr / n);
      out[o + 1] = Math.round(pg / n);
      out[o + 2] = Math.round(pb / n);
      out[o + 3] = 255;
    }
  }
  return out;
}

// Renders a full-canvas splash: flat background with the pre-rendered mark
// composited at its center. Avoids supersampling the whole canvas.
function renderSplash(width, height, bg, markColor) {
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    out[o] = bg[0];
    out[o + 1] = bg[1];
    out[o + 2] = bg[2];
    out[o + 3] = 255;
  }

  const mark = renderMark(MARK_SIZE, bg, markColor);
  const offsetX = Math.round((width - MARK_SIZE) / 2);
  const offsetY = Math.round((height - MARK_SIZE) / 2);
  for (let y = 0; y < MARK_SIZE; y++) {
    const srcStart = y * MARK_SIZE * 4;
    const destStart = ((offsetY + y) * width + offsetX) * 4;
    mark.copy(out, destStart, srcStart, srcStart + MARK_SIZE * 4);
  }

  return encodePNG(width, height, out);
}

// --- Output ----------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

for (const [width, height] of SIZES) {
  const light = renderSplash(width, height, LIGHT_BG, LIGHT_MARK);
  const dark = renderSplash(width, height, DARK_BG, DARK_MARK);

  const lightName = `splash-${width}x${height}-light.png`;
  const darkName = `splash-${width}x${height}-dark.png`;
  writeFileSync(join(OUT_DIR, lightName), light);
  writeFileSync(join(OUT_DIR, darkName), dark);
  console.log(`wrote public/splash/${lightName} (${light.length} bytes)`);
  console.log(`wrote public/splash/${darkName} (${dark.length} bytes)`);
}
