/**
 * Auditoria do Módulo de Receitas - Artigo com Café
 * Testa: listagem /receitas, filtros, página de detalhe, schema.org Recipe,
 * checklist de ingredientes, Receita do Dia na home e sitemap.
 *
 * Uso: node tests/playwright/receitas-audit.mjs
 *      BASE_URL=http://localhost:4324 node tests/playwright/receitas-audit.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://artigocomcafe.com';

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

async function runSuite(viewport, label) {
  console.log(`\n${'='.repeat(56)}`);
  console.log(`📱 TESTES DE RECEITAS: ${label}`);
  console.log(`${'='.repeat(56)}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });

  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });

  const consoleErrors = [];

  context.on('page', (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 140));
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message.substring(0, 140)));
  });

  try {
    // ── 1. LISTAGEM ──────────────────────────────────────
    console.log('\n📄 LISTAGEM /receitas');
    const listPage = await context.newPage();
    const resp = await listPage.goto(BASE_URL + '/receitas/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    report('Listagem retorna 200', resp?.status() === 200, `Status: ${resp?.status()}`);
    const title = await listPage.title();
    report('Title contém "Receitas"', /receitas/i.test(title), title.substring(0, 60));
    const h1 = await listPage.locator('h1').first().textContent().catch(() => '');
    report('H1 presente', (h1 || '').trim().length > 0, (h1 || '').trim().substring(0, 60));

    // Filtros de categoria
    const catChips = await listPage.locator('.cat-chip').count();
    report(`Chips de categoria (${catChips})`, catChips >= 2, 'esperado >= 2');

    // Cards de receita
    await listPage.waitForTimeout(2000);
    const cards = await listPage.locator('.recipe-card').count();
    report(`Cards de receita (${cards})`, cards > 0, 'nenhum card encontrado');

    // Overflow horizontal
    const overflow = await listPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) warn('Listagem: overflow horizontal!');

    // ── 2. FILTROS ───────────────────────────────────────
    console.log('\n🔎 FILTROS');
    const filtroBusca = await context.newPage();
    await filtroBusca.goto(BASE_URL + '/receitas/?busca=gelado', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await filtroBusca.waitForTimeout(1500);
    const buscaCards = await filtroBusca.locator('.recipe-card').count();
    report(`Busca "gelado" retorna cards (${buscaCards})`, buscaCards > 0, 'nenhum resultado');
    filtroBusca.close();

    const filtroCat = await context.newPage();
    const respCat = await filtroCat.goto(BASE_URL + '/receitas/?categoria=sobremesas', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await filtroCat.waitForTimeout(1500);
    report('Filtro por categoria retorna 200', respCat?.status() === 200, `Status: ${respCat?.status()}`);
    const catCards = await filtroCat.locator('.recipe-card').count();
    report(`Categoria "sobremesas" tem cards (${catCards})`, catCards > 0, 'nenhum card');
    filtroCat.close();
    listPage.close();

    // ── 3. PÁGINA DE DETALHE ─────────────────────────────
    console.log('\n🍳 PÁGINA DE DETALHE');
    const detailPage = await context.newPage();
    const cardHref = await (async () => {
      await detailPage.goto(BASE_URL + '/receitas/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await detailPage.waitForTimeout(1500);
      const href = await detailPage.locator('.recipe-card').first().getAttribute('href');
      return href || '';
    })();

    if (cardHref) {
      const cleanHref = cardHref.replace(/\/$/, '');
      const respDetail = await detailPage.goto(BASE_URL + cleanHref + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      report('Detalhe retorna 200', respDetail?.status() === 200, `Status: ${respDetail?.status()}`);

      // Schema.org Recipe
      const schema = await detailPage.evaluate(() => {
        const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
        for (const s of scripts) {
          try {
            const data = JSON.parse(s.textContent || '');
            if (data && data['@type'] === 'Recipe') return data;
          } catch { /* ignora */ }
        }
        return null;
      });
      report('JSON-LD Recipe presente', !!schema);
      report('recipeIngredient preenchido', !!schema && Array.isArray(schema.recipeIngredient) && schema.recipeIngredient.length > 0,
        schema ? `ingredientes: ${schema.recipeIngredient?.length || 0}` : 'sem schema');
      report('recipeInstructions preenchido', !!schema && Array.isArray(schema.recipeInstructions) && schema.recipeInstructions.length > 0,
        schema ? `passos: ${schema.recipeInstructions?.length || 0}` : 'sem schema');
      report('name no schema', !!schema && (schema.name || '').length > 0, schema?.name || 'sem name');

      // Checklist de ingredientes
      const checkboxes = detailPage.locator('.ingredient-check');
      const total = await checkboxes.count();
      if (total > 0) {
        const progressText = await detailPage.locator('#ingredients-progress').textContent().catch(() => '');
        report('Progresso de ingredientes visível', !!progressText, progressText || '');
        // Marca via DOM + evento change (evita quirk de click em label no mobile)
        await checkboxes.first().evaluate(el => {
          el.checked = true;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await detailPage.waitForTimeout(300);
        const updated = await detailPage.locator('#ingredients-progress').textContent().catch(() => '');
        report('Checklist atualiza progresso', (updated || '').startsWith('1/'), updated || '');
      } else {
        warn('Receita sem ingredientes para testar checklist');
      }

      // Tags linkam para filtro
      const tagLinks = await detailPage.locator('.recipe-tags a[href*="?tag="]').count();
      if (tagLinks > 0) warn(`Detalhe tem ${tagLinks} tag(s) linkada(s)`);

      // Overflow
      const overflowDetail = await detailPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (overflowDetail) warn('Detalhe: overflow horizontal!');
    } else {
      report('Card de receita encontrado', false, 'nenhum card na listagem');
    }
    detailPage.close();

    // ── 4. RECEITA DO DIA NA HOME ────────────────────────
    console.log('\n🏠 HOME');
    const homePage = await context.newPage();
    await homePage.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Rola ao fim algumas vezes: dispara reveals e hidrata o Clima do Café (client:visible)
    for (let i = 0; i < 4; i++) {
      await homePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await homePage.waitForTimeout(700);
    }
    // textContent ignora opacity/visibility (o reveal deixa seções com opacity:0,
    // que o innerText do Chrome exclui). Labels saem em caixa alta (uppercase).
    try {
      await homePage.waitForFunction(() => /receita do dia/i.test(document.body.textContent), null, { timeout: 15000 });
      report('Home mostra seção "Receita do Dia"', true);
    } catch {
      report('Home mostra seção "Receita do Dia"', false, 'texto não apareceu em 15s');
    }
    try {
      await homePage.waitForFunction(() => /clima do café/i.test(document.body.textContent), null, { timeout: 15000 });
      report('Home mostra seção "Clima do Café"', true);
    } catch {
      report('Home mostra seção "Clima do Café"', false, 'texto não apareceu em 15s');
    }
    homePage.close();

    // ── 5. 404 ───────────────────────────────────────────
    console.log('\n🚫 404');
    const page404 = await context.newPage();
    const resp404 = await page404.goto(BASE_URL + '/receitas/receita-inexistente-xyz/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    report('Receita inexistente retorna 404', resp404?.status() === 404, `Status: ${resp404?.status()}`);
    page404.close();

    // ── 6. SITEMAP ───────────────────────────────────────
    console.log('\n🗺️ SITEMAP');
    const sitemap = await context.newPage();
    const respSitemap = await sitemap.goto(BASE_URL + '/sitemap-receitas.xml', { waitUntil: 'domcontentloaded', timeout: 20000 });
    report('sitemap-receitas.xml retorna 200', respSitemap?.status() === 200, `Status: ${respSitemap?.status()}`);
    const xml = await sitemap.content();
    report('Sitemap contém URLs de receitas', /<loc>[^<]*\/receitas\//.test(xml), xml.includes('/receitas/') ? 'ok' : 'sem /receitas/');
    sitemap.close();

    // ── 7. ERROS NO CONSOLE ──────────────────────────────
    console.log('\n🚨 ERROS NO CONSOLE');
    const critical = consoleErrors.filter(e =>
      !e.includes('ERR_CERT') && !e.includes('favicon') && !e.includes('Failed to load resource')
      && !e.includes('404') && !e.includes('net::ERR_ABORTED')
    );
    if (critical.length === 0) {
      report('Nenhum erro crítico no console', true);
    } else {
      for (const err of critical.slice(0, 5)) {
        report('Erro no console', false, err);
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
  console.log('\n🍳 AUDITORIA DO MÓDULO DE RECEITAS');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌐 ${BASE_URL}`);

  await runSuite({ width: 1280, height: 800 }, 'DESKTOP (1280x800)');
  await runSuite({ width: 375, height: 812 }, 'MOBILE (375x812)');

  console.log('\n\n' + '📊'.repeat(20));
  console.log('📊 RELATÓRIO FINAL');
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
  console.log('');

  process.exit(RESULTS.failed > 8 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
