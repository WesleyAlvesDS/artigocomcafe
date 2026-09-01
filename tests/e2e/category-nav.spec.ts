import { test, expect } from '@playwright/test';

test('CategoryNav not duplicated on home', async ({ page }) => {
  await page.goto('https://artigocomcafe.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait for React hydration
  await page.waitForTimeout(3000);
  
  const navCount = await page.locator('.category-nav').count();
  const btnCount = await page.locator('.category-nav-item').count();
  const labels = await page.locator('.category-nav-label').allTextContents();
  
  console.log(`nav: ${navCount}, buttons: ${btnCount}, labels: ${JSON.stringify(labels)}`);
  
  expect(navCount).toBe(1);
  expect(btnCount).toBe(8);
  expect(labels).toEqual(['Feed', 'Tecnologia', 'Finanças', 'Educação', 'Produtividade', 'Receitas', 'Livros', 'Café']);
});
