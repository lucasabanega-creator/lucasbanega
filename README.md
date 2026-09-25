# LUCAS BANEGA — prelanzamiento

Web editorial nueva en Astro + TypeScript, preparada para **lucasbanega.com / Netlify**. Estado entregado: **preview local**, no publicada, sin recepción de datos personales. Se reemplazaron las páginas, estilos, scripts y recursos anteriores; se conservó el historial Git y la configuración del editor.

## Usar localmente

Requiere Node 22.12 o superior (Netlify configurado con Node 24).

```sh
npm ci
cp .env.example .env
npm run dev
```

La terminal informa la URL local. En Astro 7 el servidor de desarrollo puede ejecutarse en segundo plano: `npx astro dev status`, `npx astro dev logs`, `npx astro dev stop`. La telemetría de Astro puede desactivarse con `ASTRO_TELEMETRY_DISABLED=1`.

```sh
npm run check
npm test
npm run build
```

La compilación entrega estáticos en `dist/` y la función SSR de Netlify en `.netlify/`. **No subir la carpeta fuente como una web HTML estática.** El proyecto requiere el proceso de build de Netlify.

Para revisar exactamente el código compilado, detener primero el servidor de desarrollo y ejecutar `node scripts/preview-build.mjs`; abre `http://127.0.0.1:4322`. Ese servidor auxiliar es solo para pruebas locales.

## Netlify y dominio

`netlify.toml` establece `npm run check && npm run build`, publicación `dist`, Node 24 y el dominio confirmado mediante `SITE_URL=https://lucasbanega.com`. No se modificaron DNS, cuenta, repositorio remoto ni despliegues.

1. Confirmar en Netlify que este repositorio y directorio son la fuente correcta.
2. Antes de cualquier push que dispare un despliegue, definir **PREVIEW_PASSWORD** como secreto disponible en build y Functions. Usuario de preview: `preview`. No poner la clave en Git.
3. Mantener `PUBLICATION_MODE=preview`. Las páginas llevan `noindex` también en la respuesta HTTP, el sitemap no enumera rutas y las altas están deshabilitadas. El build en Netlify falla si falta protección. Se recomienda activar además la protección de acceso de Netlify para cubrir los assets estáticos; el middleware protege páginas y endpoints, no los archivos del CDN.
4. Revisar la preview protegida. No se ha hecho push ni deploy desde esta tarea.
5. Solo después de cerrar los pendientes, cambiar el valor comprometido `PUBLICATION_MODE` en `netlify.toml` a `live` y realizar un despliegue autorizado. Las previews de ramas siguen protegidas y no indexables por el contexto de Netlify.

## Pendientes reales para abrir el prelanzamiento

