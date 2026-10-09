// Derivados responsivos para la portada y páginas internas.
// Uso: node scripts/make-responsive.mjs (requiere sharp). No modifica los originales.
import sharp from 'sharp';
const out = (name) => `public/images/${name}`;
const campaign = 'assets/campaign-v2/campaign-v2-original.png'; // 1536 × 1024
const material = 'assets/campaign-v2/material-v2-original.png'; // 1122 × 1402

// Portada escritorio: 960 px además del 1536 existente.
await sharp(campaign)
  .resize(960)
  .webp({ quality: 74 })
  .toFile(out('campaign-v2-960.webp'));
await sharp(campaign).webp({ quality: 74 }).toFile(out('campaign-v2.webp'));

// Portada móvil: recorte vertical centrado en la mano (sin ampliar el original).
const portrait = { left: 820, top: 0, width: 640, height: 1024 };
for (const w of [480, 640])
  await sharp(campaign)
    .extract(portrait)
    .resize(w)
    .webp({ quality: 76 })
    .toFile(out(`campaign-v2-portrait-${w}.webp`));

// Materia: versión principal más liviana y tamaños intermedios.
for (const w of [560, 840])
  await sharp(material)
    .resize(w)
    .webp({ quality: 74 })
    .toFile(out(`material-v2-${w}.webp`));
await sharp(material).webp({ quality: 70 }).toFile(out('material-v2.webp'));

// Tarjetero: el WebP publicado es la fuente; se generan solo tamaños menores.
const cardholder = await sharp(out('cardholder-concept.webp')).toBuffer();
for (const w of [540, 810])
  await sharp(cardholder)
    .resize(w)
    .webp({ quality: 76 })
    .toFile(out(`cardholder-concept-${w}.webp`));
const editorial = await sharp(out('cardholder-editorial.webp')).toBuffer();
for (const w of [768, 1152])
  await sharp(editorial)
    .resize(w)
    .webp({ quality: 76 })
    .toFile(out(`cardholder-editorial-${w}.webp`));
