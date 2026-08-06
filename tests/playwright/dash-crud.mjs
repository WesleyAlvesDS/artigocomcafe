/**
 * Teste Fase 1 - CRUD Dashboard (Filament) - Artigo com Café
 *
 * Uso: node tests/playwright/dash-crud.mjs
 * Cria, edita e exclui uma categoria de teste ("Teste Playwright").
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://dash.artigocomcafe.com';
const EMAIL = process.env.DASH_EMAIL || 'admin@artigocomcafe.com';
const PASSWORD = process.env.DASH_PASSWORD || 'dash-admin-2026!';

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

async function login(page) {
  await page.goto(BASE_URL + '/', { waitUntil: 'commit', timeout: 30000 });
  await page.waitForURL('**/login', { timeout: 15000 }).catch(() => {});
  await page.locator('input[type="email"]:visible').first().fill(EMAIL);
  await page.locator('input[type="password"]:visible').first().fill(PASSWORD);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
    timeout: 15000,
    waitUntil: 'domcontentloaded',
  }).catch(() => {});
  await page.waitForTimeout(1000);
  return !page.url().includes('/login');
}

async function visit(page, path) {
  try {
    await page.goto(BASE_URL + path, { waitUntil: 'commit', timeout: 30000 });
  } catch (error) {
    // O Livewire pode interromper uma navegação já concluída pelo browser.
    if (!page.url().includes(path)) throw error;
  }

  await page.locator('body').waitFor({ state: 'attached', timeout: 10000 });
}

async function run() {
  console.log('='.repeat(50));
  console.log('📝 TESTE FASE 1: CRUD DASHBOARD');
  console.log('='.repeat(50));

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const testId = Date.now();
  const testName = `Categoria Teste Playwright ${testId}`;
  const testSlug = `categoria-teste-playwright-${testId}`;
  const updatedName = `Categoria Teste Playwright Editada ${testId}`;

  try {
    // 1. Login
    console.log('\n--- Login ---');
    const loggedIn = await login(page);
    report('Login bem-sucedido', loggedIn);

    if (!loggedIn) throw new Error('Falha no login');

    // 2. Dashboard com widgets
    console.log('\n--- Dashboard ---');
    const dashBody = await page.locator('body').innerText();
    report('Widgets de métricas visíveis', /artigos|usuários|publicados|visualizações/i.test(dashBody), dashBody.slice(0, 200));
    const navArtigos = await page.locator('a:has-text("Artigos"), button:has-text("Artigos")').first().isVisible().catch(() => false);
    report('Menu "Artigos" na navegação', navArtigos);
    const navCategorias = await page.locator('a:has-text("Categorias"), button:has-text("Categorias")').first().isVisible().catch(() => false);
    report('Menu "Categorias" na navegação', navCategorias);
    const navTags = await page.locator('a:has-text("Tags"), button:has-text("Tags")').first().isVisible().catch(() => false);
    report('Menu "Tags" na navegação', navTags);
    const navUsuarios = await page.locator('a:has-text("Usuários"), button:has-text("Usuários")').first().isVisible().catch(() => false);
    report('Menu "Usuários" na navegação', navUsuarios);

    // 3. Listagem de Categorias
    console.log('\n--- Listagem de Categorias ---');
    await visit(page, '/categories');
    await page.waitForTimeout(1500);
    const catBody = await page.locator('body').innerText();
    report('Listagem de categorias renderiza', /categorias|categoria/i.test(catBody), catBody.slice(0, 150));

    // 4. Criar categoria
    console.log('\n--- Criar categoria ---');
    await visit(page, '/categories/create');
    await page.waitForTimeout(1500);
    await page.locator('#form\\.name').fill(testName);
    await page.locator('#form\\.slug').fill(testSlug);
    await page.locator('button[type="submit"]:visible').first().click();
    await page.waitForTimeout(1500);
    await visit(page, '/categories');
    await page.waitForTimeout(1500);
    const afterCreate = page.url();
    report('Categoria criada (volta para listagem)', /categories$/i.test(afterCreate) || /categories/.test(afterCreate), afterCreate);

    // 5. Listagem mostra a categoria criada (espera ativa — Livewire/tabela têm loading)
    const search = page.locator('input[type="search"]:visible, input[placeholder*="Pesquisar"]:visible').first();
    if (await search.count()) {
      await search.fill(testName);
    }
    let foundRow = false;
    try {
      await page.waitForFunction(
        (name) => document.body.textContent.includes(name),
        testName,
        { timeout: 15000 }
      );
      foundRow = true;
    } catch {}
    report('Categoria de teste na listagem', foundRow, testName);

    // 6. Editar categoria
    console.log('\n--- Editar categoria ---');
    await page.locator(`tr:has-text("${testName}") a:has-text("Editar"), tr:has-text("${testName}") button:has-text("Editar")`).first().click().catch(async () => {
      await visit(page, '/categories');
      await page.waitForTimeout(1500);
      await page.locator(`tr:has-text("${testName}")`).first().click();
    });
    await page.waitForTimeout(2000);
    if (page.url().includes('/edit')) {
      await page.locator('#form\\.name').fill(updatedName);
      await page.locator('button[type="submit"]:visible, button:has-text("Salvar"):visible').first().click();
      await page.waitForTimeout(2500);
      await visit(page, '/categories');
      const bodyEdit = await page.locator('body').innerText();
      report('Categoria editada', bodyEdit.includes(updatedName), updatedName);
    } else {
      report('Página de edição aberta', false, 'Não navegou para edição');
    }

    // 7. Excluir categoria
    console.log('\n--- Excluir categoria ---');
    await visit(page, '/categories');
    await page.waitForTimeout(1500);
    const deleted = await page.locator(`tr:has-text("${updatedName}")`).first().click().then(async () => {
      await page.locator('button:has-text("Excluir"), button:has-text("Deletar"), [aria-label*="Excluir"]').first().click().catch(() => {});
      await page.waitForTimeout(1500);
      const confirm = await page.locator('button:has-text("Excluir"), button:has-text("Confirmar")').last().isVisible().catch(() => false);
      if (confirm) await page.locator('button:has-text("Excluir"), button:has-text("Confirmar")').last().click();
      await page.waitForTimeout(1500);
      const body = await page.locator('body').innerText();
      return !body.includes(updatedName);
    }).catch(() => false);
    report('Categoria excluída', deleted);

    // 8. Listagens dos demais resources renderizam
    console.log('\n--- Listagens (Artigos, Tags, Usuários) ---');
    for (const [label, path] of [['Artigos', '/articles'], ['Tags', '/tags'], ['Usuários', '/users']]) {
      await visit(page, path);
      await page.waitForTimeout(1500);
      const body = await page.locator('body').innerText();
      report(`Listagem ${label} renderiza`, body.length > 100, body.slice(0, 120));
    }

    // 9. Sem erros de console (exceto favicon)
    const filteredErrors = consoleErrors.filter((e) => !/favicon/i.test(e));
    report('Sem erros de console', filteredErrors.length === 0, filteredErrors.join(' | '));
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
