// Verifica o menu mobile (hamburger) em viewport de celular, incluindo navegação SPA.
// Uso: node tests/playwright/mobile-menu-check.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4350;
const BASE = `http://localhost:${PORT}`;
let server;

function startServer() {
  return new Promise((resolve) => {
    server = spawn('node', ['tests/playwright/static-server.mjs', String(PORT), 'dist'], { stdio: 'ignore' });
    setTimeout(resolve, 800);
  });
}

(async () => {
  await startServer();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
  });
  const report = (name, ok, detail = '') => console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);

  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Hamburger visível? Nav desktop oculta?
    const vis = await page.evaluate(() => ({
      hamburger: getComputedStyle(document.getElementById('hamburger')).display,
      nav: getComputedStyle(document.querySelector('.header-nav')).display,
      mobileMenu: getComputedStyle(document.getElementById('mobile-menu')).display,
    }));
    report('Mobile: hamburger visível e nav desktop oculta', vis.hamburger !== 'none' && vis.nav === 'none', JSON.stringify(vis));

    // Abrir menu
    await page.tap('#hamburger');
    await page.waitForTimeout(500);
    const openState = await page.evaluate(() => {
      const mm = document.getElementById('mobile-menu');
      const r = mm.getBoundingClientRect();
      return {
        ariaHidden: mm.getAttribute('aria-hidden'),
        w: Math.round(r.width),
        h: Math.round(r.height),
        bodyOverflow: document.body.style.overflow,
        links: mm.querySelectorAll('.mobile-link').length,
      };
    });
    report('Mobile: menu abre em tela cheia', openState.ariaHidden === 'false' && openState.w >= 380 && openState.h >= 800, JSON.stringify(openState));

    // Navegar via link do menu (SPA)
    await page.tap('.mobile-link[href="/blog"]');
    await page.waitForTimeout(2500);
    const afterNav = await page.evaluate(() => ({
      url: location.pathname,
      menuHidden: document.getElementById('mobile-menu').getAttribute('aria-hidden'),
      bodyOverflow: document.body.style.overflow,
      h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 40),
    }));
    report('Mobile: navegou para /blog via menu', afterNav.url === '/blog', JSON.stringify(afterNav));
    report('Mobile: menu fechou após navegação', afterNav.menuHidden === 'true' && afterNav.bodyOverflow === '', JSON.stringify(afterNav));

    // Reabrir após SPA nav e verificar se hamburger funciona de novo
    await page.tap('#hamburger');
    await page.waitForTimeout(400);
    const reopened = await page.evaluate(() => document.getElementById('mobile-menu').getAttribute('aria-hidden'));
    report('Mobile: hamburger funciona após navegação SPA', reopened === 'false', reopened);
    await page.tap('#hamburger'); // fecha
    await page.waitForTimeout(300);
  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await browser.close();
    server?.kill();
  }
})();
