import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
const original = 'assets/originals/materia-conceptual.png';
for (const [variant, widths] of [
  ['hero', [800, 1440]],
  ['hero-mobile', [480, 800]],
  ['detail', [800, 1440]],
]) {
  for (const w of widths) {
    const h = variant === 'detail' ? w : Math.round(w * 1.25);
    const input = sharp(original);
    if (variant === 'detail')
      input.extract({ left: 0, top: 0, width: 900, height: 900 });
    input.resize(w, h, {
      fit: 'cover',
      position: variant === 'hero-mobile' ? 'right' : 'centre',
    });
    await input
      .clone()
      .avif({ quality: 55 })
      .toFile(`public/images/${variant}-${w}.avif`);
    await input
      .clone()
      .webp({ quality: 78 })
      .toFile(`public/images/${variant}-${w}.webp`);
    if (w === 800)
      await input
        .clone()
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(`public/images/${variant}-${w}.jpg`);
  }
}
for (const [name, size] of [
  ['favicon-16', 16],
  ['favicon-32', 32],
  ['favicon-48', 48],
  ['favicon-96', 96],
  ['apple-touch-icon', 180],
  ['icon-192', 192],
  ['icon-512', 512],
])
  await sharp('assets/favicon-source.svg')
    .resize(size, size)
    .png()
    .toFile(`public/${name}.png`);
const sizes = [16, 32, 48],
  images = await Promise.all(
    sizes.map((n) => readFile(`public/favicon-${n}.png`)),
  );
const header = Buffer.alloc(6 + 16 * 3);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(3, 4);
let offset = header.length;
images.forEach((buf, i) => {
  let p = 6 + i * 16;
  header[p] = sizes[i];
  header[p + 1] = sizes[i];
  header.writeUInt16LE(1, p + 4);
  header.writeUInt16LE(32, p + 6);
  header.writeUInt32LE(buf.length, p + 8);
  header.writeUInt32LE(offset, p + 12);
  offset += buf.length;
});
await writeFile('public/favicon.ico', Buffer.concat([header, ...images]));
const texture = await sharp(original)
  .resize(620, 630, { fit: 'cover', position: 'right' })
  .toBuffer();
const word = await sharp('public/wordmark.svg').resize(440).toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 3, background: '#F7F4EE' },
})
  .composite([
    { input: texture, left: 580, top: 0 },
    { input: word, left: 70, top: 289 },
  ])
  .jpeg({ quality: 88 })
  .toFile('public/images/social.jpg');
