import { test } from '@playwright/test';

test('debug category nav', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('https://artigocomcafe.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const ssrNav = await page.locator('nav.category-nav').count();
  const ssrBtns = await page.locator('.category-nav-item').count();
  console.log(`SSR nav: ${ssrNav}, buttons: ${ssrBtns}`);

  const islands = await page.locator('astro-island').count();
  console.log(`Islands: ${islands}`);

  const categoryIsland = await page.evaluate(() => {
    const el = document.querySelector('astro-island[component-url*="CategoryNav"]');
    return el ? { html: el.innerHTML.substring(0, 200) } : null;
  });
  console.log(`CategoryNav island:`, categoryIsland);

  console.log(`Page errors:`, errors);
});
