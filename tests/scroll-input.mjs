import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:4322';
const results = [];
await mkdir('test-results', { recursive: true });
for (const [engine, type] of [
  ['Chromium', chromium],
  ['WebKit', webkit],
]) {
  const browser = await type.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const reset = async () => {
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(720, 450);
  };
  const position = () => page.evaluate(() => scrollY);
  await reset();
  // Continuous deliberate input must progress without a required quiet gap.
  for (let i = 0; i < 60; i++) {
    await page.mouse.wheel(0, 8);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(1100);
  const continuous = await position();
  assert.ok(
    continuous >= 1800,
    `${engine}: continuous wheel stuck at ${continuous}`,
  );
  await reset();
  await page.mouse.wheel(0, 50);
  await page.waitForTimeout(400);
  const reversingFrom = await position();
  assert.ok(reversingFrom > 0 && reversingFrom < 900);
  await page.mouse.wheel(0, -50);
  await page.waitForTimeout(1100);
  assert.ok((await position()) <= 2, `${engine}: reverse input ignored`);
  await reset();
  await page.mouse.wheel(0, 12);
  await page.waitForTimeout(1100);
  assert.ok(
    Math.abs((await position()) - 900) <= 2,
    `${engine}: short wheel swallowed`,
  );
  // Two separate gestures, and a new impulse just after the first arrival.
  await page.mouse.wheel(0, 50);
  await page.waitForTimeout(890);
  await page.mouse.wheel(0, 50);
  await page.waitForTimeout(1100);
  assert.ok(
    Math.abs((await position()) - 2700) <= 2,
    `${engine}: fresh gesture swallowed`,
  );
  // A short burst and decreasing inertia remain one chapter.
  await reset();
  for (const delta of [50, 36, 24, 16, 10, 7, 4, 2, 1]) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(65);
  }
  await page.waitForTimeout(1100);
  assert.ok(
    Math.abs((await position()) - 900) <= 2,
    `${engine}: inertia skipped a chapter`,
  );
  // The rail cancels an animation; the next wheel is immediately available.
  await page.mouse.wheel(0, 50);
  await page.waitForTimeout(250);
  await page.locator('.chapter-rail a[href="#primer-objeto"]').click();
  await page.waitForTimeout(1200);
  assert.ok(Math.abs((await position()) - 2700) <= 2);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 12);
  await page.waitForTimeout(1100);
  assert.ok(Math.abs((await position()) - 3600) <= 2);
  // Footer exceptions run before any inertia guard, even with rapid input.
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 50);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(300);
  const footer = await page.evaluate(() => ({
    y: scrollY,
    max: document.documentElement.scrollHeight - innerHeight,
  }));
  assert.ok(
    Math.abs(footer.y - footer.max) <= 1,
    `${engine}: footer trapped: ${JSON.stringify(footer)}`,
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(
    () => !document.documentElement.classList.contains('chapter-scroll-ready'),
  );
  assert.equal(
    await page.evaluate(() =>
      document.documentElement.classList.contains('chapter-scroll-ready'),
    ),
    false,
  );
  assert.deepEqual(errors, []);
  results.push({
    engine,
    continuous,
    reverse: 'passed',
    shortGesture: 'passed',
    nextGesture: 'passed',
    decayingInertia: 'passed',
    railCancellation: 'passed',
    footer,
    reducedMotion: 'passed',
    errors,
  });
  await browser.close();
}
await writeFile(
  'test-results/scroll-input.json',
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
