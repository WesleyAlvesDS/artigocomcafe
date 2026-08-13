import { chromium } from 'playwright';
const BASE = 'https://artigocomcafe.com';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
  });
  await page.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.fill('#login-email', 'pro.wesleyalves@gmail.com');
  await page.fill('#login-password', 'Wesl3y@Cafe2026!Dash');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  await page.goto(BASE + '/dashboard/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  const info = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')].map(b => b.textContent.trim().slice(0, 40)).filter(Boolean);
    const meusArtigos = [...document.querySelectorAll('div,span')].filter(el => el.textContent.includes('Meus Artigos')).slice(0, 3).map(el => el.className);
    return { buttons: buttons.slice(0, 30), meusArtigos };
  });
  console.log('BOTOES:', JSON.stringify(info.buttons, null, 1));
  console.log('MEUS ARTIGOS CLASS:', JSON.stringify(info.meusArtigos));
  await browser.close();
})();
