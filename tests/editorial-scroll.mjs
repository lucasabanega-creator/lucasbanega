import { chromium, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { revealMotion } from './reveal-motion.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:4322';
const results = [];
const failures = [];
await mkdir('test-results', { recursive: true });

// Browsers may omit the default proximity strictness when serializing CSS.
function snapMode(value) {
  if (value === 'y' || value === 'y proximity') return 'proximity';
  if (value === 'y mandatory') return 'mandatory';
  if (value === 'none') return 'none';
  assert.fail(`Unexpected scroll-snap-type: ${value}`);
}

// Scroll input goes through the browser, including CSS snapping and smooth
// anchor navigation. Poll for settled geometry rather than a fixed delay.
async function settle(page) {
  await page.evaluate(() => delete window.__editorialScrollTest);
  await page.waitForFunction(() => {
    const now = performance.now();
    const state = (window.__editorialScrollTest ||= { y: -1, since: now });
    if (Math.abs(state.y - scrollY) > 0.5) {
      state.y = scrollY;
      state.since = now;
    }
    // WebKit starts its proximity correction after a brief wheel quiet period.
    return now - state.since > 750;
  });
}

for (const [engine, type] of [
  ['Chromium', chromium],
  ['WebKit', webkit],
]) {
  const browser = await type.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    // Mobile WebKit's driver has no wheel or pan API. Test its responsive
    // viewport with native wheel input; Chromium also receives a touch pan.
    isMobile: engine === 'Chromium',
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  const snap = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollSnapType,
  );
  assert.equal(snapMode(snap), 'proximity');
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollPaddingTop,
    ),
    '0px',
  );
  assert.equal(
    await page
      .locator('.maker-screen')
      .first()
      .evaluate((element) => getComputedStyle(element).scrollSnapStop),
    'normal',
  );
  assert.ok(
    await page
      .locator('.campaign-hero')
      .evaluate(
        (element) => element.getBoundingClientRect().height >= innerHeight - 2,
      ),
  );

  for (const selector of [
    '.maker-screen',
    '.material-screen',
    '.campaign-feature',
    '.news-screen',
  ]) {
    assert.ok(
      await page
        .locator(selector)
        .first()
        .evaluate(
          (element) =>
            element.getBoundingClientRect().height >= innerHeight - 2,
        ),
      `${engine}: mobile chapter fits: ${selector}`,
    );
  }
  assert.equal(await page.locator('.editorial-chapter').count(), 5);
  const chapterStyles = await page
    .locator('.editorial-chapter')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        align: getComputedStyle(element).scrollSnapAlign,
        stop: getComputedStyle(element).scrollSnapStop,
      })),
    );
  for (const [index, style] of chapterStyles.entries()) {
    assert.equal(style.align, index === 4 ? 'none' : 'start');
    assert.equal(style.stop, 'normal');
  }
  assert.equal(await page.locator('#novedades').count(), 1);
  assert.equal(await page.locator('.news-screen#novedades').count(), 1);
  assert.equal(
    await page.locator('.news-screen .launch-section[id]').count(),
    0,
  );
  assert.equal(await page.locator('.maker-screen img').count(), 0);
  assert.equal(await page.locator('[data-launch-form]').count(), 0);
  assert.equal(
    await page
      .locator('.site-footer')
      .evaluate((element) => getComputedStyle(element).scrollSnapAlign),
    'none',
  );
  assert.equal(
    await page
      .locator('#materia')
      .evaluate((element) => getComputedStyle(element).scrollMarginTop),
    '64px',
  );

  const firstTarget = await page
    .locator('.maker-screen')
    .first()
    .evaluate((element) => element.getBoundingClientRect().top + scrollY);
  await page.mouse.wheel(0, firstTarget + 25);
  await page.waitForFunction(() => {
    const top = document
      .querySelector('.maker-screen')
      .getBoundingClientRect().top;
    return Math.abs(top) <= 2;
  });
  await settle(page);
  assert.ok(
    await page
      .locator('.maker-screen')
      .first()
      .evaluate((element) => {
        const top = element.getBoundingClientRect().top;
        return Math.abs(top) <= 2;
      }),
    `${engine}: first story must settle at the viewport edge`,
  );
  assert.ok(
    await page
      .locator('.maker-screen h2')
      .evaluate((element) => element.getBoundingClientRect().top >= 63.5),
    'Maker text stays below header',
  );
  await page.waitForFunction(() =>
    document
      .querySelector('.maker-screen')
      .classList.contains('motion-visible'),
  );
  assert.equal(
    await page
      .locator('.maker-screen')
      .first()
      .evaluate((element) => getComputedStyle(element).transform),
    'none',
    'Snap target stays stationary',
  );
  if (engine === 'Chromium')
    await page.screenshot({
      path: 'test-results/editorial-mobile-viewport.png',
    });

  const before = await page.evaluate(() => scrollY);
  const nextTarget = await page
    .locator('.material-screen')
    .evaluate((element) => element.getBoundingClientRect().top + scrollY);
  await page.mouse.wheel(0, 300);
  await settle(page);
  const after = await page.evaluate(() => scrollY);
  assert.ok(after > before, `${engine}: content responds to scroll input`);
  // Proximity may leave Chromium between stories or settle WebKit at the next
  // story. Both are valid; neither may skip beyond that next start.
  assert.ok(
    after >= firstTarget && after <= nextTarget,
    `${engine}: partial wheel stays between story starts; y=${after}, range=${firstTarget}–${nextTarget}`,
  );
  assert.equal(
    snapMode(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollSnapType,
      ),
    ),
    'proximity',
  );

  // A real Chromium touch sequence verifies that no handler captures the pan.
  if (engine === 'Chromium') {
    const session = await context.newCDPSession(page);
    const initial = await page.evaluate(() => scrollY);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 195, y: 650 }],
    });
    for (const y of [610, 570, 530, 490, 450]) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 195, y }],
      });
    }
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await settle(page);
    assert.ok(
      (await page.evaluate(() => scrollY)) > initial + 50,
      'Touch pan moves the page',
    );
  }

  await page.goto(base);
  await page.getByRole('button', { name: 'Menú', exact: true }).tap();
  await page.locator('dialog nav a[href="/#materia"]').tap();
  await settle(page);
  assert.equal(
    await page.locator('dialog').evaluate((element) => element.open),
    false,
  );
  assert.equal(
    await page
      .locator('#materia')
      .evaluate((element) => element === document.activeElement),
    true,
  );
  assert.ok(
    await page.locator('#materia').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 63.5 && rect.bottom <= innerHeight;
    }),
    'Materia anchor stays below the compact header',
  );
  await page.locator('.header-news').tap();
  await settle(page);
  assert.ok(
    await page.locator('.news-screen').evaluate((element) => {
      const top = element.getBoundingClientRect().top;
      const proposal = element
        .querySelector('.news-proposal')
        .getBoundingClientRect();
      return (
        Math.abs(top) <= 1 ||
        (proposal.top >= 63.5 && proposal.bottom <= innerHeight)
      );
    }),
    'News screen starts at the viewport edge or its proposal is fully below header',
  );
  assert.ok(
    await page.locator('#newsletter-title').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    }),
    'Newsletter heading is fully visible in the viewport',
  );
  await page.locator('.footer-bottom a').click();
  await settle(page);
  assert.equal(await page.evaluate(() => scrollY), 0);

  await page.goto(base);
  for (let tab = 0; tab < 18; tab++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        top: rect.top,
        label: element.textContent.trim(),
      };
    });
    assert.ok(focused.bottom > 0, `Keyboard target visible: ${focused.label}`);
  }
  await revealMotion(page);
  await settle(page);
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  assert.deepEqual(
    audit.violations.map(({ id }) => id),
    [],
  );

  // Native keyboard scrolling must remain available, with no scroll handler.
  for (const key of ['ArrowDown', 'PageDown', 'Space', 'ArrowUp', 'PageUp']) {
    await page.evaluate(() => {
      document.activeElement?.blur();
      scrollTo({ top: innerHeight * 2.5, behavior: 'instant' });
    });
    await settle(page);
    const start = await page.evaluate(() => scrollY);
    await page.keyboard.press(key);
    await settle(page);
    const end = await page.evaluate(() => scrollY);
    assert.ok(
      ['ArrowUp', 'PageUp'].includes(key) ? end < start : end > start,
      `${engine}: native ${key} scrolls`,
    );
  }

  const sizes = [];
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [844, 390],
    [1024, 768],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${engine}: horizontal overflow at ${width}x${height}`,
    );
    assert.equal(await page.locator('.editorial-chapter').count(), 5);
    assert.equal(
      snapMode(
        await page.evaluate(
          () => getComputedStyle(document.documentElement).scrollSnapType,
        ),
      ),
      height <= 700 ? 'none' : 'proximity',
    );
    if (height <= 700) {
      assert.equal(
        await page.evaluate(
          () => getComputedStyle(document.documentElement).scrollSnapType,
        ),
        'none',
      );
      assert.ok(
        await page
          .locator('.campaign-feature')
          .evaluate(
            (element) =>
              parseFloat(getComputedStyle(element).minHeight) >=
              innerHeight - 2,
          ),
      );
    }
    const hero = await page.locator('.campaign-hero').boundingBox();
    const title = await page.locator('.campaign-copy h1').boundingBox();
    const links = await page.locator('.campaign-links').boundingBox();
    assert.ok(
      title.y >= 79.5 && links.y + links.height <= hero.height + 1,
      `${engine}: cover content fits at ${width}x${height}`,
    );
    if (width === 320 && height === 568) {
      const feature = await page
        .locator('.campaign-feature')
        .evaluate((element) => ({
          top: element.getBoundingClientRect().top + scrollY,
          height: element.getBoundingClientRect().height,
          viewport: innerHeight,
        }));
      assert.ok(
        feature.height > feature.viewport,
        `${engine}: 320x568 feature must exceed viewport height`,
      );
      // Position only at the chapter start. Reach its content and the footer
      // through native wheel input, without focus, anchors or forced scrolling.
      await page.evaluate(
        (top) => scrollTo({ top, behavior: 'instant' }),
        feature.top,
      );
      await settle(page);
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - feature.top) <= 2,
        `${engine}: start at tall feature`,
      );
      const link = page.getByRole('link', {
        name: 'Conocer el primer objeto',
        exact: true,
      });
      let linkVisible = false;
      let final;
      const samples = [];
      const maxSteps = await page.evaluate(
        () => Math.ceil(document.documentElement.scrollHeight / 150) + 10,
      );
      for (let step = 0; step <= maxSteps; step++) {
        const visible = await link.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const headerBottom = document
            .querySelector('.site-header')
            .getBoundingClientRect().bottom;
          return (
            rect.top >= Math.max(0, headerBottom) - 0.5 &&
            rect.bottom <= innerHeight &&
            rect.left >= 0 &&
            rect.right <= innerWidth
          );
        });
        linkVisible ||= visible;
        final = await page.evaluate(() => ({
          y: scrollY,
          max: document.documentElement.scrollHeight - innerHeight,
        }));
        samples.push({ ...final, linkVisible: visible });
        if (final.y === final.max) break;
        await page.mouse.wheel(0, 150);
        await settle(page);
      }
      const tallContent = {
        viewport: '320x568',
        featureHeight: feature.height,
        linkVisible,
        ...final,
        samples,
      };
      results.push({ engine, tallContent });
      if (!linkVisible)
        failures.push(
          `${engine}: tall feature link never fully visible with 150px wheel steps`,
        );
      if (final.y !== final.max)
        failures.push(
          `${engine}: footer unreachable by wheel: scrollY=${final.y}, expected=${final.max}`,
        );
    }
    if (width === 768)
      assert.equal(
        await page
          .locator('.campaign-feature')
          .evaluate(
            (element) =>
              getComputedStyle(element).gridTemplateColumns.split(' ').length,
          ),
        2,
      );
    if (width >= 1024) {
      const desktopSnap = await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollSnapType,
      );
      assert.ok(snapMode(desktopSnap) === 'proximity', desktopSnap);
    }
    await page.screenshot({
      path: `test-results/editorial-${engine.toLowerCase()}-${width}.png`,
      fullPage: true,
    });
    sizes.push(`${width}x${height}`);
  }

  {
    // A resized touch context remains tactile: use a separate desktop context.
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      hasTouch: false,
      isMobile: false,
    });
    const desktopPage = await desktop.newPage();
    await desktopPage.goto(base);
    await desktopPage.evaluate(() => document.fonts.ready);
    assert.equal(
      await desktopPage.evaluate(
        () => matchMedia('(hover: hover) and (pointer: fine)').matches,
      ),
      true,
    );
    assert.equal(
      snapMode(
        await desktopPage.evaluate(
          () => getComputedStyle(document.documentElement).scrollSnapType,
        ),
      ),
      'none',
    );
    assert.equal(
      await desktopPage.evaluate(() =>
        document.documentElement.classList.contains('chapter-scroll-ready'),
      ),
      true,
    );
    // A small gesture advances a whole screen; its inertia never skips one.
    await desktopPage.mouse.move(720, 450);
    for (const delta of [50, 36, 24, 16, 10, 7, 4, 2, 1]) {
      await desktopPage.mouse.wheel(0, delta);
      await desktopPage.waitForTimeout(65);
    }
    await settle(desktopPage);
    assert.ok(
      Math.abs(
        await desktopPage
          .locator('.maker-screen')
          .evaluate((element) => element.getBoundingClientRect().top),
      ) <= 2,
      `${engine}: trackpad gesture lands on the next chapter`,
    );
    await desktopPage.mouse.wheel(0, -50);
    await settle(desktopPage);
    assert.ok(
      await desktopPage.evaluate(() => scrollY <= 2),
      `${engine}: upward wheel returns to the cover`,
    );
    // The narrower in-app panel still supports wheel chapters.
    await desktopPage.setViewportSize({ width: 859, height: 817 });
    await desktopPage.mouse.wheel(0, 50);
    await settle(desktopPage);
    assert.ok(
      Math.abs(
        await desktopPage
          .locator('.maker-screen')
          .evaluate((element) => element.getBoundingClientRect().top),
      ) <= 2,
      `${engine}: chapter navigation works in the preview panel`,
    );
    await desktopPage.setViewportSize({ width: 1440, height: 900 });
    await desktopPage.goto(base);
    await desktopPage.mouse.wheel(0, 50);
    await desktopPage.waitForTimeout(200);
    await desktopPage.keyboard.press('Home');
    await settle(desktopPage);
    assert.ok(
      await desktopPage.evaluate(() => scrollY <= 2),
      `${engine}: keyboard interrupts wheel animation`,
    );
    results.push({
      engine,
      desktopChapters: {
        inertia: 'passed',
        upwardWheel: 'passed',
        previewPanel: '859x817 passed',
        keyboardInterruption: 'passed',
      },
    });
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
      [1366, 768],
    ]) {
      await desktopPage.setViewportSize({ width, height });
      for (const selector of [
        '.campaign-hero',
        '.maker-screen',
        '.material-screen',
        '.campaign-feature',
        '.news-screen',
      ]) {
        assert.ok(
          await desktopPage
            .locator(selector)
            .evaluate(
              (element) =>
                element.getBoundingClientRect().height >= innerHeight - 2,
            ),
          `Desktop chapter fits: ${selector} at ${width}x${height}`,
        );
      }
    }
    await desktopPage.setViewportSize({ width: 1440, height: 600 });
    assert.equal(
      snapMode(
        await desktopPage.evaluate(
          () => getComputedStyle(document.documentElement).scrollSnapType,
        ),
      ),
      'none',
    );
    await desktopPage.setViewportSize({ width: 1440, height: 900 });
    await desktopPage.goto(base);
    await desktopPage.evaluate(() => document.fonts.ready);
    for (let step = 0; step < 12; step++) {
      await desktopPage.mouse.wheel(0, 500);
      await desktopPage.waitForTimeout(1000);
    }
    await settle(desktopPage);
    const desktopFooter = await desktopPage.evaluate(() => {
      const rect = document
        .querySelector('.site-footer')
        .getBoundingClientRect();
      const headerBottom = document
        .querySelector('.site-header')
        .getBoundingClientRect().bottom;
      return {
        y: scrollY,
        max: document.documentElement.scrollHeight - innerHeight,
        visible:
          rect.top >= Math.max(0, headerBottom) - 0.5 &&
          rect.bottom <= innerHeight + 1,
      };
    });
    assert.ok(
      Math.abs(desktopFooter.y - desktopFooter.max) <= 1,
      `${engine}: desktop footer reached after 12 wheels: ${JSON.stringify(desktopFooter)}`,
    );
    assert.ok(desktopFooter.visible, `${engine}: desktop footer fully visible`);
    results.push({
      engine,
      desktopFooter: { viewport: '1440x900', ...desktopFooter },
    });
    await desktopPage.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(
      await desktopPage.evaluate(
        () => getComputedStyle(document.documentElement).scrollSnapType,
      ),
      'none',
    );
    await desktop.close();
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollSnapType,
      ),
      'none',
    );
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      'auto',
    );
    assert.equal(
      await page
        .locator('.material-screen img')
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
      'none',
    );
  }
  const motionStyles = await page
    .locator('[data-motion]')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          opacity: style.opacity,
          transform: style.transform,
          transition: style.transitionDuration,
          animation: style.animationName,
        };
      }),
    );
  for (const style of motionStyles) {
    assert.equal(style.opacity, '1');
    assert.equal(style.transform, 'none');
    assert.equal(style.transition, '0s');
    assert.equal(style.animation, 'none');
  }
  const reducedContext = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(base);
  assert.equal(
    await reducedPage.evaluate(
      () => getComputedStyle(document.documentElement).scrollSnapType,
    ),
    'none',
  );
  assert.ok(
    await reducedPage
      .locator('[data-motion]')
      .evaluateAll((elements) =>
        elements.every(
          (element) =>
            getComputedStyle(element).opacity === '1' &&
            getComputedStyle(element).transform === 'none',
        ),
      ),
  );
  assert.equal(
    await reducedPage.evaluate(() =>
      document.documentElement.classList.contains('motion-ready'),
    ),
    false,
  );
  await reducedContext.close();

  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const fallback = await nojs.newPage();
  await fallback.goto(base);
  assert.equal(await fallback.locator('.nojs-nav').isVisible(), true);
  assert.equal(
    await fallback
      .locator('[data-motion]')
      .first()
      .evaluate((element) => getComputedStyle(element).opacity),
    '1',
  );
  assert.ok(
    await fallback
      .locator('[data-motion]')
      .evaluateAll((elements) =>
        elements.every(
          (element) =>
            getComputedStyle(element).opacity === '1' &&
            getComputedStyle(element).transform === 'none',
        ),
      ),
  );
  await nojs.close();
  assert.deepEqual(errors, []);
  results.push({
    engine,
    sizes,
    snapping: 'passed',
    partialWheelSnap: 'passed',
    partialWheelPosition: { before, after, firstTarget, nextTarget },
    touchPan: engine === 'Chromium' ? 'passed' : 'not supported by test driver',
    anchors: 'passed',
    keyboard: 'passed',
    reducedMotion: 'passed',
    accessibility: 'passed',
    errors,
  });
  await browser.close();
}

await writeFile(
  'test-results/editorial-scroll.json',
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));

assert.deepEqual(failures, [], 'Editorial scrolling requirements');
