import type { APIRoute } from 'astro';
import { site, serverEnv } from '../../lib/config';
import { subscribe, servicesFor } from '../../lib/subscription.mjs';
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const result = await subscribe(
    request,
    { enabled: site.newsletter, origin: site.url },
    servicesFor(serverEnv, clientAddress, site.url),
  );
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  };
  if (result.status === 429) headers['Retry-After'] = '600';
  if (request.headers.get('accept')?.includes('application/json'))
    return Response.json(
      { message: result.message },
      { status: result.status, headers },
    );
  headers['Content-Type'] = 'text/html; charset=utf-8';
  return new Response(
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Novedades | Lucas Banega</title><link rel="stylesheet" href="https://use.typekit.net/jme3jsg.css"><link rel="stylesheet" href="/form-result.css"><main><p>Lucas Banega</p><h1>${result.status === 202 ? 'Un paso más.' : 'Tu solicitud'}</h1><p role="status">${result.message}</p><a href="/#novedades">Volver al formulario</a></main></html>`,
    { status: result.status, headers },
  );
};
export const ALL: APIRoute = () =>
  new Response('Método no permitido', {
    status: 405,
    headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
  });
