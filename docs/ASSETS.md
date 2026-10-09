# Registro de assets

## Tipografía y marca

La interfaz carga el kit de Adobe Fonts `jme3jsg` desde `https://use.typekit.net/jme3jsg.css` de forma no bloqueante (`rel=preload` + `onload`, con `<noscript>` de respaldo). Area Normal Light (300) se usa para el texto corrido y la navegación; Area Normal (400) para textos de apoyo pequeños (footer, etiquetas, pies de imagen, notas), que pasan a 13–14 px. El kit declara `font-display: auto`; para que Area también use `swap` hay que cambiarlo en la configuración del proyecto web en Adobe Fonts. Las fuentes de reserva son Helvetica Neue y Arial.

El logo principal proviene de `Logo-Banega.png`, aportado para esta versión. `public/logo-banega.png` es un recorte transparente de 692 × 60 píxeles para eliminar el margen vacío del original; aparece en header, menú, footer y datos estructurados. El escudo fue retirado del header. El favicon usa una B simple, sin escudo.

Source Serif 4, licencia SIL Open Font License (`public/fonts/OFL.txt`), vuelve a usarse para todos los titulares (h1–h3), servida localmente desde `public/fonts/` (subconjuntos latin y latin-ext, ejes de peso y tamaño óptico) con `font-display: swap`. La reserva es Georgia con métricas ajustadas (`Source Serif 4 Fallback`) para evitar saltos de diseño. No se precarga para no competir con la imagen principal en celulares. El paquete `@fontsource-variable/source-serif-4` contiene los mismos archivos; el sitio sirve las copias de `public/fonts/`.

`assets/originals/SourceSerif4Variable-Roman.otf` procede de https://raw.githubusercontent.com/adobe-fonts/source-serif/release/VAR/SourceSerif4Variable-Roman.otf y se conserva únicamente como fuente de construcción bajo OFL. `scripts/make-brand.py` genera contornos reales, no trazados de un bitmap: wordmark peso 400, opsz 48, tracking de 120 unidades por em de 1000; B de iconos peso 600 y opsz 14. Revisión visual a nivel de web e iconos, sujeta a aprobación final de marca. Python requiere fonttools y brotli; las salidas ya están incluidas.

`public/wordmark.svg` es el wordmark anterior y se conserva como recurso histórico. Iconos 16, 32, 48, 96, 180, 192 y 512; ICO con las tres resoluciones pequeñas. `assets/favicon-source.svg` es el original geométrico del favicon.

## Imágenes conceptuales del prelanzamiento público

La web está en `public-prelaunch`. Las imágenes actuales son referencias conceptuales; la publicación editorial no equivale a aprobar fotografías de producto ni permite marcar `IMAGES_APPROVED=true`.

| Archivo servido | Uso actual | Estado |
| --- | --- | --- |
| `public/images/campaign-v2.webp` y `campaign-v2-mobile.webp` | Hero editorial, escritorio y móvil. | Campaña conceptual; no acredita materiales o procesos finales. |
| `public/images/material-v2.webp` | Historia de materia en portada. | Referencia visual conceptual. |
| `public/images/cardholder-concept.webp` | Portada y página del primer objeto. | Intención de diseño del tarjetero; no es una muestra validada. |
| `public/images/cardholder-editorial.webp` | Fotografía editorial del tarjetero en portada. | Imagen conceptual; diseño sujeto a desarrollo. |

El origen detallado y los archivos de generación de estos recursos deben completarse con evidencia disponible. No se deducen licencias, proveedores ni especificaciones finales a partir de las imágenes. Los avisos visibles del tarjetero deben acompañar su presentación en portada y en la página del objeto.

## Imagen de materia de la versión anterior

- Original: `assets/originals/materia-conceptual.png`.
- Generación: herramienta integrada imagegen de OpenAI, 24/09/2026. No se usó CLI ni imagen de terceros como entrada.
- Naturaleza: referencia conceptual generada con IA. **No es fotografía de una muestra real, ni representa el cuero final, un producto, un taller o una técnica de Lucas Banega.** No se afirma licencia fotográfica de terceros ni exclusividad sobre la imagen generada.
- Aprobación fotográfica para producción: pendiente. Reemplazar antes de marcar `IMAGES_APPROVED=true`.
- Derivados: `public/images/hero-*`, `hero-mobile-*`, `detail-*` en AVIF/WebP/JPEG. Recorte móvil separado, detalle ampliado. `public/images/social.jpg`: 1200×630, composición original con wordmark y estudio conceptual.
- Procesado reproducible: `node scripts/make-assets.mjs`, con sharp. Sin fuentes externas ni scripts durante navegación.

### Prompt utilizado

Use case: photorealistic-natural. Asset type: editorial material study for a prelaunch leather goods website, explicitly a conceptual AI reference, not a product. A single broad sheet of supple dark walnut brown leather resting in one graceful sculptural fold on a warm light stone colored matte studio surface. Close-up, extraordinary fine natural grain, subtle irregularities, the curved fold rising through the right half and diagonal toward center, richly legible shadows, broad gentle daylight from upper left, restrained sophisticated editorial still-life. Fill the frame with material and its abstract curved geometry, no identifiable location. Landscape 3:2 composition that can also crop to portrait. Warm grey, deep walnut brown, soft pale ivory light; no orange cast. No bag, no stitching, no tools, no hardware, no packaging, no props, no people, no logo, no text, no watermark. Not an illustration. Save the image so it can be used as an asset in the project.

## Derivados responsivos (octubre 2026)

`node scripts/make-responsive.mjs` (sharp) genera, sin tocar los originales:

- `campaign-v2-960.webp` y `campaign-v2.webp` (1536) desde `assets/campaign-v2/campaign-v2-original.png`, servidos con `srcset`.
- `campaign-v2-portrait-480.webp` / `-640.webp`: recorte vertical de la portada para celular, centrado en la mano. Reemplaza a `campaign-v2-mobile.webp`, que ampliaba una imagen horizontal.
- `material-v2-560.webp`, `material-v2-840.webp` y `material-v2.webp` recomprimido (205 KB → 92 KB) desde `assets/campaign-v2/material-v2-original.png`.
- `cardholder-concept-540/810.webp` y `cardholder-editorial-768/1152.webp` a partir de los WebP publicados, que siguen siendo la fuente.

La portada se muestra en color, sin filtro de escala de grises; el contraste del texto se resuelve con un velo cálido y localizado.
