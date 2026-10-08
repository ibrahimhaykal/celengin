// Generates electron/icon.png (256px), tray.png and icon.ico for the desktop app, with no image dependencies:
// a light rounded square with a dark piggy bank, matching the Celengin logo in the dashboard header.
// Run: node electron/make-icon.cjs
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const SIZE = 256;
const SS = 4; // supersampling for smooth edges

// Signed-distance-ish test for a rounded rectangle.
const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};

const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const inTriangle = (x, y, [ax, ay], [bx, by], [cx, cy]) => {
  const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  const d1 = s(x, y, ax, ay, bx, by);
  const d2 = s(x, y, bx, by, cx, cy);
  const d3 = s(x, y, cx, cy, ax, ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

// The chicken piggy bank ("celengan ayam"). Same shapes as src/components/CelenganAyam.jsx — keep them in sync.
// Returns 'ink' | 'mid' | 'hole' | null for a point in 0..256 space.
function chicken(x, y) {
  if (inRoundRect(x, y, 100, 96, 142, 106, 5) || inCircle(x, y, 176, 90, 6)) return 'hole'; // coin slot, eye
  if (inEllipse(x, y, 112, 158, 34, 21)) return 'mid'; // wing
  if (inCircle(x, y, 150, 62, 12) || inCircle(x, y, 167, 55, 13) || inCircle(x, y, 184, 62, 12)) return 'mid'; // comb
  if (inTriangle(x, y, [200, 88], [226, 100], [200, 112])) return 'mid'; // beak
  if (inEllipse(x, y, 197, 122, 7, 11)) return 'mid'; // wattle
  if (inRoundRect(x, y, 98, 204, 118, 220, 6) || inRoundRect(x, y, 136, 204, 156, 220, 6)) return 'mid'; // feet
  const body = inEllipse(x, y, 124, 152, 74, 60);
  const head = inCircle(x, y, 170, 98, 34);
  const tail = inTriangle(x, y, [74, 136], [28, 78], [60, 74]) || inTriangle(x, y, [74, 136], [60, 74], [98, 108]);
  return body || head || tail ? 'ink' : null;
}

// Returns [r, g, b, a] for one sample point (0..SIZE space): the chicken on a light rounded tile.
function sample(x, y) {
  const bg = [244, 244, 245];
  const ink = [24, 24, 27];
  const mid = [82, 82, 91];
  if (!inRoundRect(x, y, 8, 8, 248, 248, 58)) return [0, 0, 0, 0];
  const part = chicken(x, y);
  if (part === 'ink') return [...ink, 255];
  if (part === 'mid') return [...mid, 255];
  return [...bg, 255];
}

function render(size) {
  const px = Buffer.alloc(size * size * 4);
  const k = SIZE / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const s = sample((x + (sx + 0.5) / SS) * k, (y + (sy + 0.5) / SS) * k);
          acc[0] += s[0] * s[3];
          acc[1] += s[1] * s[3];
          acc[2] += s[2] * s[3];
          acc[3] += s[3];
        }
      }
      const i = (y * size + x) * 4;
      const a = acc[3] / (SS * SS);
      px[i] = acc[3] ? Math.round(acc[0] / acc[3]) : 0;
      px[i + 1] = acc[3] ? Math.round(acc[1] / acc[3]) : 0;
      px[i + 2] = acc[3] ? Math.round(acc[2] / acc[3]) : 0;
      px[i + 3] = Math.round(a);
    }
  }
  return px;
}

// Minimal PNG encoder (RGBA, 8-bit).
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function png(size) {
  const px = render(size);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ICO with PNG-compressed entries (supported since Windows Vista).
function ico(sizes) {
  const images = sizes.map(png);
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    header[e] = s >= 256 ? 0 : s;
    header[e + 1] = s >= 256 ? 0 : s;
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(images[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += images[i].length;
  });
  return Buffer.concat([header, ...images]);
}

const out = __dirname;
fs.writeFileSync(path.join(out, 'icon.png'), png(256));
fs.writeFileSync(path.join(out, 'tray.png'), png(32));
fs.writeFileSync(path.join(out, 'icon.ico'), ico([16, 24, 32, 48, 64, 128, 256]));
console.log('wrote icon.png, tray.png, icon.ico to', out);
