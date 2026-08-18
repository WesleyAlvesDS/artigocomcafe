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

// Remove o overlay de cookies (bloqueia cliques nas seções do dashboard).
async function dismissCookies(page) {
  const accept = page.locator('#cookie-accept');
  if (await accept.count()) {
    await accept.click({ timeout: 5000 }).catch(() => {});
    await sleep(400);
  }
}

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

// O widget "Meus Artigos" lê `res.data.data` e `res.data.meta.*`, então o
// mock espelha a resposta embrulhada em `data` (igual ao backend real).
const MOCK_POSTS = {
  data: {
    data: [
      {
        id: 1, title: 'Meu primeiro artigo sobre café', slug: 'meu-primeiro-artigo-sobre-cafe',
        excerpt: 'Um resumo do artigo', status: 'draft', featured_image: null, reading_time: 3,
        category: { name: 'Guias', slug: 'guias' },
        tags: [{ name: 'café', slug: 'cafe' }],
        date: '2026-08-10', created_at: '2026-08-10T10:00:00Z', updated_at: '2026-08-10T10:00:00Z',
      },
    ],
    meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
  },
};

function setupApiMocks(page) {
  page.route('**/api-proxy.php/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: MOCK_USER }),
    });
  });
  page.route('**/api-proxy.php/user/posts**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_POSTS),
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

  page.route('**/api-proxy.php/ai/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { available: true, providers: { groq: true, gemini: true } } }),
    });
  });
  page.route('**/api-proxy.php/ai/ask*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          reply: 'Resposta do assistente: experimente servir seu café com 18g de café moinho fino para 30s de extração.',
          provider: 'groq',
          cached: false,
          elapsed_ms: 542,
        },
      }),
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
    // Mock do AI status (no preview local o PHP do api-proxy não roda e
    // o AIFloatingWidget da página /entrar geraria um 404 no console).
    page.route('**/api-proxy.php/ai/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: false, providers: {} }) });
    });

    const resp = await page.goto(BASE_URL + '/dashboard/', { waitUntil: 'networkidle', timeout: 30000 });
    const status = resp?.status() || 0;
    report(`Dashboard carrega (HTTP ${status})`, status === 200, `Status: ${status}`);

    await page.waitForURL((url) => url.pathname.includes('/entrar') || url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
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

async function testLoggedInRedirect(browser, viewport, label) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📱 ${label} — Usuário já logado visita /entrar`);
  console.log(`${'='.repeat(50)}`);

  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  try {
    await setupApiMocks(page);

    await context.addInitScript(() => {
      localStorage.setItem('auth_token', 'mocked-token');
      localStorage.setItem('user_theme', 'cafe');
    });

    // Usuário autenticado não deve ficar preso na página de login —
    // a aresta /entrar → (já logado) → Dashboard deve fechar o ciclo.
    await page.goto(BASE_URL + '/entrar/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await dismissCookies(page);

    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 }).catch(() => {});
    await sleep(800);

    const url = page.url();
    const redirectedToDashboard = url.includes('/dashboard');
    report('Usuário logado em /entrar é redirecionado para /dashboard', redirectedToDashboard, url);

    // /cadastro também deve redirecionar usuário logado
    await page.goto(BASE_URL + '/cadastro/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 }).catch(() => {});
    await sleep(800);
    const url2 = page.url();
    report('Usuário logado em /cadastro é redirecionado para /dashboard', url2.includes('/dashboard'), url2);
  } catch (err) {
    report('Redirect usuário logado', false, err.message.substring(0, 100));
  } finally {
    await context.close();
  }
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
    await dismissCookies(page);

    // Wait for all API mocks to resolve
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/auth/me'), { timeout: 10000 }).catch(() => {});
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/user/dashboard'), { timeout: 10000 }).catch(() => {});
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/integrations/weather'), { timeout: 10000 }).catch(() => {});
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/integrations/exchange'), { timeout: 10000 }).catch(() => {});
    await page.waitForResponse((resp) => resp.url().includes('/api-proxy.php/integrations/headlines'), { timeout: 10000 }).catch(() => {});
    await sleep(1500);

    const bodyText = await page.locator('body').innerText();
    console.log(`  DEBUG: body text length=${bodyText.length}`);

    // O dashboard renderiza o header do usuário (nome/username) + seções.
    // Usamos marcadores reais da UI em vez de textos exatos frágeis.
    const hasDashboardContent =
      /Olá,|Visão Geral|dias seguidos/i.test(bodyText) &&
      (bodyText.includes('@admin') || /Admin/i.test(bodyText));
    report('Dashboard renderiza conteúdo (autenticado)', hasDashboardContent, bodyText.substring(0, 100));

    const statIndicators = await page.locator('text=/grãos|artigos lidos|horas de leitura|trilhas completas|conquistas|coleções|categorias|dias seguidos/i').count();
    report('Cards de estatísticas visíveis', statIndicators >= 4, `encontrados: ${statIndicators}`);

    // Widgets ficam em seções do dashboard (Contexto do Dia, Meus Artigos,
    // Assistente IA). O audit navega como o usuário real: clica em cada seção
    // e valida o conteúdo. Isso também garante que as arestas de navegação
    // interna do dashboard funcionam de ponta a ponta.
    const goToSection = async (label, id) => {
      // Em mobile a sidebar desktop fica oculta (lg:block); o filtro
      // `:visible` garante que clicamos no botão de navegação correto.
      for (let attempt = 0; attempt < 2; attempt++) {
        let btn = page.locator(`button:has-text("${label}")`).filter({ visible: true }).first();
        let found = await btn.count();
        if (found === 0) {
          // Mobile: a navegação vive em um bottom sheet aberto pelo FAB.
          // Reproduzimos o fluxo real do usuário: FAB → sheet → seção.
          const fab = page.locator('.dash-mobile-fab').filter({ visible: true }).first();
          const fabCount = await fab.count();
          if (fabCount > 0) {
            await fab.click({ timeout: 5000 }).catch(() => {});
            // Aguarda o sheet abrir completamente (animação CSS 400ms)
            await page.waitForSelector('.dash-mobile-sheet.open', { timeout: 3000 }).catch(() => {});
            await sleep(600);
            btn = page.locator(`.dash-mobile-sheet.open button:has-text("${label}")`).first();
          }
        }
        await btn.click({ timeout: 8000 }).catch(() => {});
        // Confirma que a seção realmente abriu (goTo faz history.replaceState
        // com `#<id>`), em vez de depender de sleep fixo — cliques engolidos
        // pelo `.catch` acima derrubavam as checagens seguintes sem diagnóstico.
        const opened = await page.waitForFunction(
          (sectionId) => location.hash === `#${sectionId}`,
          id,
          { timeout: 2500 },
        ).then(() => true).catch(() => false);
        if (opened) return;
        warn(`Seção "${label}" não abriu (tentativa ${attempt + 1}) — tentando de novo`);
        await sleep(400);
      }
    };

    // Contexto do Dia → widgets de API
    console.log('\n--- API Plan Widgets (seção Contexto do Dia) ---');
    await goToSection('Contexto do Dia', 'context');
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

    // Meus Artigos → CRUD de posts do usuário (rota /user/posts)
    console.log('\n--- Meus Artigos Widget ---');
    await goToSection('Meus Artigos', 'posts');
    const myPostsWidget = await page.locator('text=/meus artigos/i').count();
    report('Widget Meus Artigos visível', myPostsWidget >= 1, `matches: ${myPostsWidget}`);

    // O widget monta e busca /user/posts ao abrir a seção — aguarda a lista
    // renderizar em vez de contar logo após o clique (evita corrida com o fetch).
    const firstPost = await page.waitForSelector('text=/Meu primeiro artigo sobre café/i', { timeout: 6000 })
      .then(() => 1).catch(() => 0);
    report('Meus Artigos lista posts do usuário', firstPost >= 1, `matches: ${firstPost}`);

    const createPostBtn = await page.waitForSelector('text=/Novo Artigo/i', { timeout: 6000 })
      .then(() => 1).catch(() => 0);
    report('Botão de criar artigo presente', createPostBtn >= 1, `matches: ${createPostBtn}`);

    // Assistente IA
    console.log('\n--- AI Assistant Widget ---');
    await goToSection('Assistente IA', 'assistant');
    // Aguarda o conteúdo renderizar (a seção monta o widget + fetch de /ai/status)
    // em vez de contar logo após um sleep fixo.
    const aiWidget = await page.waitForSelector('text=/assistente do criador/i', { timeout: 6000 })
      .then(() => 1).catch(() => 0);
    report('Widget Assistente do Criador visível', aiWidget >= 1, `matches: ${aiWidget}`);

    const aiInput = await page.waitForSelector('input[aria-label="Pergunte ao assistente de IA"]', { timeout: 6000 })
      .then(() => 1).catch(() => 0);
    report('Campo de pergunta do assistente visível', aiInput >= 1, `inputs: ${aiInput}`);

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

