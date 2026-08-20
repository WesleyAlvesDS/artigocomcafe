// Screenshots das seções do dashboard (desktop + mobile) para inspeção visual.
// Uso: $env:TEST_USER='...'; $env:TEST_PASS='...'; node tests/playwright/dash-shots.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://artigocomcafe.com';
const EMAIL = process.env.TEST_USER || 'pro.wesleyalves@gmail.com';
const PASS = process.env.TEST_PASS || 'Wesl3y@Cafe2026!Dash';
const OUT = 'tests/playwright/screenshots';

const SECTIONS = ['dashboard','jornada','missoes','trilhas','conquistas','biblioteca','mapa','graos','torrefacao','perfil'];

async function run(viewport, label) {
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch {}
  });
  await page.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#login-email', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-password', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4500);
  if (!(await page.evaluate(() => localStorage.getItem('auth_token')))) {
    await page.fill('#login-email', EMAIL);
    await page.fill('#login-password', PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4500);
  }
  await page.goto(BASE + '/dashboard/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  for (const sec of SECTIONS) {
    await page.evaluate((id) => { window.location.hash = '#/' + id; }, sec);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/sec-${label}-${sec}.png`, fullPage: true }).catch(() => {});
    console.log(`shot ${label} ${sec}`);
  }
  await browser.close();
}

await run({ width: 1440, height: 900 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');
console.log('DONE');