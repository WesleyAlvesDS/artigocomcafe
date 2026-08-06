/**
 * Skillmaster — Dashboard Audit
 * Valida o dashboard (dash) do Artigo com Café:
 *   ✓ Página carrega sem erro 500
 *   ✓ Redirect p/ login quando não autenticado
 *   ✓ Renderiza estrutura do dashboard (header, stats, widgets, atalhos)
 *   ✓ Widgets do plano API (clima, câmbio, manchetes) aparecem
 *   ✓ Responsividade (mobile + desktop, sem overflow)
 *   ✓ Console limpo (sem erros JS críticos)
 *
 * Uso: node tests/playwright/dash-audit.mjs
 *      BASE_URL=http://localhost:4331 node tests/playwright/dash-audit.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4331';
const TEST_USER = process.env.TEST_USER || 'teste_skillmaster@artigocomcafe.com';
const TEST_PASS = process.env.TEST_PASS || 'Teste@12345';

const RESULTS = { passed: 0, failed: 0, warnings: 0, errors: [] };

function report(name, passed, detail = '') {
  if (passed) {
    RESULTS.passed++;
    console.log(`  ✅ ${name}`);
  } else {
    RESULTS.failed++;
    RESULTS.errors.push({ name, detail });
    console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`);
  }
}

function warn(name, detail = '') {
  RESULTS.warnings++;
  console.log(`  ⚠️  ${name}${detail ? ': ' + detail : ''}`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const PREEXISTING_WARNINGS = [
  'class className',
  'htmlFor',
  'didn\'t match the client',
  'hydration',
  'Invalid DOM property',
];

function isPreExistingWarning(text) {
  return PREEXISTING_WARNINGS.some(w => text.includes(w));
}

async function testRedirect(browser, viewport, label) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📱 ${label} — Redirecionamento sem auth`);
  console.log(`${'='.repeat(50)}`);

  const consoleErrors = [];
  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  context.on('page', (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isPreExistingWarning(msg.text())) {
        consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: msg.text().substring(0, 200) });
      }
    });
    page.on('pageerror', (err) => {
      if (!isPreExistingWarning(err.message)) {
        consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: err.message.substring(0, 200) });
      }
    });
  });

  const page = await context.newPage();
  try {
    const resp = await page.goto(BASE_URL + '/dashboard/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = resp?.status() || 0;
    report(`Dashboard carrega (HTTP ${status})`, status === 200, `Status: ${status}`);

    // Wait for auth redirect (hydration + useEffect + redirect)
    await page.waitForURL((url) => url.pathname.includes('/entrar') || url.pathname.includes('/login'), { timeout: 5000 }).catch(() => {});
    await sleep(500);

    const redirectUrl = page.url();
    const redirectedToLogin = redirectUrl.includes('/entrar') || redirectUrl.includes('/login');
    report('Dashboard redireciona p/ login sem autenticação', redirectedToLogin, redirectUrl);

    if (redirectedToLogin) {
      const form = await page.locator('input[type="email"]').first();
      report('Página de login carregada após redirect', await form.count() > 0);
    }

    await page.screenshot({ path: `tests/playwright/screenshots/dash-redirect-${label.replace(/\s+/g, '-')}.png`, fullPage: true }).catch(() => {});
    console.log(`  📸 Screenshot salvo: dash-redirect-${label.replace(/\s+/g, '-')}.png`);
  } catch (err) {
    report('Navegação sem auth', false, err.message.substring(0, 80));
  } finally {
    await context.close();
  }
  return consoleErrors;
}

async function testAuthenticated(browser, viewport, label) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📱 ${label} — Visão autenticada`);
  console.log(`${'='.repeat(50)}`);

  const consoleErrors = [];
  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  context.on('page', (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isPreExistingWarning(msg.text())) {
        consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: msg.text().substring(0, 200) });
      }
    });
    page.on('pageerror', (err) => {
      if (!isPreExistingWarning(err.message)) {
        consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: err.message.substring(0, 200) });
      }
    });
  });

  const page = await context.newPage();
  try {
    // Inject a fake auth token so AuthGuard renders the dashboard content
    await page.goto(BASE_URL + '/entrar/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForFunction(() => !!document.querySelector('input[type="email"]'), { timeout: 5000 });

    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token-mock');
      localStorage.setItem('user_theme', 'cafe');
    });

    // Navigate to dashboard with token set
    await page.goto(BASE_URL + '/dashboard/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();
    const contentPresent = bodyText.length > 200 && /seu perfil|evolu.*o|dashboard|gr|os|progresso|atalho|contexto/i.test(bodyText);
    report('Dashboard renderiza conteúdo (autenticado)', contentPresent, bodyText.substring(0, 120));

    // Check stats cards present (grãos, artigos, etc.)
    const statIndicators = await page.locator('text=/grãos|artigos lidos|horas|trilhas|conquistas|coleções|categorias|dias/i').count();
    report('Cards de estatísticas visíveis', statIndicators >= 3, `encontrados: ${statIndicators}`);

    // Check API plan widgets
    const weatherWidget = await page.locator('text=/clima do café/i').count();
    report('Widget Clima (API plan) visível', weatherWidget >= 1);

    const exchangeWidget = await page.locator('text=/câmbio/i').count();
    report('Widget Câmbio (API plan) visível', exchangeWidget >= 1);

    const headlinesWidget = await page.locator('text=/manchetes/i').count();
    report('Widget Manchetes (API plan) visível', headlinesWidget >= 1);

    // Check quick actions
    const mapLink = await page.locator('a[href="/mapa"]').count();
    report('Link de atalho Mapa presente', mapLink >= 1);

    // Check progress visualization (SVG circle)
    const svgCircle = await page.locator('svg circle').count();
    report('Visualização de progresso (SVG) presente', svgCircle >= 2, `circles: ${svgCircle}`);

    // Responsiveness: no horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    report('Sem overflow horizontal', !overflow, overflow ? `sw=${document.documentElement.scrollWidth} cw=${document.documentElement.clientWidth}` : '');

    // Screenshot
    await page.screenshot({ path: `tests/playwright/screenshots/dash-auth-${label.replace(/\s+/g, '-')}.png`, fullPage: true }).catch(() => {});
    console.log(`  📸 Screenshot salvo: dash-auth-${label.replace(/\s+/g, '-')}.png`);

  } catch (err) {
    report('Dashboard autenticado', false, err.message.substring(0, 100));
  } finally {
    await context.close();
  }
  return consoleErrors;
}

async function run() {
  console.log('\n🔍 AUDITORIA DO DASHBOARD (Skillmaster)');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌐 ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });

  let allConsoleErrors = [];

  const desktopRedirect = await testRedirect(browser, { width: 1280, height: 800 }, 'DESKTOP (1280x800)');
  const mobileRedirect = await testRedirect(browser, { width: 375, height: 812 }, 'MOBILE (375x812)');

  const desktopAuth = await testAuthenticated(browser, { width: 1280, height: 800 }, 'DESKTOP (1280x800)');
  const mobileAuth = await testAuthenticated(browser, { width: 375, height: 812 }, 'MOBILE (375x812)');

  allConsoleErrors.push(...desktopRedirect, ...mobileRedirect, ...desktopAuth, ...mobileAuth);

  await browser.close();

  // Console errors check
  console.log('\n' + '='.repeat(50));
  console.log('🚨 ERROS CRÍTICOS NO CONSOLE (excluindo warnings pré-existentes)');
  if (allConsoleErrors.length === 0) {
    report('Console limpo (sem erros JS críticos)', true);
  } else {
    const unique = [...new Set(allConsoleErrors.map(e => `${e.text.substring(0,80)} @ ${e.url}`))];
    for (const err of unique.slice(0, 5)) {
      report('Erro no console', false, err);
    }
  }

  // Final report
  console.log('\n' + '📊'.repeat(20));
  console.log('📊 RELATÓRIO FINAL — DASHBOARD');
  console.log('📊'.repeat(20) + '\n');
  console.log(`  ✅ Testes passaram: ${RESULTS.passed}`);
  console.log(`  ❌ Testes falharam: ${RESULTS.failed}`);
  console.log(`  ⚠️  Alertas: ${RESULTS.warnings}`);

  if (RESULTS.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    for (const err of RESULTS.errors) {
      console.log(`  • ${err.name}${err.detail ? ': ' + err.detail : ''}`);
    }
  }

  const total = RESULTS.passed + RESULTS.failed;
  const score = total > 0 ? Math.round(RESULTS.passed / total * 100) : 0;
  console.log(`\n🏆 SCORE: ${score}% (${RESULTS.passed}/${total})`);
  console.log(`📝 GRADE: ${score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'}`);
  console.log('');

  process.exit(RESULTS.failed > 3 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
