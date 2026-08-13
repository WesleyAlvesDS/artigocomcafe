// Valida: filtros de /receitas (dificuldade/tempo) + páginas SEO (FAQ/JSON-LD).
// Uso: node tests/playwright/seo-filter-check.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4351;
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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
  });
  const report = (name, ok, detail = '') => console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);

  try {
    // ── 1. Filtros de /receitas ──
    await page.goto(BASE + '/receitas/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const selectState = await page.evaluate(() => {
      const sel = document.querySelector('select[name="dificuldade"]');
      const form = sel ? sel.form : null;
      return { selectInsideForm: !!form, formAction: form ? form.getAttribute('action') : null, method: form ? form.getAttribute('method') : null };
    });
    report('Receitas: select de dificuldade está DENTRO do <form>', selectState.selectInsideForm && selectState.formAction === '/receitas', JSON.stringify(selectState));

    // Muda o select e confere que navega para /receitas?dificuldade=...
    await page.selectOption('select[name="dificuldade"]', 'facil');
    await page.waitForTimeout(2500);
    const url1 = page.url();
    report('Receitas: mudar dificuldade submete o form (GET com dificuldade)', url1.includes('dificuldade=facil'), url1);

    await page.goto(BASE + '/receitas/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.selectOption('select[name="tempo_max"]', '30');
    await page.waitForTimeout(2500);
    const url2 = page.url();
    report('Receitas: mudar tempo_max submete o form', url2.includes('tempo_max=30'), url2);

    // ── 2. Páginas SEO ──
    for (const slug of ['metodos-de-preparo', 'tipos-de-graos', 'como-fazer-cafe', 'cafes-do-brasil', 'glossario-do-cafe']) {
      await page.goto(`${BASE}/${slug}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const seo = await page.evaluate(() => {
        const faqJsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
          .find(j => j && j['@type'] === 'FAQPage');
        return {
          h1: document.querySelector('h1')?.textContent?.trim().slice(0, 50) || null,
          faqItems: document.querySelectorAll('[data-faq-item]').length,
          faqJsonLd: faqJsonLd ? faqJsonLd.mainEntity.length : 0,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
          title: document.title.slice(0, 60),
        };
      });
      const ok = seo.h1 && seo.faqItems >= 4 && seo.faqJsonLd >= 4 && seo.canonical === `https://artigocomcafe.com/${slug}/`;
      report(`SEO /${slug}/: h1 + FAQ + JSON-LD + canonical`, ok, JSON.stringify(seo));
    }

    // FAQ accordion funciona
    await page.goto(BASE + '/metodos-de-preparo/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.click('[data-faq-item] .faq-question');
    await page.waitForTimeout(300);
    const faqOpen = await page.evaluate(() => {
      const first = document.querySelector('[data-faq-item]');
      const answer = first.querySelector('.faq-answer');
      return { hidden: answer.hidden, expanded: first.querySelector('.faq-question').getAttribute('aria-expanded') };
    });
    report('SEO: FAQ abre no clique', faqOpen.hidden === false && faqOpen.expanded === 'true', JSON.stringify(faqOpen));

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await browser.close();
    server?.kill();
  }
})();
