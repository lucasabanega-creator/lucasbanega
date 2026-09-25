import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const run = (env) =>
  spawnSync(
    process.execPath,
    ['--input-type=module', '-e', "await import('./astro.config.mjs')"],
    { env: { ...process.env, ...env }, encoding: 'utf8' },
  );
test('production build refuses incomplete real data', () => {
  const r = run({ PUBLICATION_MODE: 'live', CONTEXT: 'production' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Publicación bloqueada/);
});
test('public prelaunch build allows a disabled newsletter without a preview password', () => {
  assert.equal(
    run({
      NETLIFY: 'true',
      PUBLICATION_MODE: 'public-prelaunch',
      CONTEXT: 'production',
      PREVIEW_PASSWORD: '',
    }).status,
    0,
  );
});
test('Netlify preview refuses missing password, including live deploy-preview context', () => {
  for (const mode of ['preview', 'live', 'public-prelaunch']) {
    const r = run({
      NETLIFY: 'true',
      PUBLICATION_MODE: mode,
      CONTEXT: 'deploy-preview',
      PREVIEW_PASSWORD: '',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /PREVIEW_PASSWORD/);
  }
});
test('configured password allows private preview build', () => {
  assert.equal(
    run({
      NETLIFY: 'true',
      PUBLICATION_MODE: 'preview',
      PREVIEW_PASSWORD: 'test-only-not-a-deploy-secret',
    }).status,
    0,
  );
});
