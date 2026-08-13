// Validação pós-deploy em PRODUÇÃO: dropdown, SPA, menu mobile, hero, SEO.
// Uso: node tests/playwright/prod-validation.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://artigocomcafe.com';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
  });

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('api-proxy.php')) consoleErrors.push(m.text().slice(0, 200)); });
  const report = (name, ok, detail = '') => console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);

  try {
    // ── Home ──
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Hero zoom-in (nunca encolhe)
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(400);
    const heroScale = await page.evaluate(() => {
      const bg = document.querySelector('.hero-bg');
      const t = bg?.style.transform || '';
      const m = t.match(/scale\(([\d.]+)/);
      return m ? parseFloat(m[1]) : 1;
    });
    report('PROD hero: bg NÃO encolhe (scale >= 1)', heroScale >= 1, `scale=${heroScale}`);

    // Dropdown Receitas no hover
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const dd = page.locator('[data-dropdown="receitas"]');
    await dd.hover();
    await page.waitForTimeout(500);
    const ddState = await page.evaluate(() => {
      const panel = document.querySelector('[data-dropdown="receitas"] .dropdown-panel');
      if (!panel) return { found: false };
      const cs = getComputedStyle(panel);
      const r = panel.getBoundingClientRect();
      return { found: true, vis: cs.visibility, opacity: cs.opacity, h: Math.round(r.height), belowHeader: r.top > 74 };
    });
    report('PROD dropdown: abre no hover e renderiza abaixo do header (sem clip)', ddState.found && ddState.vis === 'visible' && ddState.opacity === '1' && ddState.h > 200 && ddState.belowHeader, JSON.stringify(ddState));
    await page.mouse.move(10, 400);

    // ── SPA: home → /blog → voltar → dropdown reabre ──
    await page.locator('a[href="/blog"]').first().click();
    await page.waitForTimeout(2500);
    const blogUrl = page.url();
    report('PROD SPA: navegou para /blog', blogUrl.includes('/blog'), blogUrl);

    const dup = await page.evaluate(() => {
      const footer = document.querySelector('footer.footer');
      if (!footer) return { noFooter: true };
      const els = Array.from(document.body.children);
      const idx = els.indexOf(footer);
      const after = els.slice(idx + 1);
      const dupNav = after.filter(el => el.tagName === 'HEADER' || el.classList.contains('mobile-menu'));
      return { headers: document.querySelectorAll('header.header').length, dupNav: dupNav.length };
    });
    report('PROD /blog: header único e sem navbar duplicada após footer', dup.headers === 1 && dup.dupNav === 0, JSON.stringify(dup));

    await page.goBack();
    await page.waitForTimeout(2500);
    await page.locator('[data-dropdown="receitas"]').hover();
    await page.waitForTimeout(500);
    const ddAfter = await page.evaluate(() => document.querySelector('[data-dropdown="receitas"]')?.classList.contains('open') || false);
    report('PROD dropdown: reabre após navegação SPA', ddAfter);
    await page.mouse.move(10, 400);

    // ── Menu mobile (390px) ──
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.tap('#hamburger');
    await page.waitForTimeout(500);
    const mm = await page.evaluate(() => {
      const m = document.getElementById('mobile-menu');
      return { h: Math.round(m.getBoundingClientRect().height), hidden: m.getAttribute('aria-hidden') };
    });
    report('PROD menu mobile: tela cheia (>= 800px)', mm.h >= 800 && mm.hidden === 'false', JSON.stringify(mm));
    await page.tap('#hamburger');
    await page.waitForTimeout(300);

    // ── SEO pages ──
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const slug of ['metodos-de-preparo', 'tipos-de-graos', 'como-fazer-cafe', 'cafes-do-brasil', 'glossario-do-cafe']) {
      await page.goto(`${BASE}/${slug}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(700);
      const ok = await page.evaluate(() => {
        const faq = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
          .some(j => j && j['@type'] === 'FAQPage' && j.mainEntity.length >= 4);
        return faq && !!document.querySelector('h1');
      });
      report(`PROD SEO /${slug}/: h1 + FAQPage JSON-LD`, ok);
    }

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    console.log('\n  [console errors] ' + consoleErrors.length);
    consoleErrors.slice(0, 6).forEach(e => console.log('   -', e));
    await browser.close();
  }
})();