- Correo oficial comprobado (`CONTACT_EMAIL`). No se dedujo una dirección a partir del dominio.
- Proveedor de suscripciones confirmado. Se incluye **un adaptador opcional para Brevo con doble confirmación**, todavía no conectado. No se creó una cuenta ni se contrató un servicio. Si el proveedor elegido es otro, sustituir `servicesFor().send` y su validación.
- Si se usa ese adaptador: remitente y dominio verificados, lista, plantilla de doble confirmación, baja operativa, `BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_TEMPLATE_ID`, `NEWSLETTER_PROVIDER=brevo`.
- Limitador compartido entre funciones: instancia Upstash Redis y secretos `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, o reemplazo equivalente. Se limita atómicamente a cinco solicitudes por IP en diez minutos. Solo se almacena un HMAC temporal de la IP, nunca su texto ni el correo; falla cerrado si el servicio no responde.
- Responsable y política real: completar `src/content/privacy.json` con `controller`, `updated` y `sections` (objetos `{title, body}`), revisar finalidades, proveedores, conservación, transferencias, derechos y contacto. Después marcar `approved: true` y `PRIVACY_APPROVED=true`. El texto actual solo informa del estado de la preview.
- Reemplazar las referencias generadas por fotografías propias o licenciadas aprobadas. Revisar el registro de assets, alt, pies y social. Marcar `IMAGES_APPROVED=true` solo después.
- Prueba real con dirección controlada: entrega del email, enlace de confirmación, persistencia en lista, baja y reintento. No basta una respuesta HTTP favorable.
- Comprobar el despliegue HTTPS, los redirects de dominio y el 404 en Netlify; validar canonical, sitemap, metadatos, ausencia de `noindex` en producción y permanencia de `noindex` en previews. Configurar Search Console y enviar el sitemap después.
- Dispositivos físicos iOS/Android y revisión con lector de pantalla: pendientes.

La apertura falla si faltan datos. **No usar los flags de aprobación para sortear los requisitos.** Nunca se presenta un timeout como alta exitosa. Un envío aceptado solo muestra «Revisá tu correo para confirmar tu suscripción». La confirmación final y la baja pertenecen al proveedor.

## Estructura y evolución

- `src/content/`: textos españoles y datos legales. Español es el único idioma publicado; nuevas traducciones necesitan contenido completo antes de crear rutas.
- `src/components/`: SiteHeader, MobileNavigation, Wordmark, EditorialHero, MaterialSection, LaunchForm, SiteFooter y MaterialImage.
- `src/lib/config.ts`: configuración validada exclusivamente del servidor; secretos fuera de scripts cliente.
- `src/lib/subscription.mjs`: validación, límite real de cuerpo, origen, consentimiento, honeypot, limitador y proveedor.
- `src/styles/global.css`: tokens de color, tipografía, espaciado y responsive. Una sola familia visual; Georgia solo fallback con métricas ajustadas. Sin librerías de animación.
- `public/`: WOFF2, licencia, wordmark vectorial, iconos, manifest y fotografías conceptuales optimizadas.
- `assets/`: originales y fuente de construcción, no servidos por la web.
- `tests/` / `docs/`: pruebas repetibles, evidencias y pendientes.

`site.mode` permanece en `prelaunch`. `commerce` es un estado reservado: no activa catálogo, bolsa ni checkout. La futura plataforma requiere definir país, moneda, impuestos, inventario, logística y políticas. No hay Product, Offer, LocalBusiness ni valoraciones inventadas.

## Pruebas

```sh
npx playwright install chromium webkit
# Con la preview local de build en 4322:
TEST_URL=http://127.0.0.1:4322 npm run test:browser
node tests/mobile.mjs
node tests/interaction.mjs
node tests/lighthouse.mjs
```

`test-results/` contiene capturas y resultados locales y está excluido de Git. `docs/PRUEBAS.md` resume lo efectivamente ejecutado y sus límites. Las pruebas de formularios interceptan respuestas o inyectan transportes: no envían mensajes reales ni sustituyen la prueba del proveedor.

## Dependencias

Lockfile incluido. La versión de sharp se unifica en 0.35.4 o superior para corregir el componente transitivo de Netlify. Quedan cinco avisos de severidad alta por la cadena de **extract-zip 2.0.1**, usada por las herramientas de emulación de Netlify; no hay versión corregida disponible al comprobar npm. No está incluido en el código SSR publicado y las funciones locales del adaptador están deshabilitadas (`devFeatures:false`). No se aplicó el downgrade incompatible sugerido por `npm audit --force`. Revalidar las actualizaciones antes del despliegue.

## Referencias técnicas consultadas

- [Astro: renderizado en servidor](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Astro: endpoints](https://docs.astro.build/en/guides/endpoints/)
- [Adaptador oficial Netlify](https://docs.astro.build/en/guides/integrations-guide/netlify/)
- [Adobe Source Serif](https://github.com/adobe-fonts/source-serif)
- [Brevo: doble confirmación](https://developers.brevo.com/reference/create-doi-contact)
- [Upstash: API REST](https://upstash.com/docs/redis/features/restapi)
