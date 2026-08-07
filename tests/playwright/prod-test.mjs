/**
 * Skillmaster — Production Test with Real Credentials
 * Tests the dashboard against the live backend with real auth.
 *
 * Usage: node tests/playwright/prod-test.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://artigocomcafe.com';
const API_URL = 'https://back.artigocomcafe.com/api';
const EMAIL = 'teste_skillmaster@artigocomcafe.com';
const PASSWORD = 'Teste@12345';

const RESULTS = { passed: 0, failed: 0, warnings: 0 };
function report(name, ok, detail) {
  if (ok) { RESULTS.passed++; console.log(`  ✅ ${name}`); }
  else { RESULTS.failed++; console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); }
}

async function loginAndGetToken() {
  const resp = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!resp.ok) {
    throw new Error(`Login failed: ${resp.status} ${resp.statusText}`);
  }
  const data = await resp.json();
  return data.token;
}

async function run() {
  console.log('\n🔬 PRODUCTION TEST — Real Credentials');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌐 ${BASE_URL}`);
  console.log(`👤 ${EMAIL}`);

  let token;
  try {
    token = await loginAndGetToken();
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
  } catch (e) {
    report('Login real', false, e.message);
    process.exit(1);
  }
  report('Login real', true);

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  });

  await context.addInitScript(() => {
    window.__PROD_TOKEN__ = undefined;
  });

  const page = await context.newPage();

  // Inject token BEFORE navigation
  await context.addInitScript({
    content: `localStorage.setItem('auth_token', '${token}'); localStorage.setItem('user_theme', 'cafe');`,
  });

  // Test 1: Dashboard loads and renders
  console.log('\n📱 Dashboard com credenciais reais');
  await page.goto(BASE_URL + '/dashboard/', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const bodyText = await page.locator('body').innerText();

  // Check user header
  const hasUserName = bodyText.includes('Teste Skillmaster') || bodyText.includes('teste_skillmaster');
  report('Header mostra usuário logado', hasUserName);

  // Check evolution stats
  const statIndicators = await page.locator('text=/Grãos|Artigos Lidos|Horas de Leitura|Trilhas Completas|Conquistas|Coleções|Categorias|Dias Seguidos/i').count();
  report('Cards de evolução visíveis', statIndicators >= 5, `encontrados: ${statIndicators}`);

  // Check progress visualization
  const svgCircle = await page.locator('svg circle').count();
  report('Visualização de progresso (SVG) presente', svgCircle >= 2, `circles: ${svgCircle}`);

  // Check API plan widgets
  const weatherLabel = await page.locator('text=/Clima do Café/i').count();
  report('Widget Clima visível', weatherLabel >= 1);

  const exchangeLabel = await page.locator('text=/Câmbio ao Vivo/i').count();
  report('Widget Câmbio visível', exchangeLabel >= 1);

  const headlinesLabel = await page.locator('text=/Manchetes do Dia/i').count();
  report('Widget Manchetes visível', headlinesLabel >= 1);

  // Check quick actions
  const quickActions = await page.locator('a[href="/mapa"], a[href="/torrefacao"], a[href="/biblioteca"], a[href="/graos"], a[href="/conquistas"], a[href="/missoes"], a[href="/trilhas"]').count();
  report('Atalhos de navegação presentes', quickActions >= 5, `encontrados: ${quickActions}`);

  // Check weather data loaded (real API)
  const weatherTemp = await page.locator('text=/°C/i').count();
  report('Widget Clima mostra temperatura real', weatherTemp >= 1);

  // Check exchange data loaded (real API)
  const exchangeRate = await page.locator('text=/USD/i').count();
  report('Widget Câmbio mostra taxas reais', exchangeRate >= 1);

  // Check headlines loaded (real API)
  const headlineItems = await page.locator('li > a').count();
  report('Widget Manchetes mostra notícias reais', headlineItems >= 1, `items: ${headlineItems}`);

  // Responsiveness
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  report('Sem overflow horizontal (desktop)', !overflow);

  // Console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  report('Console sem erros JS', consoleErrors.length === 0, consoleErrors.slice(0, 3).join('; '));

  // Screenshot
  await page.screenshot({ path: 'tests/playwright/screenshots/dash-prod-real.png', fullPage: true }).catch(() => {});
  console.log('  📸 Screenshot: dash-prod-real.png');

  await browser.close();

  console.log('\n' + '📊'.repeat(20));
  console.log('📊 RELATÓRIO — PRODUCTION TEST');
  console.log('📊'.repeat(20) + '\n');
  console.log(`  ✅ Passaram: ${RESULTS.passed}`);
  console.log(`  ❌ Falharam: ${RESULTS.failed}`);
  const total = RESULTS.passed + RESULTS.failed;
  const score = total > 0 ? Math.round(RESULTS.passed / total * 100) : 0;
  console.log(`\n🏆 SCORE: ${score}% (${RESULTS.passed}/${total})`);
  console.log(`📝 GRADE: ${score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'}`);

  process.exit(RESULTS.failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
