import { chromium, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { revealMotion } from './reveal-motion.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:4322';
const results = [];
await mkdir('test-results', { recursive: true });
for (const [engine, type] of [
  ['Chromium', chromium],
  ['WebKit', webkit],
]) {
  const browser = await type.launch();
  const context = await browser.newContext({
    viewport: { width: 1006, height: 817 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  const rail = page.getByRole('navigation', {
    name: 'Capítulos de la portada',
  });
  assert.equal(await rail.getByRole('link').count(), 5);
  assert.equal(
    await rail.locator('[aria-current]').getAttribute('href'),
    '#inicio',
  );
  await page.mouse.move(500, 400);
  for (const id of ['autor', 'materia-y-gesto', 'primer-objeto']) {
    await page.mouse.wheel(0, 50);
    await page.waitForTimeout(1200);
    assert.equal(
      await rail.locator('[aria-current]').getAttribute('href'),
      `#${id}`,
    );
    assert.ok(
      Math.abs(
        await page
          .locator(`#${id}`)
          .evaluate((el) => el.getBoundingClientRect().top),
      ) <= 2,
    );
  }
  for (const width of [768, 859, 1006, 1440]) {
    await page.setViewportSize({ width, height: 817 });
    await rail
      .getByRole('link', { name: 'El primer objeto', exact: true })
      .click();
    await page.waitForTimeout(1200);
    assert.ok(
      await page.locator('.campaign-feature img').evaluate(async (image) => {
        await image.decode();
        return image.naturalWidth > 0;
      }),
      `${engine}: first object image loaded`,
    );
    const geometry = await page.locator('.campaign-feature').evaluate((el) => {
      const box = el.getBoundingClientRect();
      const railLeft = document
        .querySelector('.chapter-rail a[aria-current] span')
        .getBoundingClientRect().left;
      const children = [
        ...el.querySelectorAll('img, .campaign-feature-copy'),
      ].map((child) => child.getBoundingClientRect());
      return {
        height: box.height,
        top: box.top,
        fits: children.every(
          (rect) =>
            rect.top >= 64 &&
            rect.bottom <= innerHeight &&
            rect.right < railLeft,
        ),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.ok(Math.abs(geometry.top) <= 2);
    assert.ok(
      geometry.height <= 818 && geometry.fits && !geometry.overflow,
      `${engine} ${width}: ${JSON.stringify(geometry)}`,
    );
    if (width === 1006 || width === 1440)
      await page.screenshot({
        path: `test-results/chapter-feature-${engine.toLowerCase()}-${width}.png`,
      });
  }
  await page.keyboard.press('Tab');
  await rail.getByRole('link', { name: 'Materia y gesto' }).focus();
  assert.equal(
    await rail
      .getByRole('link', { name: 'Materia y gesto' })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
    'solid',
  );
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    'materia-y-gesto',
  );
  assert.equal(
    await rail.locator('[aria-current]').getAttribute('href'),
    '#materia-y-gesto',
  );
  await revealMotion(page);
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  assert.deepEqual(
    audit.violations.map((v) => v.id),
    [],
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await rail
    .getByRole('link', { name: 'El primer objeto', exact: true })
    .click();
  assert.ok(
    Math.abs(
      await page
        .locator('#primer-objeto')
        .evaluate((el) => el.getBoundingClientRect().top),
    ) <= 2,
  );
  assert.equal(
    await rail
      .locator('span')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    '0s',
  );
  for (const [width, height] of [
    [390, 844],
    [320, 568],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await rail
      .getByRole('link', { name: 'El primer objeto', exact: true })
      .click();
    const separate = await page.locator('.campaign-feature').evaluate((el) => {
      const railLeft = document
        .querySelector('.chapter-rail span')
        .getBoundingClientRect().left;
      return [...el.querySelectorAll('img, .campaign-feature-copy')].every(
        (child) => child.getBoundingClientRect().right < railLeft,
      );
    });
    assert.ok(separate, `${engine}: mobile content stays clear of rail`);
    assert.equal(
      await rail
        .locator('a')
        .first()
        .evaluate((el) => el.getBoundingClientRect().width),
      44,
    );
  }
  const nojs = await browser.newPage({ javaScriptEnabled: false });
  await nojs.goto(base);
  await nojs.locator('.chapter-rail a[href="#primer-objeto"]').click();
  assert.ok(nojs.url().endsWith('#primer-objeto'));
  assert.deepEqual(errors, []);
  results.push({
    engine,
    activeChapter: 'passed',
    featureFits: 'passed',
    railClearance: 'passed',
    keyboard: 'passed',
    reducedMotion: 'passed',
    noJavaScript: 'passed',
    accessibility: 'passed',
    errors,
  });
  await browser.close();
}
await writeFile(
  'test-results/chapter-rail.json',
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
