import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  subscribe,
  servicesFor,
  pendingMessage,
} from '../src/lib/subscription.mjs';
const origin = 'https://lucasbanega.com';
const config = { enabled: true, origin };
function request(values = {}, headers = {}) {
  return new Request(origin + '/api/novedades', {
    method: 'POST',
    headers: { Origin: origin, ...headers },
    body: new URLSearchParams({
      email: 'controlled@example.test',
      consent: 'yes',
      ...values,
    }),
  });
}
let sent = 0;
const services = {
  allow: async () => true,
  send: async () => {
    sent++;
    return true;
  },
};
test('preview refuses data without invoking a provider', async () => {
  sent = 0;
  assert.equal(
    (await subscribe(request(), { ...config, enabled: false }, services))
      .status,
    503,
  );
  assert.equal(sent, 0);
});
test('rejects missing consent, invalid email, honeypot and foreign origin', async () => {
  for (const [values, status] of [
    [{ consent: '' }, 422],
    [{ email: 'wrong' }, 422],
    [{ website: 'bot' }, 422],
  ])
    assert.equal(
      (await subscribe(request(values), config, services)).status,
      status,
    );
  assert.equal(
    (
      await subscribe(
        request({}, { Origin: 'https://foreign.test' }),
        config,
        services,
      )
    ).status,
    403,
  );
});
test('bounds streamed payloads even without Content-Length', async () => {
  assert.equal(
    (await subscribe(request({ extra: 'x'.repeat(9000) }), config, services))
      .status,
    413,
  );
});
test('only provider acceptance yields pending, never subscribed', async () => {
  const result = await subscribe(request(), config, services);
  assert.equal(result.status, 202);
  assert.equal(result.message, pendingMessage);
});
test('rate limits before provider and permits retry after failure', async () => {
  sent = 0;
  assert.equal(
    (
      await subscribe(request(), config, {
        ...services,
        allow: async () => false,
      })
    ).status,
    429,
  );
  assert.equal(sent, 0);
  assert.equal(
    (
      await subscribe(request(), config, {
        ...services,
        send: async () => false,
      })
    ).status,
    502,
  );
  assert.equal(
    (
      await subscribe(request(), config, {
        ...services,
        send: async () => {
          throw new Error('private provider details');
        },
      })
    ).status,
    503,
  );
  assert.equal((await subscribe(request(), config, services)).status, 202);
});
test('provider and atomic durable limiter requests use correct payload; secrets stay server side', async () => {
  const env = (k) =>
    ({
      BREVO_API_KEY: 'test-secret',
      BREVO_LIST_ID: '12',
      BREVO_TEMPLATE_ID: '34',
      UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
      UPSTASH_REDIS_REST_URL: 'https://controlled.upstash.io',
    })[k];
  const calls = [];
  const transport = async (url, options) => {
    calls.push({ url, options });
    return url.includes('upstash')
      ? Response.json({ result: 1 })
      : new Response(null, { status: 204 });
  };
  const s = servicesFor(env, '127.0.0.1', origin, transport);
  assert.equal(await s.allow(), true);
  assert.equal(await s.send('controlled@example.test'), true);
  const redis = JSON.parse(calls[0].options.body);
  assert.equal(redis[0], 'EVAL');
  assert.ok(!calls[0].options.body.includes('127.0.0.1'));
  const payload = JSON.parse(calls[1].options.body);
  assert.deepEqual(payload.includeListIds, [12]);
  assert.equal(payload.templateId, 34);
  assert.equal(payload.redirectionUrl, origin + '/contacto');
});
test('limiter outage fails closed without sending', async () => {
  sent = 0;
  assert.equal(
    (
      await subscribe(request(), config, {
        ...services,
        allow: async () => {
          throw new Error('offline');
        },
      })
    ).status,
    503,
  );
  assert.equal(sent, 0);
});
