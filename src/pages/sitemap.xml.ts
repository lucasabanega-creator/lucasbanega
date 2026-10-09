import type { APIRoute } from 'astro';
import { site } from '../lib/config';
// Fecha de la última modificación real de cada página (AAAA-MM-DD).
// Actualizar al cambiar el contenido de la página correspondiente.
const pages: [path: string, lastmod: string][] = [
  ['/', '2026-10-08'],
  ['/maison', '2026-10-08'],
  ['/primer-objeto', '2026-10-08'],
  ['/contacto', '2026-10-08'],
  ['/privacidad', '2026-10-08'],
];
export const GET: APIRoute = () =>
  new Response(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      (site.public
        ? pages
            .map(
              ([path, lastmod]) =>
                `<url><loc>${site.url}${path}</loc><lastmod>${lastmod}</lastmod></url>`,
            )
            .join('')
        : '') +
      '</urlset>',
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
