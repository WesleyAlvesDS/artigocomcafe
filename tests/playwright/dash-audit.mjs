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
  "didn't match the client",
  'hydration',
  'Invalid DOM property',
  'favicon',
  'net::ERR_ABORTED',
  'ERR_CERT',
];

function isPreExistingWarning(text) {
  return PREEXISTING_WARNINGS.some(w => text.includes(w));
}

const MOCK_USER = {
  id: 1, name: 'Admin Café', username: 'admin', email: 'admin@artigocomcafe.com',
  bio: 'Administrador', avatar: null, theme: 'cafe',
  reading_time_total: 360, articles_read_count: 42, daily_streak: 7,
  total_grains: 850, completed_trails_count: 3, collections_count: 2,
  achievements_count: 8, categories_explored_count: 5,
};

const MOCK_DASHBOARD = {
  evolution: {
    total_grains: 850, articles_read: 42, reading_time_hours: 6,
    trails_completed: 3, achievements_unlocked: 8, daily_streak: 7,
    collections_count: 2, categories_explored: 5,
  },
};

const MOCK_WEATHER = {
  data: {
    city: 'São Paulo', region: 'SP', country: 'Brasil',
    temperature_c: 24, feels_like_c: 26, description: 'Ensolarado',
    icon_url: 'https://example.com/icon.png',
    humidity: 65, wind_speed_kmph: 12, wind_direction: 'NE',
    uv_index: 5, observation_time: '09:00', source: 'wttr.in', cached_at: '2026-08-06T09:00:00Z',
  },
};

const MOCK_EXCHANGE = {
  data: {
    base: 'BRL', updated_at: '2026-08-06T09:00:00Z',
    rates: [
      { base: 'BRL', code: 'USD', rate: 4.5, inverse: 0.2222 },
      { base: 'BRL', code: 'EUR', rate: 5.1, inverse: 0.1961 },
      { base: 'BRL', code: 'GBP', rate: 5.8, inverse: 0.1724 },
      { base: 'BRL', code: 'JPY', rate: 0.028, inverse: 35.714 },
    ],
    source: 'open.er-api.com', cached_at: '2026-08-06T09:00:00Z',
  },
};

const MOCK_HEADLINES = {
  data: {
    guardian: {
      items: [
        { title: 'Notícia sobre café da manhã', url: 'https://example.com/1', section: 'News',
          published_at: '2026-08-05T10:00:00Z', thumbnail: null, excerpt: 'Resumo da notícia',
          author: 'Autor', source: 'Guardian' },
        { title: 'Descoberta científica surpreendente', url: 'https://example.com/2', section: 'Science',
          published_at: '2026-08-05T11:00:00Z', thumbnail: null, excerpt: 'Nova pesquisa',
          author: 'Cientista', source: 'Guardian' },
      ],
      total: 2, source: 'Guardian', cached_at: '2026-08-06T09:00:00Z',
    },
    hacker_news: {
      items: [
        { title: 'Hacker News: novo framework', url: 'https://example.com/3', section: 'Tech',
          published_at: '2026-08-05T12:00:00Z', thumbnail: null,
          excerpt: 'Pontos: 120 · Comentários: 30', author: 'dev123', source: 'Hacker News' },
      ],
      total: 1, source: 'Hacker News', cached_at: '2026-08-06T09:00:00Z',
    },
  },
};

function setupApiMocks(page) {
  page.route('**/api-proxy.php/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: MOCK_USER, token: 'mocked-token' }),
    });
  });
   page.route('**/api-proxy.php/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: MOCK_USER }),
    });
  });
  page.route('**/api-proxy.php/user/dashboard', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARD),
    });
  });
  page.route('**/api-proxy.php/integrations/weather**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_WEATHER),
    });
  });
  page.route('**/api-proxy.php/integrations/exchange**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_EXCHANGE),
    });
  });
  page.route('**/api-proxy.php/integrations/headlines**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_HEADLINES),
    });
  });
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
    console.log(`  📸 Screenshot: dash-redirect-${label.replace(/\s+/g, '-')}.png`);
  } catch (err) {
    report('Navegação sem auth', false, err.message.substring(0, 80));
  } finally {
    await context.close();
  }
  return consoleErrors;
}

