import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const base = process.env.TEST_URL || 'http://127.0.0.1:4322';
await page.goto(base);
// Public prelaunch has no subscription controls. Retain the live UI checks below
// for a separately configured local live fixture; never enable the public form.
if (!(await page.locator('[data-launch-form]').count())) {
  assert.equal(await page.locator('#launch-email').count(), 0);
  assert.match(
    await page.locator('#novedades').innerText(),
    /inscripciones no están abiertas/,
  );
  const response = await page.request.post(base + '/api/novedades', {
    form: { email: 'controlled@example.test', consent: 'yes' },
    headers: { Accept: 'application/json', Origin: base },
  });
  assert.equal(response.status(), 503);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addStyleTag({ content: 'html{zoom:2}' });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await browser.close();
  console.log(
    'Public prelaunch: no form, endpoint closed, 200% CSS zoom passed. Live form UI branch was not executed.',
  );
  process.exit(0);
}
await page.evaluate(() => document.fonts.ready);
console.log(
  'fallback-width-ratio',
  await page.evaluate(() => {
    const c = document.createElement('canvas').getContext('2d');
    const text =
      'Nos guía una forma de hacer: pensar cada proporción, atender a la materia.';
    c.font = '18px "Source Serif 4"';
    const w = c.measureText(text).width;
    c.font = '18px Georgia';
    return w / c.measureText(text).width;
  }),
);
// Test-only DOM enablement and intercepted responses; no real subscriptions or configuration changes.
await page.locator('fieldset').evaluate((el) => (el.disabled = false));
let requests = 0;
await page.route('**/api/novedades', async (route) => {
  requests++;
  await route.fulfill({
    status: 502,
    contentType: 'application/json',
    body: JSON.stringify({
      message:
        'No pudimos enviar la confirmación. Intentá de nuevo en unos minutos.',
    }),
  });
});
await page.locator('#launch-email').fill('incorrecto');
await page.locator('form button').click();
assert.equal(requests, 0);
await page.locator('#launch-email').fill('controlled@example.test');
await page.locator('input[name=consent]').check();
await page.locator('form button').click();
await page.waitForFunction(() =>
  document.querySelector('.form-status').textContent.includes('No pudimos'),
);
assert.equal(await page.locator('form button').isEnabled(), true);
await page.unroute('**/api/novedades');
let release;
const gate = new Promise((resolve) => (release = resolve));
await page.route('**/api/novedades', async (route) => {
  await gate;
  await route.fulfill({
    status: 202,
    contentType: 'application/json',
    body: JSON.stringify({
      message: 'Revisá tu correo para confirmar tu suscripción.',
    }),
  });
});
await page.locator('form button').click();
assert.equal(await page.locator('form').getAttribute('aria-busy'), 'true');
assert.equal(await page.locator('form button').isDisabled(), true);
release();
await page.waitForFunction(() =>
  document
    .querySelector('.form-status')
    .textContent.includes('Revisá tu correo'),
);
assert.equal(await page.locator('#launch-email').inputValue(), '');
await page.unroute('**/api/novedades');
await page.route('**/api/novedades', (route) => route.abort());
await page.locator('#launch-email').fill('controlled@example.test');
await page.locator('input[name=consent]').check();
await page.locator('form button').click();
await page.waitForFunction(() =>
  document
    .querySelector('.form-status')
    .textContent.includes('No pudimos conectar'),
);
assert.equal(await page.locator('form button').isEnabled(), true);
await page.setViewportSize({ width: 640, height: 900 });
await page.addStyleTag({ content: 'html{zoom:2}' });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
await browser.close();
console.log(
  'Form UI: invalid, pending, provider failure, retry, confirmation pending and network failure passed; 200% zoom passed.',
);
