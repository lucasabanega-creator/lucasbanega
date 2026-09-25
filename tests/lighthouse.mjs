import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless', '--no-sandbox'],
});
try {
  const result = await lighthouse('http://127.0.0.1:4322', {
    port: chrome.port,
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });
  await writeFile('test-results/lighthouse.html', result.report);
  const a = result.lhr.audits;
  const summary = {
    mode: 'Mobile simulated throttling; local compiled Netlify handler; preview noindex',
    scores: Object.fromEntries(
      Object.entries(result.lhr.categories).map(([k, v]) => [k, v.score]),
    ),
    LCP: a['largest-contentful-paint'].numericValue,
    CLS: a['cumulative-layout-shift'].numericValue,
    TBT: a['total-blocking-time'].numericValue,
    failed: Object.entries(a)
      .filter(([, v]) => v.score !== null && v.score < 1)
      .map(([k, v]) => ({
        id: k,
        title: v.title,
        displayValue: v.displayValue,
      })),
  };
  await writeFile(
    'test-results/lighthouse.json',
    JSON.stringify(summary, null, 2),
  );
  console.log(summary);
} finally {
  chrome.kill();
}
