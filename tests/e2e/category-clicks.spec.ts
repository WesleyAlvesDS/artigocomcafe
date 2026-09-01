import { test, expect } from '@playwright/test';

const BASE = 'https://artigocomcafe.com';

const categoryButtons = [
  { name: 'Feed',       expectedUrl: '/#feed' },
  { name: 'Tecnologia', expectedUrl: '/blog?categoria=tecnologia' },
  { name: 'Finanças',   expectedUrl: '/blog?categoria=financas' },
  { name: 'Educação',   expectedUrl: '/blog?categoria=educacao' },
  { name: 'Produtividade', expectedUrl: '/blog?categoria=produtividade' },
  { name: 'Receitas',   expectedUrl: '/receitas' },
  { name: 'Livros',     expectedUrl: '/livros' },
  { name: 'Café',       expectedUrl: '/blog?categoria=cafe' },
];

for (const cat of categoryButtons) {
  test(`"${cat.name}" → ${cat.expectedUrl}`, async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for React hydration
    const btn = page.locator('.category-nav-item', { hasText: cat.name });
    await expect(btn).toBeVisible({ timeout: 15000 });
    
    await btn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    const url = new URL(page.url());
    const path = url.pathname + url.search;
    
    console.log(`"${cat.name}" → ${path}`);
    
    if (cat.expectedUrl === '/#feed') {
      expect(url.pathname).toBe('/');
    } else {
      expect(path).toContain(cat.expectedUrl);
    }
  });
}