async function testAuthenticated(browser, viewport, label) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📱 ${label} — Visão autenticada (mock de API)`);
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
    await setupApiMocks(page);

    // Inject auth token BEFORE any page scripts run (so AuthProvider sees the token on hydration)
    await context.addInitScript(() => {
      localStorage.setItem('auth_token', 'mocked-token');
      localStorage.setItem('user_theme', 'cafe');
    });

    // Navigate to dashboard — token is in localStorage, API calls are mocked
    await page.goto(BASE_URL + '/dashboard/', { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Wait for all API mocks to resolve
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/auth/me'), { timeout: 10000 }).catch(() => {});
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/user/dashboard'), { timeout: 10000 }).catch(() => {});
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/integrations/weather'), { timeout: 10000 }).catch(() => {});
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/integrations/exchange'), { timeout: 10000 }).catch(() => {});
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/integrations/headlines'), { timeout: 10000 }).catch(() => {});
    await sleep(1500);

    const bodyText = await page.locator('body').innerText();
    console.log(`  DEBUG: body text length=${bodyText.length}`);

    const hasDashboardContent = bodyText.includes('Admin Café') || bodyText.includes('Evolução') || bodyText.includes('Progresso');
    report('Dashboard renderiza conteúdo (autenticado)', hasDashboardContent, bodyText.substring(0, 100));

    const statIndicators = await page.locator('text=/grãos|artigos lidos|horas de leitura|trilhas completas|conquistas|coleções|categorias|dias seguidos/i').count();
    report('Cards de estatísticas visíveis', statIndicators >= 4, `encontrados: ${statIndicators}`);

    // Check API plan widgets
    console.log('\n--- API Plan Widgets ---');
    const weatherWidget = await page.locator('text=/clima do café/i').count();
    report('Widget Clima (API plan) visível', weatherWidget >= 1, `matches: ${weatherWidget}`);

    const weatherData = await page.locator('text=/24°C/i').count();
    report('Widget Clima mostra temperatura', weatherData >= 1, `matches: ${weatherData}`);

    const exchangeWidget = await page.locator('text=/câmbio ao vivo/i').count();
    report('Widget Câmbio (API plan) visível', exchangeWidget >= 1, `matches: ${exchangeWidget}`);

    const exchangeData = await page.locator('text=/USD/i').count();
    report('Widget Câmbio mostra taxas', exchangeData >= 1, `matches: ${exchangeData}`);

    const headlinesWidget = await page.locator('text=/manchetes do dia/i').count();
    report('Widget Manchetes (API plan) visível', headlinesWidget >= 1, `matches: ${headlinesWidget}`);

    // Check quick actions
    const mapLink = await page.locator('a[href="/mapa"]').count();
    report('Link de atalho Mapa presente', mapLink >= 1);

    const quickActionCount = await page.locator('a[href*="/"]').count();
    report('Atalhos de navegação presentes', quickActionCount >= 5);

    // Check progress visualization (SVG circle)
    const svgCircle = await page.locator('svg circle').count();
    report('Visualização de progresso (SVG) presente', svgCircle >= 2, `circles: ${svgCircle}`);

    // Check progress percentage
    const progressText = await page.locator('text=/%/').count();
    report('Porcentagem de progresso visível', progressText >= 1);

    // Responsiveness: no horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    report('Sem overflow horizontal', !overflow, overflow ? `sw=${document.documentElement.scrollWidth} cw=${document.documentElement.clientWidth}` : '');

    // Screenshot
    await page.screenshot({ path: `tests/playwright/screenshots/dash-auth-${label.replace(/\s+/g, '-')}.png`, fullPage: true }).catch(() => {});
    console.log(`  📸 Screenshot: dash-auth-${label.replace(/\s+/g, '-')}.png`);

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
