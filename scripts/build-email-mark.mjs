// Rasterizes the AIMT orbital mark for transactional email.
//
// Email clients don't render SVG reliably, so the header mark is a PNG. The
// geometry below is the site's canonical orbital mark (the #aimtOrbitalMark
// <symbol> used in the public nav), drawn in charcoal #262626 — the same
// treatment as the enrollment page header. Not the oxblood favicon.
//
// No dependencies: 4x4 supersampled coverage per pixel, PNG encoded with
// node:zlib. Re-run after changing the geometry:
//   node scripts/build-email-mark.mjs
// Output: assets/brand/email/aimt-mark-email.png (112×112, shown at 28×28).

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/brand/email/aimt-mark-email.png');
const SIZE = 112;          // px; displayed at 28px (4x for high-DPI)
const VIEW = 44;           // viewBox of the source symbol
const SS = 4;              // supersamples per axis
const INK = [0x26, 0x26, 0x26];

// [cx, cy, r, strokeWidth|null (null = filled), opacity]
const SHAPES = [
  [22, 22, 20, 0.75, 0.6],
  [22, 22, 13.5, 0.5, 0.3],
  [22, 22, 7, 0.5, 0.2],
  [22, 22, 2, null, 1],
  [22, 2, 1.5, null, 0.75],
  [36.1, 7.9, 1.5, null, 0.75],
  [42, 22, 1.5, null, 0.75],
  [36.1, 36.1, 1.5, null, 0.75],
  [22, 42, 1.5, null, 0.75],
  [7.9, 36.1, 1.5, null, 0.75],
  [2, 22, 1.5, null, 0.75],
  [7.9, 7.9, 1.5, null, 0.75],
];

function alphaAt(x, y) {
  let a = 0;
  for (const [cx, cy, r, sw, op] of SHAPES) {
    const d = Math.hypot(x - cx, y - cy);
    const inside = sw == null ? d <= r : Math.abs(d - r) <= sw / 2;
    if (inside) a = op + a * (1 - op);
  }
  return a;
}

const scale = VIEW / SIZE;
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let py = 0; py < SIZE; py++) {
  const row = py * (SIZE * 4 + 1);
  raw[row] = 0; // filter: none
  for (let px = 0; px < SIZE; px++) {
    let sum = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        sum += alphaAt((px + (sx + 0.5) / SS) * scale, (py + (sy + 0.5) / SS) * scale);
      }
    }
    const o = row + 1 + px * 4;
    raw[o] = INK[0]; raw[o + 1] = INK[1]; raw[o + 2] = INK[2];
    raw[o + 3] = Math.round((sum / (SS * SS)) * 255);
  }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`wrote ${path.relative(ROOT, OUT)} (${SIZE}x${SIZE}, ${png.length} bytes)`);
