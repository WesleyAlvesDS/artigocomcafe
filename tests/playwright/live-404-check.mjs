// Varre páginas principais de produção e lista recursos 404 (imagens/fonts/etc).
// Uso: node tests/playwright/live-404-check.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://artigocomcafe.com';
const PAGES = ['/', '/blog/', '/receitas/', '/dashboard/', '/jornada/', '/sobre/', '/contato/', '/newsletter/', '/metodos-de-preparo/', '/como-fazer-cafe/', '/glossario-do-cafe/'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
  });

  const failures = new Map();
  page.on('response', r => {
    if (r.status() >= 400 && !r.url().includes('api-proxy.php')) {
      const u = r.url().replace(BASE, '');
      if (!failures.has(u)) failures.set(u, r.status());
    }
  });

  for (const p of PAGES) {
    try {
      await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(800);
    } catch {}
  }

  console.log('404/5xx por recurso (páginas principais):');
  for (const [url, status] of failures) console.log(`  ${status} ${url}`);
  if (failures.size === 0) console.log('  (nenhum)');

  await browser.close();
})();