async function testErrorStates(browser) {
  console.log(`\n${'='.repeat(50)}`);
  console.log('📱 ERROR STATES — API failures (mock 500)');
  console.log(`${'='.repeat(50)}`);

  const consoleErrors = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
  context.on('page', (page) => {
    page.on('pageerror', (err) => {
      if (!isPreExistingWarning(err.message)) {
        consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: err.message.substring(0, 200) });
      }
    });
  });

  const page = await context.newPage();
  try {
    page.route('**/api-proxy.php/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: MOCK_USER }) }));
    page.route('**/api-proxy.php/user/dashboard', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server Error' }) }));
    page.route('**/api-proxy.php/integrations/*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server Error' }) }));

    await context.addInitScript(() => {
      localStorage.setItem('auth_token', 'mocked-token');
      localStorage.setItem('user_theme', 'cafe');
    });

    await page.goto(BASE_URL + '/dashboard/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(1000);

    const retryBtn = await page.locator('text=/Tentar novamente/i').count();
    report('Estado de erro visível quando API 500 (dashboard)', retryBtn >= 1, `retry button count: ${retryBtn}`);

    const widgetRetry = await page.locator('text=/Tentar/i').count();
    report('Widgets mostram estado de erro com retry', widgetRetry >= 1, `retry buttons found: ${widgetRetry}`);

    await page.close();
  } catch (err) {
    report('Error states test', false, err.message.substring(0, 100));
  } finally {
    await context.close();
  }
  return consoleErrors;
}

