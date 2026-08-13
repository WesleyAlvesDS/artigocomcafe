// Valida o editor P1/P2 em produção: toolbar, preview split, painel SEO,
// autocomplete (datalist), aria-live e auto-slug.
// Uso: node tests/playwright/editor-p2-check.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://artigocomcafe.com';
const EMAIL = process.env.TEST_USER || 'pro.wesleyalves@gmail.com';
const PASS = process.env.TEST_PASS || 'Wesl3y@Cafe2026!Dash';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
  });
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('api-proxy.php')) consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message.slice(0, 200)));
  const report = (name, ok, detail = '') => console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);

  try {
    // Login
    await page.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.fill('#login-email', EMAIL);
    await page.fill('#login-password', PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    report('Editor: login OK', !!token);

    // Dashboard → aba Meus Artigos → Novo Artigo
    await page.goto(BASE + '/dashboard/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const tab = page.locator('button:has-text("Meus Artigos")').filter({ visible: true }).first();
    if (await tab.count()) {
      await tab.click();
      await page.waitForTimeout(1500);
      report('Dashboard: aba Meus Artigos abre', await page.locator('.post-editor, button:has-text("Novo Artigo"), button:has-text("Criar Primeiro Artigo")').count() > 0);
    } else {
      report('Dashboard: aba Meus Artigos encontrada', false);
    }
    const newBtn = page.locator('button:has-text("Novo Artigo"), button:has-text("Criar Primeiro Artigo")').first();
    if (await newBtn.count()) {
      await newBtn.click();
      await page.waitForTimeout(1500);
      report('Editor: abriu via "+ Novo Artigo"', await page.locator('.post-editor').count() === 1);
    } else {
      report('Editor: botão Novo Artigo encontrado', false);
    }

    // Toolbar presente
    const toolbarBtns = await page.locator('.toolbar-btn').count();
    report('Editor: toolbar com botões', toolbarBtns >= 10, `btns=${toolbarBtns}`);

    // Título → slug auto-gerado
    await page.fill('#editor-title', 'Como Fazer Café Perfeito');
    await page.waitForTimeout(400);
    // Abre painel SEO
    await page.click('.seo-toggle');
    await page.waitForTimeout(300);
    const seo = await page.evaluate(() => {
      const slug = document.getElementById('editor-slug');
      const meta = document.getElementById('editor-meta');
      return {
        slugVal: slug ? slug.value : null,
        metaLabel: meta ? meta.labels.length : 0,
        seoExpanded: document.querySelector('.seo-toggle')?.getAttribute('aria-expanded'),
      };
    });
    report('Editor: painel SEO abre', seo.seoExpanded === 'true' && seo.slugVal !== null, JSON.stringify(seo));
    report('Editor: slug auto-gerado do título', seo.slugVal === 'como-fazer-cafe-perfeito', `slug=${seo.slugVal}`);

    // Meta description
    await page.fill('#editor-meta', 'Descrição de teste para o Google.');
    await page.waitForTimeout(300);

    // Toolbar bold insere markdown
    await page.click('#editor-content');
    await page.keyboard.type('texto em negrito');
    await page.click('.toolbar-btn[title*="Negrito"], .toolbar-btn[aria-label="Negrito"]');
    await page.waitForTimeout(300);
    const contentAfterBold = await page.inputValue('#editor-content');
    report('Editor: botão Negrito insere markdown', contentAfterBold.includes('**'), contentAfterBold.slice(0, 60));

    // Preview split
    await page.click('.preview-toggle');
    await page.waitForTimeout(400);
    const preview = await page.evaluate(() => ({
      pane: !!document.querySelector('.preview-pane'),
      content: document.querySelector('.preview-content')?.textContent?.trim().slice(0, 60) || null,
    }));
    report('Editor: preview split abre e renderiza', preview.pane && preview.content?.length > 0, JSON.stringify(preview));

    // aria-live no save-status
    const ariaLive = await page.evaluate(() => document.querySelector('.save-status')?.getAttribute('aria-live'));
    report('Editor: aria-live no auto-save', ariaLive === 'polite', `aria-live=${ariaLive}`);

    // Autocomplete: datalists com opções da API
    const autocomplete = await page.evaluate(() => {
      const cats = document.getElementById('suggested-categories');
      const tags = document.getElementById('suggested-tags');
      return {
        catOptions: cats ? cats.querySelectorAll('option').length : 0,
        tagOptions: tags ? tags.querySelectorAll('option').length : 0,
      };
    });
    report('Editor: autocomplete categorias (datalist)', autocomplete.catOptions > 0, JSON.stringify(autocomplete));
    report('Editor: autocomplete tags (datalist)', autocomplete.tagOptions > 0, JSON.stringify(autocomplete));

    // Auto-save apareceu (status "Salvo")
    await page.waitForTimeout(1200);
    const saved = await page.evaluate(() => document.querySelector('.save-status')?.textContent || '');
    report('Editor: auto-save roda (estado "Salvo")', /Salvo/.test(saved), saved.trim());

    // Fecha o editor sem salvar (cancelar)
    await page.click('button:has-text("Cancelar")');
    await page.waitForTimeout(500);
  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    console.log('\n  [console errors] ' + consoleErrors.length);
    consoleErrors.slice(0, 8).forEach(e => console.log('   -', e));
    await browser.close();
  }
})();
