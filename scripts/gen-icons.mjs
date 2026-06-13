// ============================================================================
// App icon generator — gold spade on dark-green felt, written as PNG in pure
// Node (no deps/binaries). Re-run with: node scripts/gen-icons.mjs
// Outputs the files referenced by vite.config.ts / manifest into public/.
// ============================================================================
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, '..', 'public');

// --- PNG encoder (RGBA, 8-bit) -------------------------------------------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const body = Buffer.concat([tb, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// --- Geometry -------------------------------------------------------------
// Flipped-heart spade body + stem, in heart coordinates.
function inSpade(hx, hy, grow = 1) {
  const x = hx / grow, y = hy / grow;
  const body = Math.pow(x * x + y * y - 1, 3) + x * x * y * y * y <= 0; // point up
  const stem =
    hy <= -0.55 && hy >= -1.55 &&
    Math.abs(hx) <= 0.09 + 0.34 * ((-0.55 - hy) / 1.0);
  return body || stem;
}

// sRGB helpers
const lerp = (a, b, t) => a + (b - a) * t;
const GREEN_C = [16, 74, 46];   // #104a2e center
const GREEN_E = [3, 18, 11];    // #03120b edge
const GOLD = [212, 175, 55];    // #d4af37
const GOLD_DK = [120, 96, 24];  // darker gold rim

function renderPixel(u, v, opts) {
  // u,v in [-1,1]. Returns [r,g,b,a].
  const { pad, round } = opts;
  // rounded-rect alpha (for non-maskable). round=0 → full square.
  let a = 255;
  if (round > 0) {
    const r = 1 - round; // corner starts here
    const ax = Math.max(Math.abs(u) - r, 0);
    const ay = Math.max(Math.abs(v) - r, 0);
    const d = Math.sqrt(ax * ax + ay * ay);
    if (d > round) a = 0;
    else if (d > round - 0.02) a = Math.round(255 * (1 - (d - (round - 0.02)) / 0.02));
  }
  if (a === 0) return [0, 0, 0, 0];
  // background radial gradient
  const dist = Math.min(1, Math.sqrt(u * u + v * v) / 1.25);
  let R = lerp(GREEN_C[0], GREEN_E[0], dist);
  let G = lerp(GREEN_C[1], GREEN_E[1], dist);
  let B = lerp(GREEN_C[2], GREEN_E[2], dist);
  // spade mapping
  const H = 2.85, hyCenter = -0.125;
  const s = (2 - 2 * pad) / H;
  const hx = u / s, hy = v / s + hyCenter;
  if (inSpade(hx, hy, 1.0)) { R = GOLD[0]; G = GOLD[1]; B = GOLD[2]; }
  else if (inSpade(hx, hy, 1.06)) { R = GOLD_DK[0]; G = GOLD_DK[1]; B = GOLD_DK[2]; }
  return [Math.round(R), Math.round(G), Math.round(B), a];
}

function makeIcon(size, opts) {
  const ss = 4; // supersample
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const u = ((px + (sx + 0.5) / ss) / size) * 2 - 1;
          const v = 1 - ((py + (sy + 0.5) / ss) / size) * 2;
          const [pr, pg, pb, pa] = renderPixel(u, v, opts);
          // premultiply for correct edge AA
          r += (pr * pa) / 255; g += (pg * pa) / 255; b += (pb * pa) / 255; a += pa;
        }
      }
      const n = ss * ss;
      const av = a / n;
      const o = (py * size + px) * 4;
      rgba[o] = av > 0 ? Math.round((r / n) / (av / 255)) : 0;
      rgba[o + 1] = av > 0 ? Math.round((g / n) / (av / 255)) : 0;
      rgba[o + 2] = av > 0 ? Math.round((b / n) / (av / 255)) : 0;
      rgba[o + 3] = Math.round(av);
    }
  }
  return encodePNG(size, rgba);
}

const save = (name, buf) => { writeFileSync(join(PUB, name), buf); console.log('  ✓', name, `(${(buf.length / 1024).toFixed(1)} KB)`); };

console.log('Generating app icons →', PUB);
// "any" icons: rounded corners, modest padding
save('pwa-192x192.png', makeIcon(192, { pad: 0.16, round: 0.22 }));
save('pwa-512x512.png', makeIcon(512, { pad: 0.16, round: 0.22 }));
// maskable: full-bleed square, larger safe-zone padding
save('pwa-maskable-512x512.png', makeIcon(512, { pad: 0.30, round: 0 }));
// apple touch: full-bleed square (iOS applies its own mask)
save('apple-touch-icon.png', makeIcon(180, { pad: 0.16, round: 0 }));
// favicon PNGs (handy fallbacks)
save('favicon-32x32.png', makeIcon(32, { pad: 0.12, round: 0.18 }));

// Safari pinned-tab monochrome mask
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 64 C256 64 128 192 128 288 C128 344 168 384 216 384 C232 384 246 378 256 368 C252 392 240 416 216 432 L296 432 C272 416 260 392 256 368 C266 378 280 384 296 384 C344 384 384 344 384 288 C384 192 256 64 256 64 Z" fill="#000"/></svg>\n`;
writeFileSync(join(PUB, 'masked-icon.svg'), svg);
console.log('  ✓ masked-icon.svg');
console.log('Done.');
