// Testa login real + área do leitor (/dashboard) em produção.
// Credenciais: env TEST_USER / TEST_PASS (ou defaults de teste).
// Uso: node tests/playwright/dash-flow-check.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://artigocomcafe.com';
const EMAIL = process.env.TEST_USER || 'pro.wesleyalves@gmail.com';
const PASS = process.env.TEST_PASS || 'Wesl3y@Cafe2026!Dash';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 250)); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message.slice(0, 250)));

  const report = (name, ok, detail = '') => console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);

  try {
    // ── 0. Aceita cookies (overlay intercepta cliques) ──
    await page.addInitScript(() => {
      try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
    });

    // ── 1. Página de login ──
    await page.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    report('Login: página /entrar renderiza', h1 !== null && h1.length > 0, (h1 || '').trim().slice(0, 40));

    // ── 2. Preenche e submete ──
    await page.fill('#login-email', EMAIL);
    await page.fill('#login-password', PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const afterLogin = page.url();
    const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    report('Login: redirecionou após autenticar', authToken !== null && afterLogin.includes('/dashboard') || authToken !== null, afterLogin);
    report('Login: token salvo no localStorage', !!authToken);

    // ── 3. Dashboard renderiza conteúdo logado ──
    await page.goto(BASE + '/dashboard/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    const dash = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        url: location.pathname,
        hasWelcome: /Olá|Bem-vindo|Wesley/i.test(body.slice(0, 3000)),
        headerText: (document.querySelector('h1, h2, h3')?.textContent || '').trim().slice(0, 60),
        noLoginRedirect: !location.pathname.includes('entrar'),
        textLen: body.length,
      };
    });
    report('Dashboard: página logada carrega (sem redirect p/ /entrar)', dash.noLoginRedirect && dash.textLen > 500, JSON.stringify(dash));

    // ── 4. Navegação interna da área logada (Jornada) ──
    await page.goto(BASE + '/jornada/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const jornada = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return { url: location.pathname, noRedirect: !location.pathname.includes('entrar'), textLen: body.length };
    });
    report('Jornada: página logada carrega', jornada.noRedirect && jornada.textLen > 300, JSON.stringify(jornada));

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    console.log('\n  [console errors] ' + consoleErrors.length);
    consoleErrors.slice(0, 8).forEach(e => console.log('   -', e));
    await browser.close();
  }
})();
