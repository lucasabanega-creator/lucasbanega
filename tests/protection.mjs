import assert from 'node:assert/strict';
process.env.PREVIEW_PASSWORD = 'test-only-not-a-deploy-secret';
const { createHandler } = await import('../.netlify/build/entry.mjs');
const handler = createHandler({});
const origin = 'https://lucasbanega.com';
const denied = await handler(new Request(origin), { ip: '127.0.0.1' });
assert.equal(denied.status, 401);
assert.equal(denied.headers.get('X-Robots-Tag'), 'noindex, nofollow');
const allowed = await handler(
  new Request(origin, {
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from('preview:' + process.env.PREVIEW_PASSWORD).toString(
          'base64',
        ),
    },
  }),
  { ip: '127.0.0.1' },
);
assert.equal(allowed.status, 200);
assert.equal(allowed.headers.get('Cache-Control'), 'no-store');
console.log(
  'Compiled middleware: unauthorized 401, authenticated 200, noindex and no-store passed.',
);
