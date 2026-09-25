import { defineMiddleware } from 'astro:middleware';
import { site } from './lib/config';
export const onRequest = defineMiddleware(async ({ request }, next) => {
  if (!site.live && site.previewPassword) {
    const expected =
      'Basic ' +
      Buffer.from('preview:' + site.previewPassword).toString('base64');
    if (request.headers.get('authorization') !== expected)
      return new Response('Preview privada', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Lucas Banega Preview"',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        },
      });
  }
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  if (!site.live) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store');
  }
  return response;
});
