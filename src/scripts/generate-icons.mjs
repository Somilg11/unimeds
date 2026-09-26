// Regenerates raster icons from src/app/icon.svg: favicon.ico (16/32/48), apple-icon.png, manifest PNGs.
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile(new URL('../src/app/icon.svg', import.meta.url));
// Full-bleed square for iOS / Android, which apply their own mask
const square = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1F72E8"/>' +
    '<path d="M32 20v24M20 32h24" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>'
);
const png = (src, size) => sharp(src, { density: 512 }).resize(size, size).png().toBuffer();

// ICO container holding PNG images
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(svg, s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(sizes[i] % 256, e);
  header.writeUInt8(sizes[i] % 256, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
await writeFile(new URL('../src/app/favicon.ico', import.meta.url), Buffer.concat([header, ...images]));
await writeFile(new URL('../src/app/apple-icon.png', import.meta.url), await png(square, 180));
await writeFile(new URL('../public/icon-192.png', import.meta.url), await png(square, 192));
await writeFile(new URL('../public/icon-512.png', import.meta.url), await png(square, 512));
console.log('icons written');
