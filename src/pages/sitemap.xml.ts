import type { APIRoute } from 'astro';
import { site } from '../lib/config';
export const GET: APIRoute = () =>
  new Response(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      (site.live
        ? ['/', '/maison', '/primer-objeto', '/contacto', '/privacidad']
            .map((path) => `<url><loc>${site.url}${path}</loc></url>`)
            .join('')
        : '') +
      '</urlset>',
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
