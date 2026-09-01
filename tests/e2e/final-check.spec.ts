import { test, expect } from '@playwright/test';

const BASE = 'https://artigocomcafe.com';

test('CategoryNav renders and has 8 buttons', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait for hydration + page-load event
  await page.waitForTimeout(4000);

  const nav = page.locator('.category-nav');
  await expect(nav).toBeVisible({ timeout: 10000 });

  const btns = page.locator('.category-nav-item');
  await expect(btns).toHaveCount(8);

  const labels = await page.locator('.category-nav-label').allTextContents();
  expect(labels).toEqual(['Feed','Tecnologia','Finanças','Educação','Produtividade','Receitas','Livros','Café']);
});

test('CategoryNav stays after page-load event', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  const btns = await page.locator('.category-nav-item').count();
  console.log(`After 6s: ${btns} buttons`);
  expect(btns).toBe(8);
});

test('No loadJornadaData errors in console', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const jornadaErrors = errors.filter(e => e.includes('loadJornadaData'));
  console.log(`loadJornadaData errors: ${jornadaErrors.length}`);
  expect(jornadaErrors).toHaveLength(0);
});
