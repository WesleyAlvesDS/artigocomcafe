// Layout diagnostics: checks for overlapping/clipped elements, broken widths,
// FAB visibility on mobile, and key UI element presence per section.
// Uso: $env:TEST_USER='...'; $env:TEST_PASS='...'; node tests/playwright/dash-layout-check.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://artigocomcafe.com';
const EMAIL = process.env.TEST_USER || 'pro.wesleyalves@gmail.com';
const PASS = process.env.TEST_PASS || 'Wesl3y@Cafe2026!Dash';

const SECTIONS = [
  { id: 'dashboard', label: 'Visão Geral' },
  { id: 'jornada', label: 'Jornada' },
  { id: 'missoes', label: 'Missões' },
  { id: 'trilhas', label: 'Trilhas' },
  { id: 'conquistas', label: 'Conquistas' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'mapa', label: 'Mapa' },
  { id: 'graos', label: 'Grãos' },
  { id: 'torrefacao', label: 'Torrefação' },
  { id: 'perfil', label: 'Perfil' },
];

async function run(viewport, label) {
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch {}
  });
  await page.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#login-email', { timeout: 15000 });
  await page.waitForTimeout(1000);
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

  console.log(`\n=== ${label} ===`);
  for (const sec of SECTIONS) {
    await page.evaluate((id) => { window.location.hash = '#/' + id; }, sec.id);
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => {
      const results = { problems: [] };
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const overflow = document.documentElement.scrollWidth > vw;
      if (overflow) results.problems.push(`overflow horizontal (scrollWidth=${document.documentElement.scrollWidth} > vw=${vw})`);
      const body = document.body;
      const bodyWidth = body.scrollWidth;
      if (bodyWidth > vw + 2) results.problems.push(`body mais largo que viewport (${bodyWidth} > ${vw})`);
      const view = document.querySelector('.dash-app-view');
      if (!view) { results.problems.push('sem .dash-app-view'); return results; }
      const viewRect = view.getBoundingClientRect();
      if (viewRect.right > vw + 2) results.problems.push(`.dash-app-view estoura direita (right=${Math.round(viewRect.right)} > vw=${vw})`);
      const fab = document.querySelector('.dash-app-fab');
      if (fab) {
        const fabRect = fab.getBoundingClientRect();
        const style = getComputedStyle(fab);
        if (style.display === 'none' && vw < 1024) results.problems.push('FAB hidden no mobile (display:none)');
        if (fabRect.right > vw + 2) results.problems.push(`FAB fora da tela (right=${Math.round(fabRect.right)} > vw=${vw})`);
        if (fabRect.bottom > window.innerHeight + 2) results.problems.push(`FAB abaixo da tela (bottom=${Math.round(fabRect.bottom)} > vh=${vh})`);
      } else if (vw < 1024) {
        results.problems.push('FAB ausente no mobile');
      }
      const sheet = document.querySelector('.dash-app-sheet');
      if (sheet) {
        const sheetStyle = getComputedStyle(sheet);
        results.sheetVisibility = sheetStyle.visibility + '/' + sheetStyle.opacity;
      }
      // Texto cortado por overflow-x-auto em nav horizontal (embedded dashboard)
      const hNav = document.querySelector('.dash-app-view nav[aria-label="Seções do dashboard"]');
      if (hNav) {
        const navRect = hNav.getBoundingClientRect();
        if (navRect.width > vw) results.problems.push(`nav horizontal estoura (${Math.round(navRect.width)} > ${vw})`);
      }
      // Cards visíveis contam (grid dentro da seção)
      const cards = [...document.querySelectorAll('.glass-card')].filter(c => {
        const r2 = c.getBoundingClientRect();
        return r2.width > 0 && r2.height > 0;
      }).length;
      results.cards = cards;
      return results;
    });
    const status = r.problems.length === 0 ? 'OK' : 'PROBLEMA';
    console.log(`[${status}] ${sec.id.padEnd(12)} cards=${r.cards} ${r.problems.join(' | ')}`);
  }
  await browser.close();
}

await run({ width: 1440, height: 900 }, 'DESKTOP');
await run({ width: 390, height: 844 }, 'MOBILE');
console.log('\nDONE');