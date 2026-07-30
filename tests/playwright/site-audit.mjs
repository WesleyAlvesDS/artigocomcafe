/**
 * Auditoria Completa do Site - Artigo com Café
 * Usando Playwright para testar todas as páginas, navegação e funcionalidades
 * 
 * Uso: node tests/playwright/site-audit.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://artigocomcafe.com';

const RESULTS = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
};

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

// Pages that require authentication (expect redirect)
const AUTH_PAGES = ['/perfil/', '/graos/', '/trilhas/', '/conquistas/', '/torrefacao/', '/mapa/', '/biblioteca/', '/missoes/'];
// Public pages (expect 200)
const PUBLIC_PAGES = ['/sobre/', '/contato/', '/newsletter/'];

async function runSuite(viewport, label) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📱 TESTES: ${label}`);
  console.log(`${'='.repeat(50)}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: true,
  });

  // Collect console errors and bad responses
  const consoleErrors = [];
  const badResponses = [];

  context.on('page', (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: msg.text().substring(0, 120) });
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: err.message.substring(0, 120) });
    });
    page.on('response', (response) => {
      const status = response.status();
      const reqUrl = response.request().url();
      if (status >= 400 && reqUrl.startsWith(BASE_URL)) {
        badResponses.push({ url: reqUrl.replace(BASE_URL, ''), status });
      }
    });
  });

  try {
    // ── TEST 1: Homepage ──────────────────────────────────
    console.log('\n📄 HOME PAGE');
    const homePage = await context.newPage();
    
    const homeStart = Date.now();
    await homePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const homeLoadTime = Date.now() - homeStart;
    report(`Carregou em ${homeLoadTime}ms`, homeLoadTime < 10000, homeLoadTime > 5000 ? 'Lento (>5s)' : '');
    
    const homeTitle = await homePage.title();
    report(`Title: "${homeTitle}"`, homeTitle.includes('Artigo com Café') || homeTitle.includes('Artigocomcafé'));
    
    // Cafe do Dia section
    const cafeDoDia = await homePage.locator('text=Café do Dia').count();
    report('Seção Café do Dia visível', cafeDoDia > 0);
    
    // Article cards
    const articleCards = await homePage.locator('a[href*="/blog/"]').count();
    report(`Links para artigos: ${articleCards}`, articleCards > 2);
    
    // Header navigation
    const navLinks = await homePage.locator('nav a, header a[href]').count();
    report(`Links de navegação: ${navLinks}`, navLinks > 5);
    
    // Footer
    const footerLinks = await homePage.locator('footer a').count();
    report(`Links no footer: ${footerLinks}`, footerLinks > 5);
    
    // Favicon
    const favicon = await homePage.locator('link[rel="icon"]').count();
    report('Favicon configurado', favicon > 0);
    
    homePage.close();

    // ── TEST 2: Blog Page ─────────────────────────────────
    console.log('\n📄 BLOG');
    const blogPage = await context.newPage();
    await blogPage.goto(BASE_URL + '/blog/', { waitUntil: 'networkidle', timeout: 30000 });
    
    const blogTitle = await blogPage.title();
    report(`Title: "${blogTitle.substring(0, 50)}"`, blogTitle.length > 0);
    
    // Category filter
    const categoryFilter = await blogPage.locator('a[href*="category="], [class*="categoria"], [class*="filter"]').count();
    warn(`Filtros de categoria: ${categoryFilter > 0 ? 'presente' : 'ausente'}`);
    
    // Search input
    const search = await blogPage.locator('input[type="search"], input[type="text"][placeholder*="busca"i], input[type="text"][placeholder*="pesquis"i]').count();
    warn(`Campo de busca: ${search > 0 ? 'presente' : 'ausente'}`);
    
    blogPage.close();

    // ── TEST 3: Article Page ──────────────────────────────
    console.log('\n📄 PÁGINA DE ARTIGO');
    const articlePage = await context.newPage();
    const articleUrl = BASE_URL + '/blog/bem-vindo-ao-artigocomcafe-sua-pausa-para-o-conhecimento/';
    
    await articlePage.goto(articleUrl, { waitUntil: 'networkidle', timeout: 30000 });
    const articleTitle = await articlePage.title();
    report(`Title carregado (${articleTitle.length} chars)`, articleTitle.length > 10);
    
    // Content
    const articleContent = await articlePage.locator('article, main, [class*="content"], [class*="post"]').count();
    report('Conteúdo do artigo presente', articleContent > 0);
    
    // Reading time
    const readingTime = await articlePage.locator('text=min, text=leitura').count();
    warn(`Tempo de leitura: ${readingTime > 0 ? 'presente' : 'ausente'}`);
    
    // Related articles
    const related = await articlePage.locator('text=Continue Lendo, text=Relacionados').count();
    warn(`Artigos relacionados: ${related > 0 ? 'presente' : 'ausente'}`);
    
    // Breadcrumbs
    const breadcrumbs = await articlePage.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"i], nav[aria-label*="migalha"i]').count();
    warn(`Breadcrumbs: ${breadcrumbs > 0 ? 'presente' : 'ausente'}`);
    
    articlePage.close();

    // ── TEST 4: Public Pages ──────────────────────────────
    console.log('\n📄 PÁGINAS PÚBLICAS');
    for (const path of PUBLIC_PAGES) {
      const page = await context.newPage();
      try {
        const resp = await page.goto(BASE_URL + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const status = resp?.status() || 0;
        const title = await page.title();
        report(`${path} (${status}): "${title.substring(0, 40)}"`, status === 200, `Status: ${status}`);
      } catch (err) {
        report(`${path}`, false, err.message.substring(0, 80));
      }
      page.close();
    }

    // ── TEST 5: Auth Pages ────────────────────────────────
    console.log('\n🔒 PÁGINAS PROTEGIDAS');
    for (const path of AUTH_PAGES) {
      const page = await context.newPage();
      try {
        const resp = await page.goto(BASE_URL + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const status = resp?.status() || 0;
        const title = await page.title();
        // Auth pages may redirect to login (302/200 login page) or return 401
        const isExpected = status === 200 || status === 302 || status === 401;
        warn(`${path} (${status}): "${title.substring(0, 40)}"${!isExpected ? ' (inesperado)' : ''}`);
      } catch (err) {
        warn(`${path}: erro - ${err.message.substring(0, 60)}`);
      }
      page.close();
    }

    // ── TEST 6: 404 Page ──────────────────────────────────
    console.log('\n📄 PÁGINA 404');
    const page404 = await context.newPage();
    const resp404 = await page404.goto(BASE_URL + '/pagina-inexistente-12345/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    report('404 retorna código 404', resp404?.status() === 404, `Status: ${resp404?.status()}`);
    const title404 = await page404.title();
    report(`Title 404: "${title404.substring(0, 50)}"`, title404.includes('não encontrada') || title404.includes('404') || title404.includes('inexistente'));
    page404.close();

    // ── TEST 7: Service Worker ────────────────────────────
    console.log('\n⚙️  SERVICE WORKER');
    const swPage = await context.newPage();
    await swPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    const swStatus = await swPage.evaluate(() => {
      return navigator.serviceWorker?.getRegistration('/').then(r => ({
        scope: r?.scope || '',
        active: !!r?.active,
        state: r?.active?.state || '',
      })).catch(() => null);
    });
    
    report('Service Worker registrado e ativo', swStatus?.active === true,
      swStatus ? `scope: ${swStatus.scope}, state: ${swStatus.state}` : 'SW não registrado');
    swPage.close();

    // ── TEST 8: API Proxy ─────────────────────────────────
    console.log('\n🔌 API PROXY');
    const proxyPage = await context.newPage();
    await proxyPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Test proxy via fetch (more reliable than navigation)
    const proxyResults = await proxyPage.evaluate(async () => {
      const results = {};
      try {
        const r = await fetch('/api-proxy.php/test');
        const d = await r.json();
        results.test = { ok: r.ok, data: JSON.stringify(d).substring(0, 60) };
      } catch (e) {
        results.test = { ok: false, error: e.message };
      }
      try {
        const r = await fetch('/api-proxy.php/articles/cafe-do-dia');
        const d = await r.json();
        results.cafe = { ok: r.ok, hasArticle: !!d.article };
      } catch (e) {
        results.cafe = { ok: false, error: e.message };
      }
      return results;
    });
    
    report('Proxy /test retorna API is working', proxyResults.test?.ok === true, 
      proxyResults.test?.data || '');
    report('Proxy /cafe-do-dia retorna artigo', proxyResults.cafe?.hasArticle === true,
      proxyResults.cafe?.ok ? 'Artigo encontrado' : 'Falhou');
    
    proxyPage.close();

    // ── TEST 9: Theme Toggle ──────────────────────────────
    console.log('\n🎨 THEME TOGGLE');
    const themePage = await context.newPage();
    await themePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    const themeBtn = await themePage.locator('[class*="ThemeToggle"], button[aria-label*="tema"i], button[aria-label*="theme"i], button:has-text("Modo")').first();
    const themeBtnExists = await themeBtn.count();
    
    if (themeBtnExists > 0) {
      // Get initial theme
      const initialTheme = await themePage.evaluate(() => document.documentElement.getAttribute('data-theme'));
      warn(`Tema inicial: ${initialTheme || 'default'}`);
      
      // Click the toggle
      await themeBtn.click();
      await themePage.waitForTimeout(300);
      
      // Get new theme
      const newTheme = await themePage.evaluate(() => document.documentElement.getAttribute('data-theme'));
      const themeChanged = initialTheme !== newTheme;
      report('Theme toggle funciona', themeChanged, 
        themeChanged ? `${initialTheme || 'default'} → ${newTheme || 'default'}` : 'Tema não mudou');
      
      // Toggle back
      await themeBtn.click();
      await themePage.waitForTimeout(300);
      const finalTheme = await themePage.evaluate(() => document.documentElement.getAttribute('data-theme'));
      report('Theme toggle retorna ao original', finalTheme === initialTheme || finalTheme === null && initialTheme === null);
    } else {
      warn('Botão de theme toggle não encontrado');
    }
    themePage.close();

    // ── TEST 10: Performance ──────────────────────────────
    console.log('\n⚡ PERFORMANCE');
    const perfPage = await context.newPage();
    
    const perfStart = Date.now();
    await perfPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const perfTime = Date.now() - perfStart;
    
    const perfMetrics = await perfPage.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadEvent: nav ? Math.round(nav.loadEventEnd) : null,
      };
    });
    
    report(`Homepage carregou em ${perfTime}ms`, perfTime < 10000, 
      perfTime > 7000 ? 'Acima de 7s' : '');
    if (perfMetrics.domContentLoaded) {
      warn(`DOM Content Loaded: ${perfMetrics.domContentLoaded}ms`);
    }
    if (perfMetrics.loadEvent) {
      warn(`Load Event: ${perfMetrics.loadEvent}ms`);
    }
    perfPage.close();

    // ── TEST 11: Resource Errors ──────────────────────────
    console.log('\n📦 REQUISIÇÕES COM ERRO');
    
    // Filter out known auth redirects
    const criticalBadResponses = badResponses.filter(r => 
      r.status >= 500 || (r.status >= 400 && !r.url.includes('/api/') && !r.url.includes('/user/'))
    );
    
    if (criticalBadResponses.length === 0) {
      report('Nenhum recurso crítico com erro', true);
    } else {
      for (const br of criticalBadResponses) {
        report(`Recurso ${br.status}`, false, br.url);
      }
    }
    
    // All bad responses (for info)
    if (badResponses.length > 0) {
      warn(`${badResponses.length} requisições retornaram status >= 400 (incluindo auth esperado)`);
    }

    // ── TEST 12: Console Errors ───────────────────────────
    console.log('\n🚨 ERROS NO CONSOLE');
    
    // Filter out known benign errors
    const criticalErrors = consoleErrors.filter(e => 
      !e.text.includes('ERR_CERT') && 
      !e.text.includes('favicon') && 
      !e.text.includes('Failed to load resource') &&
      !e.text.includes('404')
    );
    
    if (criticalErrors.length === 0) {
      report('Nenhum erro crítico no console', true);
    } else {
      for (const err of criticalErrors) {
        report('Erro no console', false, `[${err.url}] ${err.text.substring(0, 100)}`);
      }
    }
    
    if (consoleErrors.length > criticalErrors.length) {
      warn(`${consoleErrors.length - criticalErrors.length} erros benignos ignorados (cert/404/favicon)`);
    }

  } catch (err) {
    console.error('\n💥 ERRO FATAL:', err.message);
    RESULTS.failed++;
  } finally {
    await browser.close();
  }
}

async function run() {
  console.log('\n🔍 AUDITORIA COMPLETA DO SITE');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌐 ${BASE_URL}`);
  
  // Run desktop tests
  await runSuite({ width: 1280, height: 800 }, 'DESKTOP (1280x800)');
  
  // Run mobile tests
  await runSuite({ width: 375, height: 812 }, 'MOBILE (375x812)');
  
  // ── FINAL REPORT ────────────────────────────────────────
  console.log('\n\n' + '📊'.repeat(20));
  console.log('📊 RELATÓRIO FINAL DA AUDITORIA');
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
  
  let grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  console.log(`📝 GRADE: ${grade}`);
  console.log('');
  
  process.exit(RESULTS.failed > 5 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
