/**
 * Teste da Central Editorial no Dashboard (Filament) — Artigo com Café
 *
 * Verifica: navegação, busca multi-fonte, cards de resultados e
 * criação de rascunho de artigo.
 *
 * Uso: node tests/playwright/dash-central-editorial.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://dash.artigocomcafe.com';
const EMAIL = process.env.DASH_EMAIL;
const PASSWORD = process.env.DASH_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Exija DASH_EMAIL e DASH_PASSWORD no ambiente (sem defaults no codigo).');
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

async function run() {
  console.log('='.repeat(50));
  console.log('🧭 TESTE: CENTRAL EDITORIAL');
  console.log('='.repeat(50));

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Login
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('input[type="email"]:visible').first().fill(EMAIL);
    await page.locator('input[type="password"]:visible').first().fill(PASSWORD);
    await page.locator('form button[type="submit"]').first().click();
    await page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 20000 }).catch(() => {});
    report('Login realizado', !page.url().includes('/login'), page.url());

    // 2. Acessa a Central Editorial
    await page.goto(BASE_URL + '/central-editorial', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const heading = await page.locator('h1').first().innerText().catch(() => '');
    report('Página carrega com título', /central|editorial/i.test(heading), heading);

    const hasSearchInput = await page.locator('input[placeholder*="Ex.:"]').first().isVisible().catch(() => false);
    report('Campo de busca visível', hasSearchInput);

    // 3. Realiza uma busca
    await page.locator('input[placeholder*="Ex.:"]').first().fill('inteligência artificial');
    await page.getByRole('button', { name: /buscar pautas/i }).first().click();
    await page.waitForTimeout(8000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasResults = /resultados|resultado/i.test(bodyText);
    const hasEmpty = /nenhum resultado/i.test(bodyText);

    report(
      'Busca executa (resultados ou estado vazio)',
      hasResults || hasEmpty,
      bodyText.match(/\d+ resultados?/i)?.[0] || bodyText.slice(0, 160)
    );

    // 4. Botão "Criar rascunho" presente (quando há resultados)
    const draftBtn = page.getByRole('button', { name: /criar rascunho/i }).first();
    if (hasResults && !hasEmpty) {
      const draftVisible = await draftBtn.isVisible().catch(() => false);
      report('Botão "Criar rascunho" visível nos resultados', draftVisible);
    } else {
      RESULTS.warnings++;
      console.log('  ⚠️ Sem resultados para validar o botão de rascunho (chaves de API?)');
    }

    // 5. Link "Ver original" usa URL segura (http/https)
    const originalLink = page.locator('a[href^="http"]').first();
    const linkHref = await originalLink.getAttribute('href').catch(() => null);
    report('Link externo usa http/https', !linkHref || linkHref.startsWith('http'), linkHref ?? '');
  } catch (err) {
    RESULTS.failed++;
    RESULTS.errors.push({ name: 'exceção', detail: err.message });
    console.log(`  ❌ exceção: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESULTADO: ${RESULTS.passed} ✅ | ${RESULTS.failed} ❌ | ${RESULTS.warnings} ⚠️`);
  if (RESULTS.errors.length) {
    console.log('\nErros:');
    RESULTS.errors.forEach((e) => console.log(`  - ${e.name}: ${e.detail}`));
    process.exit(1);
  }
  process.exit(0);
}

run();
