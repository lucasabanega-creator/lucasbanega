import { createHmac } from 'node:crypto';
const failure = (status, message) => ({ status, message });
export const pendingMessage = 'Revisá tu correo para confirmar tu suscripción.';
/** Pure server handler; injected services let tests avoid sending real emails. */
export async function subscribe(request, config, services) {
  if (!config.enabled)
    return failure(
      503,
      'Las inscripciones todavía no están abiertas. Intentá más adelante.',
    );
  if (request.headers.get('origin') !== config.origin)
    return failure(
      403,
      'No pudimos verificar la solicitud. Volvé a abrir el formulario.',
    );
  if (
    !/^(multipart\/form-data|application\/x-www-form-urlencoded)(;|$)/i.test(
      request.headers.get('content-type') || '',
    )
  )
    return failure(415, 'Formato de solicitud no válido.');
  if (Number(request.headers.get('content-length')) > 8192)
    return failure(413, 'La solicitud es demasiado extensa.');
  let data;
  try {
    // Limit actual bytes, including requests without a Content-Length header.
    const reader = request.body?.getReader();
    if (!reader) return failure(400, 'Completá el formulario.');
    const chunks = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 8192) {
        await reader.cancel();
        return failure(413, 'La solicitud es demasiado extensa.');
      }
      chunks.push(value);
    }
    data = await new Response(Buffer.concat(chunks), {
      headers: { 'Content-Type': request.headers.get('content-type') },
    }).formData();
  } catch {
    return failure(400, 'No pudimos leer la solicitud. Intentá de nuevo.');
  }
  const email = data.get('email');
  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.trim())
  )
    return failure(422, 'Ingresá un correo electrónico válido.');
  if (data.get('consent') !== 'yes')
    return failure(
      422,
      'Necesitamos tu consentimiento para enviarte novedades.',
    );
  if (data.get('website'))
    return failure(422, 'No pudimos verificar la solicitud.');
  try {
    if (!(await services.allow()))
      return failure(
        429,
        'Recibimos varias solicitudes. Esperá unos minutos antes de volver a intentar.',
      );
    const accepted = await services.send(email.trim());
    if (!accepted)
      return failure(
        502,
        'No pudimos enviar la confirmación. Intentá de nuevo en unos minutos.',
      );
    return { status: 202, message: pendingMessage };
  } catch {
    return failure(
      503,
      'No pudimos conectar con el servicio. Intentá de nuevo en unos minutos.',
    );
  }
}
export function servicesFor(env, ip, origin, transport = fetch) {
  return {
    async allow() {
      const key =
        'lb:signup:' +
        createHmac('sha256', env('UPSTASH_REDIS_REST_TOKEN'))
          .update(ip)
          .digest('hex');
      const response = await transport(env('UPSTASH_REDIS_REST_URL'), {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + env('UPSTASH_REDIS_REST_TOKEN'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          'EVAL',
          "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],600) end; return n",
          '1',
          key,
        ]),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error('Limiter unavailable');
      const data = await response.json();
      if (typeof data.result !== 'number')
        throw new Error('Invalid limiter response');
      return data.result <= 5;
    },
    async send(email) {
      const response = await transport(
        'https://api.brevo.com/v3/contacts/doubleOptinConfirmation',
        {
          method: 'POST',
          headers: {
            'api-key': env('BREVO_API_KEY'),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email,
            includeListIds: [Number(env('BREVO_LIST_ID'))],
            templateId: Number(env('BREVO_TEMPLATE_ID')),
            redirectionUrl: origin + '/contacto',
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      return response.status === 201 || response.status === 204;
    },
  };
}
