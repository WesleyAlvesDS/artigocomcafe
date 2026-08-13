// Teste isolado do P0 auth (novo interceptor 401).
// Não requer credenciais nem backend real: intercepta /api-proxy.php e mocka respostas.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve('dist');
const PORT = 4341;
const BASE = `http://localhost:${PORT}`;

let server;
function startServer() {
  return new Promise((resolve) => {
    server = spawn('node', ['tests/playwright/static-server.mjs', String(PORT), 'dist'], {
      stdio: 'ignore', detached: false,
    });
    setTimeout(resolve, 800);
  });
}

const results = [];
function report(name, passed, detail = '') {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
}

// Mocka o proxy PHP: /auth/login -> 401 credencial, /auth/me -> 401 expirado
async function mockApi(page, route) {
  await page.route('**/api-proxy.php**', async (r) => {
    const url = new URL(r.request().url());
    const path = url.pathname.replace('/api-proxy.php', '');
    console.log(`  [mock] ${r.request().method()} ${path}`);
    if (path.startsWith('/auth/login')) {
      await r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'As credenciais fornecidas estão incorretas.', errors: { email: ['As credenciais fornecidas estão incorretas.'] } }),
      });
    } else if (path.startsWith('/auth/me')) {
      await r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthenticated.' }) });
    } else {
      await r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'not found' }) });
    }
  });
}

// Aceita os cookies (remove o overlay que cobre a tela)
async function acceptCookies(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cookie-consent', JSON.stringify({
        essential: true, analytics: true, marketing: true, version: 1,
        date: new Date().toISOString(),
      }));
    } catch (e) {}
  });
}

(async () => {
  await startServer();
  const browser = await chromium.launch();

  try {
    // ── 1. Login inválido: mostra erro no form, NÃO redireciona, NÃO mostra toast ──
    const ctx1 = await browser.newContext();
    const page1 = await ctx1.newPage();
    await mockApi(page1);
    await acceptCookies(page1);
    let toastSeen1 = false;
    await page1.exposeFunction('__capToast1', (t) => { toastSeen1 = true; });
    await page1.addInitScript(() => {
      window.addEventListener('app:show-toast', () => { window.__capToast1?.(); });
    });
    await page1.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
    await page1.locator('input[type="email"]').first().fill('nao@existe.com');
    await page1.locator('input[type="password"]').first().fill('senha_errada');
    await page1.locator('button[type="submit"]').first().click();
    await page1.waitForTimeout(1200);
    const url1 = new URL(page1.url());
    const errorMsg = (await page1.locator('[role="alert"]').first().textContent().catch(() => '')) || '';
    report('Login inválido permanece em /entrar (sem redirect)', url1.pathname.startsWith('/entrar'), url1.pathname);
    report('Login inválido mostra mensagem de erro no form', errorMsg.trim().length > 0, errorMsg.trim().substring(0, 50));
    report('Login inválido NÃO dispara toast de sessão expirada', !toastSeen1);
    await ctx1.close();

    // ── 2. Token expirado: toast + redirect para /entrar/?next=origem ──
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await mockApi(page2);
    await acceptCookies(page2);
    let toastSeen2 = false;
    await page2.exposeFunction('__capToast2', () => { toastSeen2 = true; });
    await page2.addInitScript(() => {
      if (!sessionStorage.getItem('p0seeded')) {
        sessionStorage.setItem('p0seeded', '1');
        localStorage.setItem('auth_token', 'token_invalido');
      }
      window.addEventListener('app:show-toast', () => { window.__capToast2?.(); });
    });
    await page2.goto(BASE + '/dashboard/', { waitUntil: 'networkidle' });
    await page2.waitForTimeout(1400);
    report('Token expirado dispara toast "Sessão expirada"', toastSeen2);
    const url2 = new URL(page2.url());
    report('Token expirado redireciona para /entrar/?next=', url2.pathname.startsWith('/entrar') && url2.searchParams.has('next'), url2.pathname + url2.search);
    const tokenGone = await page2.evaluate(() => !localStorage.getItem('auth_token'));
    report('Token removido do localStorage', tokenGone);
    await ctx2.close();

    // ── 3. Em /entrar com token expirado: NÃO redireciona (sem loop) ──
    const ctx3 = await browser.newContext();
    const page3 = await ctx3.newPage();
    await mockApi(page3);
    await acceptCookies(page3);
    await page3.addInitScript(() => {
      if (!sessionStorage.getItem('p0seeded')) {
        sessionStorage.setItem('p0seeded', '1');
        localStorage.setItem('auth_token', 'token_invalido');
      }
    });
    await page3.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
    await page3.waitForTimeout(1200);
    const url3 = new URL(page3.url());
    report('Já em /entrar com token expirado: permanece (sem loop)', url3.pathname.startsWith('/entrar'), url3.pathname);
    await ctx3.close();

  } catch (err) {
    console.error('ERRO no teste:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server?.kill();
  }

  const fails = results.filter(r => !r.passed).length;
  console.log(`\n=== P0 AUTH: ${results.length - fails}/${results.length} ✓ ===`);
  process.exitCode = fails > 0 ? 1 : 0;
})();