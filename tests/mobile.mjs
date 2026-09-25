import { chromium, webkit, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const results = [];
const base = process.env.TEST_URL || 'http://127.0.0.1:4322';
for (const [name, type, device] of [
  ['WebKit / iPhone 13', webkit, devices['iPhone 13']],
  ['Chromium / Pixel 7', chromium, devices['Pixel 7']],
]) {
  const browser = await type.launch();
  const context = await browser.newContext({ ...device });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const route of [
    '/',
    '/maison',
    '/primer-objeto',
    '/contacto',
    '/privacidad',
  ]) {
    await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${name} ${route}`,
    );
  }
  await page.goto(base);
  await page.getByRole('button', { name: 'Menú', exact: true }).tap();
  assert.equal(await page.locator('dialog').evaluate((e) => e.open), true);
  await page.getByRole('button', { name: 'Cerrar' }).tap();
  assert.equal(await page.locator('dialog').evaluate((e) => e.open), false);
  assert.deepEqual(errors, []);
  results.push({ engine: name, routes: 5, touchMenu: 'passed', errors });
  await browser.close();
}
await writeFile('test-results/mobile.json', JSON.stringify(results, null, 2));
console.log(results);
