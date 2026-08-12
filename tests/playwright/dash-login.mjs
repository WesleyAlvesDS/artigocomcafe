/**
 * Teste de Login no Dashboard (Filament) - Artigo com Café
 * Usando Playwright
 *
 * Uso: node tests/playwright/dash-login.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.DASH_URL || 'https://dash.artigocomcafe.com';
const EMAIL = process.env.DASH_EMAIL;
const PASSWORD = process.env.DASH_PASSWORD;

// Credenciais nunca são versionadas: devem vir de env vars (DASH_EMAIL, DASH_PASSWORD).
if (!EMAIL || !PASSWORD) {
  console.error('❌ Credenciais ausentes. Defina DASH_EMAIL e DASH_PASSWORD antes de rodar.');
  process.exit(1);
}

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

async function run() {
  console.log('='.repeat(50));
  console.log('🔐 TESTE: LOGIN DASHBOARD');
  console.log('='.repeat(50));

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      // 503 do /livewire/update é polling de background do Filament sob
      // carga do PHP-FPM compartilhado — o Livewire faz auto-retry, não é
      // erro real de aplicação (mesmo critério do api-proxy no site-audit).
      if (msg.text().includes('status of 503')) return;
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Redirect da raiz para /login
    console.log('\n--- Página de login ---');
    await page.goto(BASE_URL + '/', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForURL('**/login', { timeout: 15000 }).catch(() => {});
    const finalUrl = page.url();
    report('Raiz redireciona para /login', finalUrl.endsWith('/login'), finalUrl);

    // 2. Página de login carrega com título
    const title = await page.title();
    report('Login tem título "Login"', title.toLowerCase().includes('login'), title);

    // 3. Campos email e senha visíveis
    const emailVisible = await page.locator('input[type="email"]:visible').first().isVisible();
    const passwordVisible = await page.locator('input[type="password"]:visible').first().isVisible();
    report('Campo de email visível', emailVisible);
    report('Campo de senha visível', passwordVisible);

    // 4. Login com credenciais
    console.log('\n--- Enviando credenciais ---');
    await page.locator('input[type="email"]:visible').first().fill(EMAIL);
    await page.locator('input[type="password"]:visible').first().fill(PASSWORD);
    await page.locator('form button[type="submit"]').first().click();

    // Aguarda apenas a transição do login; `networkidle` é instável em Livewire.
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(1000);

    const loggedInUrl = page.url();
    const stillLogin = loggedInUrl.includes('/login');
    report('Login bem-sucedido (saiu de /login)', !stillLogin, loggedInUrl);

    if (!stillLogin) {
      // 5. Dashboard renderiza
      const body = await page.locator('body').innerText();
      const hasDashboard = /dashboard|painel de controle|bem-vindo|artigos|usuários|users|articles/i.test(body);
      report('Dashboard renderiza conteúdo', hasDashboard, body.slice(0, 200));
      report('Sem erros no console', consoleErrors.length === 0, consoleErrors.join(' | '));

      // 6. Logout funciona
      console.log('\n--- Logout ---');
      // O botão "Sair" é <button type="submit"> dentro de um <form action="/logout">
      // (Filament account widget). Mira o formulário diretamente para evitar
      // o elemento duplicado com ícone-only que confunde o getByRole().
      // Envia o form de logout diretamente (submit() ignora intercepções do
      // Livewire que podem travar o clique sintético do Playwright).
      const submitted = await page.evaluate(() => {
        const form = document.querySelector('form[action*="logout"], form.fi-account-widget-logout-form');
        if (!form) return false;
        form.submit();
        return true;
      });
      if (!submitted) {
        // Fallback: botão/link "Sair" visível em qualquer lugar da página
        await page.locator('button:has-text("Sair"):visible, a:has-text("Sair"):visible').first().click({ force: true }).catch(() => {});
      }
      // Aguarda o redirect real em vez de tempo fixo (Livewire/Filament pode demorar)
      await page
        .waitForURL((url) => url.pathname.includes('/login'), {
          timeout: 15000,
          waitUntil: 'domcontentloaded',
        })
        .catch(() => {});
      const afterLogout = page.url();
      report('Logout redireciona para login', afterLogout.includes('/login'), afterLogout);
    } else {
      // Tenta ver a mensagem de erro
      const errorText = await page.locator('body').innerText().catch(() => '');
      const hasError = /erro|invalid|incorrect|não confere/i.test(errorText);
      report('Mensagem de erro exibida no login', hasError, errorText.slice(0, 200));
    }
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
