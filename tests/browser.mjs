import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const results = { widths: [], pages: [], accessibility: [], errors };
for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('h1').count(), 1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  assert.equal(overflow, false, `Overflow ${width}`);
  assert.equal(await page.locator('input[type=email]').isDisabled(), true);
  if (width === 390 || width === 1440)
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  results.widths.push({ width, overflow });
  if (width === 390 || width === 1440) {
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    results.accessibility.push({
      width,
      violations: audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    });
    assert.deepEqual(audit.violations, [], `Accessibility ${width}`);
  }
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base);
const trigger = page.getByRole('button', { name: 'Menú', exact: true });
await trigger.click();
assert.equal(await page.locator('dialog').evaluate((e) => e.open), true);
await page.keyboard.press('Shift+Tab');
assert.equal(
  await page.evaluate(() =>
    document.activeElement.textContent.trim().includes('Contacto'),
  ),
  true,
);
await page.keyboard.press('Tab');
assert.equal(
  await page
    .getByRole('button', { name: 'Cerrar' })
    .evaluate((e) => e === document.activeElement),
  true,
);
await page.keyboard.press('Escape');
assert.equal(await trigger.evaluate((e) => e === document.activeElement), true);
await trigger.click();
await page
  .locator('dialog')
  .getByRole('link', { name: /Novedades/ })
  .click();
assert.equal(await page.locator('dialog').evaluate((e) => e.open), false);
assert.ok(page.url().endsWith('#novedades'));
for (const route of [
  '/',
  '/maison',
  '/primer-objeto',
  '/contacto',
  '/privacidad',
  '/missing-page',
]) {
  const response = await page.goto(base + route);
  assert.equal(response.status(), route === '/missing-page' ? 404 : 200);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(
    await page.locator('meta[name=robots]').getAttribute('content'),
    'noindex, nofollow',
  );
  const links = await page
    .locator('a[href]')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const href of new Set(
    links.filter((h) => h.startsWith('/') && !h.includes('#')),
  )) {
    const res = await page.request.get(base + href);
    assert.equal(res.status(), 200, href);
  }
  const broken = await page
    .locator('img')
    .evaluateAll((imgs) =>
      imgs.filter((i) => i.complete && !i.naturalWidth).map((i) => i.src),
    );
  assert.deepEqual(broken, []);
  results.pages.push({ route, status: response.status() });
}
await page.goto(base);
await page.emulateMedia({ reducedMotion: 'reduce' });
assert.equal(
  await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  ),
  'auto',
);
await page.setViewportSize({ width: 320, height: 900 });
await page.addStyleTag({ content: 'body{font-size:200%}' });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
const resp = await page.request.post(base + '/api/novedades', {
  form: { email: 'controlled@example.test', consent: 'yes' },
  headers: { Accept: 'application/json', Origin: base },
});
assert.equal(resp.status(), 503);
const sitemap = await (await page.request.get(base + '/sitemap.xml')).text();
assert.ok(!sitemap.includes('<loc>'));
for (const path of [
  '/favicon.ico',
  '/favicon-96.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/fonts/source-serif-4-latin-variable.woff2',
  '/images/social.jpg',
])
  assert.equal((await page.request.get(base + path)).status(), 200);
const nojs = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 390, height: 844 },
});
const np = await nojs.newPage();
await np.goto(base);
assert.equal(await np.locator('.nojs-nav').isVisible(), true);
assert.equal(await np.locator('h1').isVisible(), true);
await nojs.close();
assert.deepEqual(errors, []);
await browser.close();
await writeFile('test-results/browser.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
