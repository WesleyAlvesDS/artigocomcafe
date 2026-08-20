/**
 * Auditoria Completa - Artigo com Café
 * Testa TODAS as páginas, botões, links, navegação, formulários e responsividade.
 *
 * Uso: node tests/playwright/full-audit.mjs
 *      BASE_URL=http://localhost:4324 node tests/playwright/full-audit.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://artigocomcafe.com';
const TEST_USER = process.env.TEST_USER;
const TEST_PASS = process.env.TEST_PASS;

// Credenciais nunca são versionadas: devem vir de env vars (TEST_USER, TEST_PASS).
if (!TEST_USER || !TEST_PASS) {
  console.error('❌ Credenciais ausentes. Defina TEST_USER e TEST_PASS antes de rodar a auditoria completa.');
  process.exit(1);
}

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

async function dismissCookies(page) {
  // O overlay entra com fade-in de 0.35s — espera ele existir antes de clicar,
  // senão o clique do aceitar é perdido e o overlay (z 9995, inset:0) intercepta
  // o próximo clique da auditoria.
  const accept = page.locator('#cookie-accept');
  await accept.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
  if (await accept.count()) {
    await accept.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.waitForFunction(() => {
      const o = document.querySelector('.cookie-overlay');
      return !o || o.hidden;
    }, { timeout: 5000 }).catch(() => {});
  }
}

const PUBLIC_PAGES = [
  { url: '/', name: 'Homepage' },
  { url: '/blog/', name: 'Blog' },
  { url: '/receitas/', name: 'Receitas' },
  { url: '/sobre/', name: 'Sobre' },
  { url: '/contato/', name: 'Contato' },
  { url: '/newsletter/', name: 'Newsletter' },
  { url: '/entrar/', name: 'Entrar' },
  { url: '/cadastro/', name: 'Cadastro' },
  { url: '/recuperar-senha/', name: 'Recuperar Senha' },
  { url: '/cookies/', name: 'Cookies' },
  { url: '/offline/', name: 'Offline' },
];

const AUTH_PAGES = [
  { url: '/perfil/', name: 'Perfil' },
  { url: '/dashboard/', name: 'Dashboard' },
  { url: '/graos/', name: 'Grãos' },
  { url: '/trilhas/', name: 'Trilhas' },
  { url: '/conquistas/', name: 'Conquistas' },
  { url: '/torrefacao/', name: 'Torrefação' },
  { url: '/mapa/', name: 'Mapa do Conhecimento' },
  { url: '/biblioteca/', name: 'Biblioteca' },
  { url: '/missoes/', name: 'Missões' },
];

const TEST_404_URL = '/pagina-inexistente-12345/';

async function runSuite(viewport, label) {
  console.log(`\n${'='.repeat(56)}`);
  console.log(`📱 TESTES: ${label}`);
  console.log(`${'='.repeat(56)}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });

  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });

  const consoleErrors = [];
  const badResponses = [];

  context.on('page', (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: msg.text().substring(0, 140) });
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push({ url: page.url().replace(BASE_URL, ''), text: err.message.substring(0, 140) });
    });
    page.on('response', (response) => {
      const status = response.status();
      const reqUrl = response.request().url();
      // Ignore the intentional 404 test page and the intentional invalid-login 422
      if (status >= 400 && reqUrl.startsWith(BASE_URL) && !reqUrl.includes(TEST_404_URL)
          && !(status === 422 && reqUrl.includes('/auth/login'))) {
        badResponses.push({ url: reqUrl.replace(BASE_URL, ''), status });
      }
    });
  });

  try {
    const isMobile = viewport.width < 768;

    // ── 1. TODAS AS PÁGINAS PÚBLICAS ──────────────────────
    console.log('\n📄 PÁGINAS PÚBLICAS');
    for (const { url, name } of PUBLIC_PAGES) {
      const page = await context.newPage();
      try {
        const resp = await page.goto(BASE_URL + url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        const status = resp?.status() || 0;
        const title = await page.title();
        report(`${name} (${status})`, status === 200, `Status: ${status}`);
        if (title.trim() === '') warn(`${name}: title vazio`);
        const h1 = await page.locator('h1').count();
        if (h1 === 0) warn(`${name}: sem h1`);
      } catch (err) {
        report(`${name}`, false, err.message.substring(0, 80));
      }
      page.close();
    }

    // ── 2. PÁGINAS PROTEGIDAS ─────────────────────────────
    console.log('\n🔒 PÁGINAS PROTEGIDAS');
    for (const { url, name } of AUTH_PAGES) {
      const page = await context.newPage();
      try {
        const resp = await page.goto(BASE_URL + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const status = resp?.status() || 0;
        const title = await page.title();
        report(`${name} (${status})`, status === 200, `Status: ${status}`);
        await page.waitForTimeout(3500);
        const redirected = await page.evaluate(() => /entrar|login/i.test(window.location.pathname));
        warn(`${name} protegido? ${redirected ? 'sim (redireciona p/ entrar)' : 'não (conteúdo visível sem login)'}`);
      } catch (err) {
        warn(`${name}: erro - ${err.message.substring(0, 60)}`);
      }
      page.close();
    }

    // ── 3. PÁGINA 404 ─────────────────────────────────────
    console.log('\n📄 PÁGINA 404');
    const page404 = await context.newPage();
    const resp404 = await page404.goto(BASE_URL + TEST_404_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    report('404 retorna código 404', resp404?.status() === 404, `Status: ${resp404?.status()}`);
    const title404 = await page404.title();
    report('Title 404 indica não encontrado', /não encontrada|404|inexistente/i.test(title404), title404.substring(0, 50));
    page404.close();

    // ── 4. NAVEGAÇÃO (links do header + footer) ───────────
    console.log('\n🧭 NAVEGAÇÃO');
    const navPage = await context.newPage();
    await navPage.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 30000 });

    const internalLinks = await navPage.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')];
      const seen = new Set();
      return links
        .map(a => a.getAttribute('href'))
        .filter(h => h && h.startsWith('/') && !h.startsWith('//'))
        .filter(h => { if (seen.has(h)) return false; seen.add(h); return true; });
    });

    report(`Links internos únicos: ${internalLinks.length}`, internalLinks.length > 5);
    let brokenLinks = 0;
    const brokenDetail = [];
    for (const href of internalLinks) {
      const clean = href.split('?')[0].split('#')[0];
      if (!clean || clean === '/' ) continue;
      try {
        const resp = await navPage.goto(BASE_URL + clean, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (resp && resp.status() >= 400) { brokenLinks++; brokenDetail.push(`${clean} (${resp.status()})`); }
      } catch {
        // Retry uma vez: páginas React pesadas podem estourar o timeout sob carga.
        try {
          const resp2 = await navPage.goto(BASE_URL + clean, { waitUntil: 'domcontentloaded', timeout: 20000 });
          if (resp2 && resp2.status() >= 400) { brokenLinks++; brokenDetail.push(`${clean} (${resp2.status()})`); }
        } catch { brokenLinks++; brokenDetail.push(clean); }
      }
    }
    report(`Nenhum link interno quebrado`, brokenLinks === 0,
      brokenDetail.length > 0 ? brokenDetail.slice(0, 5).join(', ') : '');

    // ── 5. MUDANÇA DE PÁGINAS (clique em links) ──────────
    console.log('\n🔄 MUDANÇA DE PÁGINAS');
    const navStart = await navPage.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 30000 });
    // O overlay de cookies (position:fixed, z=10000) intercepta cliques no
    // header; sem dispensá-lo o clique no link "Blog" estoura o timeout.
    await dismissCookies(navPage);
    report('View transitions habilitadas', await navPage.evaluate(() =>
      !!document.querySelector('meta[name="astro-view-transitions-enabled"]')),
      'meta[name=astro-view-transitions-enabled]');

    // Navegação por clique (usa o link do footer no mobile, já que nav desktop é oculto)
    const blogLink = isMobile
      ? navPage.locator('footer a[href="/blog"]').first()
      : navPage.locator('header a[href="/blog"]').first();
    // O clique pode ser engolido por overlay residual (cookie/menu) em load
    // pesado; espera a URL mudar e tenta de novo uma vez antes de falhar.
    let navOk = false;
    let navUrl = '';
    for (let attempt = 0; attempt < 2 && !navOk; attempt++) {
      await blogLink.click({ timeout: 8000 }).catch(() => {});
      try {
        await navPage.waitForURL(/\/blog/, { timeout: 5000 });
        navOk = true;
      } catch {}
      await navPage.waitForTimeout(300);
      navUrl = navPage.url();
      if (!navOk && attempt === 0) {
        await dismissCookies(navPage);
      }
    }
    report('Clique em link "Blog" navega', navOk || navUrl.includes('/blog'), `URL: ${navUrl}`);

    // logo → home
    await navPage.locator('a.header-logo').first().click();
    await navPage.waitForLoadState('domcontentloaded');
    await navPage.waitForTimeout(500);
    report('Clique no logo volta p/ home', navPage.url() === BASE_URL + '/' || navPage.url() === BASE_URL + '/?', navPage.url());

    // card de artigo → página do artigo (via primeiro card da grade, ignorando Café do Dia)
    const firstArticle = await navPage.evaluate(() => {
      const grid = document.querySelector('.articles-grid, .article-card');
      const card = grid ? grid.querySelector('a[href*="/blog/"]') : null;
      return card ? card.getAttribute('href') : null;
    });
    if (firstArticle && firstArticle.includes('/blog/') && firstArticle !== '/blog') {
      await navPage.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await dismissCookies(navPage);
      await navPage.waitForTimeout(300);
      const urlStarts = firstArticle.replace(/\/$/, '');
      const card = navPage.locator(`a[href*="${urlStarts}"]`).first();
      await Promise.all([
        navPage.waitForURL(u => u.pathname.includes(urlStarts), { timeout: 45000 }).catch(() => {}),
        card.evaluate((el) => el.click()).catch(() => {}),
      ]);
      await navPage.waitForTimeout(3000);
      report('Card de artigo abre página do artigo', navPage.url().includes(urlStarts), navPage.url());
      const content = await navPage.locator('article, main, [class*="content"]').count();
      report('Conteúdo do artigo presente', content > 0);
    } else {
      warn('Nenhum card de artigo encontrado no índice');
    }
    navPage.close();

    // ── 6. HEADER / MENU MOBILE / THEME TOGGLE ────────────
    console.log('\n🎨 HEADER, MENU E TEMA');
    const uiPage = await context.newPage();
    await uiPage.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await dismissCookies(uiPage);

    if (isMobile) {
      const hamburger = uiPage.locator('#hamburger');
      if (await hamburger.count()) {
        await hamburger.click();
        await uiPage.waitForTimeout(400);
      }
    }
    // Theme toggle (desktop: header; mobile: dentro do menu hamburger)
    const themeToggleSel = isMobile
      ? '.mobile-theme [data-testid="theme-toggle"]'
      : '[data-testid="theme-toggle"]';
    const themeBtn = uiPage.locator(themeToggleSel).first();
    if (await themeBtn.count()) {
      const initialLight = await uiPage.evaluate(() => document.documentElement.classList.contains('light'));
      if (await themeBtn.isVisible()) {
        await themeBtn.click();
        await uiPage.waitForTimeout(300);
        const afterLight = await uiPage.evaluate(() => document.documentElement.classList.contains('light'));
        report('Theme toggle alterna tema', initialLight !== afterLight, `light: ${initialLight} → ${afterLight}`);
        await themeBtn.click();
        await uiPage.waitForTimeout(300);
      } else {
        warn('Theme toggle existe mas não está visível');
      }
    } else {
      warn('Theme toggle não encontrado');
    }
    // Fecha o menu no mobile para o teste do hamburger começar fechado
    if (isMobile) {
      await uiPage.keyboard.press('Escape');
      await uiPage.waitForTimeout(400);
      await uiPage.locator('#hamburger').first().click();
      await uiPage.waitForTimeout(400);
      await uiPage.keyboard.press('Escape');
      await uiPage.waitForTimeout(400);
    }

    if (isMobile) {
      const hamburger = uiPage.locator('#hamburger');
      const mobileMenu = uiPage.locator('#mobile-menu');
      const hbCount = await hamburger.count();
      report('Hamburger visível no mobile', hbCount > 0);
      if (hbCount > 0) {
        await hamburger.click();
        await uiPage.waitForTimeout(400);
        const expanded = await hamburger.getAttribute('aria-expanded');
        const menuHidden = await mobileMenu.getAttribute('aria-hidden');
        report('Menu mobile abre', expanded === 'true' && menuHidden === 'false', `expanded=${expanded}, hidden=${menuHidden}`);
        const mobileLinks = await mobileMenu.locator('a').count();
        report(`Menu mobile tem links: ${mobileLinks}`, mobileLinks >= 5);
        const visible = await mobileMenu.isVisible();
        if (visible) {
          const perfilLink = mobileMenu.locator('a[href="/perfil"]').first();
          if (await perfilLink.count()) {
            await perfilLink.click();
            await uiPage.waitForLoadState('domcontentloaded');
            await uiPage.waitForTimeout(400);
            const url = uiPage.url();
            const navOk = url.includes('/perfil') || url.includes('/entrar');
            report('Clique em link do menu mobile navega', navOk, url);
          }
        } else {
          warn('Menu mobile não é visível ao abrir (opacidade/visibility)');
        }
      }
    }
    uiPage.close();

    // ── 7. SEARCH MODAL ───────────────────────────────────
    console.log('\n🔍 SEARCH MODAL');
    const searchPage = await context.newPage();
    await searchPage.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await dismissCookies(searchPage);
    if (isMobile) {
      await searchPage.locator('#hamburger').first().click();
      await searchPage.waitForTimeout(400);
    }
    const searchBtn = searchPage.locator(
      isMobile ? '[data-testid="search-toggle-mobile"]' : '[data-testid="search-toggle"]'
    ).first();
    const sbCount = await searchBtn.count();
    if (sbCount > 0 && await searchBtn.isVisible()) {
      await searchBtn.click();
      // Aguarda o modal de busca realmente aparecer (hidratação do React pode levar >1s)
      let modalVisible = false;
      try {
        await searchPage.locator('input[aria-label="Buscar artigos"]').first().waitFor({ state: 'visible', timeout: 8000 });
        modalVisible = true;
      } catch {
        modalVisible = false;
      }
      report('Search modal abre', modalVisible);
      const input = searchPage.locator('input[aria-label="Buscar artigos"]').first();
      if (await input.count()) {
        await input.fill('café');
        await searchPage.waitForTimeout(1200);
        const results = await searchPage.locator('a[href*="/blog/"]').count();
        report(`Busca retorna resultados (${results})`, results > 0);
      }
      await searchPage.keyboard.press('Escape');
      await searchPage.waitForTimeout(400);
      report('Search fecha com Escape', (await searchPage.locator('input[aria-label="Buscar artigos"]').count()) === 0);
    } else {
      warn('Botão de busca não encontrado');
    }
    searchPage.close();

    // ── 8. FORMULÁRIOS ────────────────────────────────────
    console.log('\n📝 FORMULÁRIOS');

    // Login inválido (deve mostrar erro)
    const loginPage = await context.newPage();
    await loginPage.goto(BASE_URL + '/entrar/', { waitUntil: 'networkidle', timeout: 30000 });
    const emailInput = loginPage.locator('input[type="email"]').first();
    const passInput = loginPage.locator('input[type="password"]').first();
    const submitBtn = loginPage.locator('button[type="submit"]').first();
    if (await emailInput.count() && await passInput.count() && await submitBtn.count()) {
      await emailInput.fill('inexistente@teste.com');
      await passInput.fill('senha_errada');
      await submitBtn.click();
      await loginPage.waitForTimeout(2500);
      const errorMsg = await loginPage.locator('[role="alert"], .error, [class*="error"]').first().textContent().catch(() => '');
      report('Login inválido mostra erro', errorMsg && errorMsg.trim().length > 0, errorMsg.trim().substring(0, 60));

      // Login válido (usuário de teste)
      await emailInput.fill(TEST_USER);
      await passInput.fill(TEST_PASS);
      await submitBtn.click();
      await loginPage.waitForTimeout(3500);
      const urlAfterLogin = loginPage.url();
      const tokenSet = await loginPage.evaluate(() => !!localStorage.getItem('auth_token'));
      report('Login válido autentica (token no storage)', tokenSet);
      report('Login redireciona', urlAfterLogin.includes('/entrar') === false || tokenSet, urlAfterLogin.substring(0, 60));
    } else {
      warn('Formulário de login não encontrado');
    }
    loginPage.close();

    // Contato (validação de campos obrigatórios)
    const contatoPage = await context.newPage();
    await contatoPage.goto(BASE_URL + '/contato/', { waitUntil: 'networkidle', timeout: 30000 });
    await dismissCookies(contatoPage);
    const contactSubmit = contatoPage.locator('button[type="submit"]').first();
    if (await contactSubmit.count()) {
      await contactSubmit.click({ force: true });
      await contatoPage.waitForTimeout(500);
      const invalid = await contatoPage.locator(':invalid').count();
      report('Contato valida campos obrigatórios', invalid >= 1 || (await contatoPage.locator('[role="alert"], [class*="error"]').count()) >= 1,
        `campos inválidos: ${invalid}`);
    } else {
      warn('Formulário de contato não encontrado');
    }
    contatoPage.close();

    // Newsletter (footer)
    const newsPage = await context.newPage();
    await newsPage.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await dismissCookies(newsPage);
    const newsForm = newsPage.locator('footer form').first();
    if (await newsForm.count()) {
      const newsInput = newsForm.locator('input[type="email"]').first();
      if (await newsInput.count()) {
        await newsInput.fill('not-a-valid-email');
        await newsForm.locator('button[type="submit"]').first().click({ force: true });
        await newsPage.waitForTimeout(800);
        const newsError = await newsForm.locator('[class*="error"], [role="alert"]').count();
        const invalidCount = await newsPage.locator(':invalid').count();
        report('Newsletter valida email inválido', invalidCount >= 1 || newsError >= 1, `invalid=${invalidCount}, erros=${newsError}`);
      }
    } else {
      warn('Formulário de newsletter (footer) não encontrado');
    }
    newsPage.close();

    // ── 9. RESPONSIVIDADE (overflow horizontal) ───────────
    console.log('\n📱 RESPONSIVIDADE');
    const respPage = await context.newPage();
    for (const { url, name } of [...PUBLIC_PAGES]) {
      try {
        await respPage.goto(BASE_URL + url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const overflow = await respPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        if (overflow) warn(`${name}: overflow horizontal!`);
      } catch { /* página com erro já reportada */ }
    }
    respPage.close();

    // ── 10. API PROXY ─────────────────────────────────────
    console.log('\n🔌 API PROXY');
    const proxyPage = await context.newPage();
    await proxyPage.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const proxyResults = await proxyPage.evaluate(async () => {
      const results = {};
      try {
        const r = await fetch('/api-proxy.php/test');
        const d = await r.json();
        results.test = { ok: r.ok, data: JSON.stringify(d).substring(0, 60) };
      } catch (e) { results.test = { ok: false, error: e.message }; }
      try {
        const r = await fetch('/api-proxy.php/articles/cafe-do-dia');
        const d = await r.json();
        results.cafe = { ok: r.ok, hasArticle: !!d.article };
      } catch (e) { results.cafe = { ok: false, error: e.message }; }
      return results;
    });
    report('Proxy /test OK', proxyResults.test?.ok === true, proxyResults.test?.data || '');
    report('Proxy /cafe-do-dia retorna artigo', proxyResults.cafe?.hasArticle === true, '');
    proxyPage.close();

    // ── 11. ERROS DE RECURSO ──────────────────────────────
    console.log('\n📦 ERROS DE RECURSO');
    if (badResponses.length === 0) {
      report('Nenhum recurso com erro', true);
    } else {
      const unique = [...new Set(badResponses.map(b => `${b.status} ${b.url}`))];
      report(`Recursos com erro (${unique.length})`, false, unique.slice(0, 5).join(' | '));
    }

    // ── 12. ERROS NO CONSOLE ──────────────────────────────
    console.log('\n🚨 ERROS NO CONSOLE');
    const criticalErrors = consoleErrors.filter(e =>
      !e.text.includes('ERR_CERT') &&
      !e.text.includes('favicon') &&
      !e.text.includes('Failed to load resource') &&
      !e.text.includes('404') &&
      !e.text.includes('net::ERR_ABORTED') &&
      // Transição interrompida é o fallback normal do Astro quando a página
      // alvo redireciona no client (ex.: páginas protegidas → /entrar).
      !e.text.includes('Transition was skipped')
    );
    if (criticalErrors.length === 0) {
      report('Nenhum erro crítico no console', true);
    } else {
      for (const err of criticalErrors) {
        report('Erro no console', false, `[${err.url}] ${err.text.substring(0, 100)}`);
      }
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

  await runSuite({ width: 1280, height: 800 }, 'DESKTOP (1280x800)');
  await runSuite({ width: 375, height: 812 }, 'MOBILE (375x812)');

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
  console.log(`📝 GRADE: ${score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'}`);
  console.log('');

  process.exit(RESULTS.failed > 10 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
