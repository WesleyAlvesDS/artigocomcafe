import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const PORT = process.argv[2] || 4331;
const BASE = `http://localhost:${PORT}`;
const OUT = 'tests/playwright/screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

async function shot(ctx, path, file, fullPage = true) {
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 40000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${file}`, fullPage });
  await page.close();
}

const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  ignoreHTTPSErrors: true,
});
await ctx.addInitScript(() => {
  localStorage.setItem('auth_token', 'fake-token-for-audit');
  localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString(), location: { granted: false, city: 'São Paulo' } }));
});
await ctx.route('**/auth/me', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 1, name: 'Teste Leitor', username: 'teste', email: 'teste@teste.com', bio: null, avatar: null, theme: 'cafe', reading_time_total: 12, articles_read_count: 5, daily_streak: 3, total_grains: 42, completed_trails: 1, collections_count: 2, achievements_count: 4 } }) }));
await ctx.route('**/auth/logout', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

await shot(ctx, '/jornada/', 'logged-jornada-1280.png');
await shot(ctx, '/dashboard/', 'logged-dashboard-1280.png');
await shot(ctx, '/biblioteca/', 'logged-biblioteca-1280.png');

// Blog article (public) with SmartSidebar
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
await ctx2.addInitScript(() => {
  localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString(), location: { granted: false, city: 'São Paulo' } }));
});
{
  const page = await ctx2.newPage();
  await page.goto(BASE + '/blog/', { waitUntil: 'networkidle', timeout: 40000 });
  const href = await page.locator('a[href^="/blog/"]').first().getAttribute('href');
  await page.goto(BASE + href, { waitUntil: 'networkidle', timeout: 40000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/logged-post-sidebar-1280.png`, fullPage: true });
  await page.close();
}

await browser.close();
console.log('Screenshots saved to', OUT);
