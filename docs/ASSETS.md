# Registro de assets

## Tipografía y marca

La interfaz actual carga el kit de Adobe Fonts `jme3jsg` desde `https://use.typekit.net/jme3jsg.css`. Usa Area Normal Light (300) en toda la interfaz; los pesos solicitados de CSS son 200 para texto y titulares y 300 para controles, de modo que las fuentes de reserva también se vean ligeras. El kit no incluye Hairline ni Medium; las fuentes de reserva son Helvetica Neue y Arial. La carga requiere acceso a Adobe Fonts.

El logo principal proviene de `Logo-Banega.png`, aportado para esta versión. `public/logo-banega.png` es un recorte transparente de 692 × 60 píxeles para eliminar el margen vacío del original; aparece en header, menú, footer y datos estructurados. El escudo fue retirado del header. El favicon usa una B simple, sin escudo.

Source Serif 4, licencia SIL Open Font License, sigue conservada en `public/fonts/OFL.txt` y `public/fonts/` como asset de versiones anteriores. Ya no se precarga ni se usa en la interfaz actual.

`assets/originals/SourceSerif4Variable-Roman.otf` procede de https://raw.githubusercontent.com/adobe-fonts/source-serif/release/VAR/SourceSerif4Variable-Roman.otf y se conserva únicamente como fuente de construcción bajo OFL. `scripts/make-brand.py` genera contornos reales, no trazados de un bitmap: wordmark peso 400, opsz 48, tracking de 120 unidades por em de 1000; B de iconos peso 600 y opsz 14. Revisión visual a nivel de web e iconos, sujeta a aprobación final de marca. Python requiere fonttools y brotli; las salidas ya están incluidas.

`public/wordmark.svg` es el wordmark anterior y se conserva como recurso histórico. Iconos 16, 32, 48, 96, 180, 192 y 512; ICO con las tres resoluciones pequeñas. `assets/favicon-source.svg` es el original geométrico del favicon.

## Imagen de materia — SOLO PREVIEW

- Original: `assets/originals/materia-conceptual.png`.
- Generación: herramienta integrada imagegen de OpenAI, 24/09/2026. No se usó CLI ni imagen de terceros como entrada.
- Naturaleza: referencia conceptual generada con IA. **No es fotografía de una muestra real, ni representa el cuero final, un producto, un taller o una técnica de Lucas Banega.** No se afirma licencia fotográfica de terceros ni exclusividad sobre la imagen generada.
- Aprobación fotográfica para producción: pendiente. Reemplazar antes de marcar `IMAGES_APPROVED=true`.
- Derivados: `public/images/hero-*`, `hero-mobile-*`, `detail-*` en AVIF/WebP/JPEG. Recorte móvil separado, detalle ampliado. `public/images/social.jpg`: 1200×630, composición original con wordmark y estudio conceptual.
- Procesado reproducible: `node scripts/make-assets.mjs`, con sharp. Sin fuentes externas ni scripts durante navegación.

### Prompt utilizado

Use case: photorealistic-natural. Asset type: editorial material study for a prelaunch leather goods website, explicitly a conceptual AI reference, not a product. A single broad sheet of supple dark walnut brown leather resting in one graceful sculptural fold on a warm light stone colored matte studio surface. Close-up, extraordinary fine natural grain, subtle irregularities, the curved fold rising through the right half and diagonal toward center, richly legible shadows, broad gentle daylight from upper left, restrained sophisticated editorial still-life. Fill the frame with material and its abstract curved geometry, no identifiable location. Landscape 3:2 composition that can also crop to portrait. Warm grey, deep walnut brown, soft pale ivory light; no orange cast. No bag, no stitching, no tools, no hardware, no packaging, no props, no people, no logo, no text, no watermark. Not an illustration. Save the image so it can be used as an asset in the project.
