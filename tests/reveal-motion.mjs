// Visit the full page so axe measures settled content after its real reveal.
// Keep the motion CSS and every accessibility rule enabled.
export async function revealMotion(page) {
  const { max, step } = await page.evaluate(() => ({
    max: document.documentElement.scrollHeight - innerHeight,
    step: Math.max(1, Math.floor(innerHeight / 2)),
  }));
  for (let top = 0; top < max; top += step) {
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), top);
    await page.waitForTimeout(100);
  }
  await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), max);
  await page.waitForTimeout(100);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  try {
    await page.waitForFunction(() =>
      [...document.querySelectorAll('[data-motion]')].every(
        (element) => getComputedStyle(element).opacity === '1',
      ),
    );
  } catch (error) {
    const unrevealed = await page
      .locator('[data-motion]')
      .evaluateAll((elements) =>
        elements
          .filter((element) => getComputedStyle(element).opacity !== '1')
          .map((element) => ({
            text: element.textContent.trim(),
            opacity: getComputedStyle(element).opacity,
          })),
      );
    throw new Error(
      `Motion did not settle before axe: ${JSON.stringify(unrevealed)}`,
      {
        cause: error,
      },
    );
  }
}
