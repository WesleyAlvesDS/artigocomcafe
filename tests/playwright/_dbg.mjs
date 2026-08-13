import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['tests/playwright/static-server.mjs', '4346', 'dist'], { stdio: 'ignore' });
setTimeout(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
  });
  page.on('console', m => console.log('[console]', m.type(), m.text().slice(0, 180)));
  page.on('requestfailed', r => console.log('[reqfail]', r.url().slice(0, 120), r.failure()?.errorText));
  await page.goto('http://localhost:4346/', { waitUntil: 'networkidle' });
  console.log('URL inicial:', page.url());
  console.log('links /blog:', await page.locator('a[href="/blog"]').count());
  console.log('headers:', await page.locator('header.header').count(), 'mobile-menus:', await page.locator('.mobile-menu').count());
  await page.locator('.header-nav a[href="/blog"]').first().click();
  await page.waitForTimeout(3000);
  console.log('URL após clique:', page.url());
  console.log('headers:', await page.locator('header.header').count(), 'mobile-menus:', await page.locator('.mobile-menu').count());
  const html = await page.content();
  console.log('footer count:', (html.match(/class="footer"/g) || []).length);
  await browser.close();
  server.kill();
}, 800);