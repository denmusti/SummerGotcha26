// scripts/gen-icon.mjs — genereert public/icon-192.png en icon-512.png (target-logo).
// Geen externe dependencies: handmatige PNG-encoder (RGB, 8-bit).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function png(size) {
  const cx = size / 2, cy = size / 2;
  const navy = [13, 32, 64], cyan = [0, 180, 216], white = [255, 255, 255], red = [192, 57, 43];
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy) / (size / 2);
      let col = navy;
      if (d < 0.12) col = red;
      else if (d < 0.30) col = white;
      else if (d < 0.46) col = cyan;
      else if (d < 0.62) col = white;
      else if (d < 0.78) col = cyan;
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = col[0]; raw[o + 1] = col[1]; raw[o + 2] = col[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit, truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
writeFileSync(new URL('../public/icon-192.png', import.meta.url), png(192));
writeFileSync(new URL('../public/icon-512.png', import.meta.url), png(512));
console.log('icons geschreven naar public/');