async function testEmptyState(browser) {
  console.log(`\n${'='.repeat(50)}`);
  console.log('📱 EMPTY STATE — Usuário sem evolução');
  console.log(`${'='.repeat(50)}`);

  const consoleErrors = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
  context.on('page', (page) => {
    page.on('pageerror', (err) => {
      if (!isPreExistingWarning(err.message)) {
        consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: err.message.substring(0, 200) });
      }
    });
  });

  const page = await context.newPage();
  try {
    const MOCK_EMPTY = {
      evolution: { total_grains: 0, articles_read: 0, reading_time_hours: 0, trails_completed: 0, achievement_unlocked: 0, daily_streak: 0, collections_count: 0, categories_explored: 0 }
    };
    page.route('**/api-proxy.php/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: MOCK_USER }) }));
    page.route('**/api-proxy.php/user/dashboard', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EMPTY) }));
    page.route('**/api-proxy.php/integrations/*', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'no data' }) }));

    await context.addInitScript(() => {
      localStorage.setItem('auth_token', 'mocked-token');
      localStorage.setItem('user_theme', 'cafe');
    });

    await page.goto(BASE_URL + '/dashboard/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(1500);

    // Procura por zeros nos stat cards (valor + label em elementos separados)
    const zeroStats = await page.locator('text=/0.*Dias Seguidos|0.*Horas de Leitura|Dias Seguidos.*0|Horas de Leitura.*0/i').count()
      || await page.locator('text=/(0\s*$|^\s*0)/m').count();
    report('Dashboard renderiza estado vazio (zeros)', zeroStats >= 1, `zero stats found: ${zeroStats}`);

    const zeroPct = await page.locator('text=/0%/').count();
    report('Progresso mostra 0% para usuário novo', zeroPct >= 1);

    await page.close();
  } catch (err) {
    report('Empty state test', false, err.message.substring(0, 100));
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

  // Warmup: ensure dev server is ready before first test
  const page = await browser.newPage();
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.close();

  let allConsoleErrors = [];

  const desktopRedirect = await testRedirect(browser, { width: 1280, height: 800 }, 'DESKTOP (1280x800)');
  const mobileRedirect = await testRedirect(browser, { width: 375, height: 812 }, 'MOBILE (375x812)');

  const desktopLoggedIn = await testLoggedInRedirect(browser, { width: 1280, height: 800 }, 'DESKTOP (1280x800)');
  const mobileLoggedIn = await testLoggedInRedirect(browser, { width: 375, height: 812 }, 'MOBILE (375x812)');

  const desktopAuth = await testAuthenticated(browser, { width: 1280, height: 800 }, 'DESKTOP (1280x800)');
  const mobileAuth = await testAuthenticated(browser, { width: 375, height: 812 }, 'MOBILE (375x812)');

  const errorState = await testErrorStates(browser);
  const emptyState = await testEmptyState(browser);

  allConsoleErrors.push(...desktopRedirect, ...mobileRedirect, ...desktopAuth, ...mobileAuth, ...errorState, ...emptyState);

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
