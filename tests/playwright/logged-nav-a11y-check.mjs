/**
 * Regressão — Acessibilidade do LoggedAreaNav (fix aria-allowed-role)
 *
 * Contexto do bug: os links `.logged-chip` usavam `role="listitem"` num <a>,
 * o que viola ARIA (`aria-allowed-role`, axe). A navegação foi convertida para
 * <ul> → <li> → <a> semântico.
 *
 * Verifica:
 *  - estrutura semântica (.logged-chips = <ul>, filhos <li> com <a> dentro)
 *  - nenhum role="listitem" em <a> nas 10 páginas logadas
 *  - axe rule aria-allowed-role = 0 violações na /biblioteca/
 *  - 10 chips presentes e link ativo correto
 *
 * Uso: node tests/playwright/logged-nav-a11y-check.mjs <port>
 * (servidor estático/preview já rodando, ex.: node tests/playwright/static-server.mjs 4331 dist)
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const PORT = process.argv[2] || 4331;
const BASE = `http://localhost:${PORT}`;

const LOGGED_PAGES = [
  '/dashboard/', '/jornada/', '/missoes/', '/conquistas/', '/trilhas/',
  '/biblioteca/', '/mapa/', '/graos/', '/torrefacao/', '/perfil/',
];

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); }
}

const FAKE_USER = {
  user: {
    id: 1, name: 'Teste Leitor', username: 'teste', email: 'teste@teste.com',
    bio: null, avatar: null, theme: 'cafe',
    reading_time_total: 12, articles_read_count: 5, daily_streak: 3,
    total_grains: 42, completed_trails: 1, collections_count: 2, achievements_count: 4,
  },
};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });

async function newAuthedPage() {
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'fake-token-for-audit');
    localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString(), location: { granted: false, city: 'São Paulo' } }));
    localStorage.setItem('cookie-location', 'city');
  });
  await page.route('**/auth/me', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(FAKE_USER),
  }));
  await page.route('**/auth/logout', route => route.fulfill({
    status: 200, contentType: 'application/json', body: '{}',
  }));
  return page;
}

// ── Estrutura semântica em todas as páginas logadas ──
console.log('\n=== LoggedAreaNav: estrutura semântica (ul > li > a) ===');
for (const path of LOGGED_PAGES) {
  const page = await newAuthedPage();
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
    const nav = page.locator('.logged-nav');
    if (await nav.count() === 0) { check(`${path}: .logged-nav presente`, false); await page.close(); continue; }

    const chips = nav.locator('.logged-chip');
    const chipsCount = await chips.count();

    // 1. .logged-chips é um <ul>
    const listTag = await nav.locator('.logged-chips').evaluate(el => el.tagName.toLowerCase());
    check(`${path}: .logged-chips é <ul>`, listTag === 'ul', `tag=${listTag}`);

    // 2. cada chip está dentro de um <li> (pai imediato)
    const itemsOk = await chips.evaluateAll(els => els.every(a => a.parentElement?.tagName.toLowerCase() === 'li'));
    check(`${path}: cada chip está em <li> (${chipsCount})`, itemsOk);

    // 3. nenhum role="listitem" em <a>
    const badRoles = await nav.locator('a[role="listitem"]').count();
    check(`${path}: nenhum <a role="listitem">`, badRoles === 0, `encontrados: ${badRoles}`);

    // 4. nenhum role="list" no container (substituído por <ul> real)
    const badList = await nav.locator('[role="list"]').count();
    check(`${path}: nenhum role="list" remanescente`, badList === 0, `encontrados: ${badList}`);
  } catch (e) {
    check(`carregou ${path}`, false, e.message);
  }
  await page.close();
}

// ── axe: aria-allowed-role na /biblioteca/ ──
console.log('\n=== axe aria-allowed-role (/biblioteca/) ===');
{
  const page = await newAuthedPage();
  try {
    await page.goto(BASE + '/biblioteca/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page }).withRules(['aria-allowed-role']).analyze();
    const detail = results.violations.flatMap(v => v.nodes.map(n => n.target.join(' '))).join(' | ');
    check('axe: 0 violações de aria-allowed-role', results.violations.length === 0, detail.substring(0, 120));
    // axe no geral também (nav sem violações)
    const all = await new AxeBuilder({ page }).analyze();
    const navViol = all.violations.filter(v => v.nodes.some(n => n.target.some(t => String(t).includes('logged'))));
    check('axe: sem violações no .logged-nav', navViol.length === 0,
      navViol.map(v => v.id).join(', '));
  } catch (e) {
    check('rodou axe na /biblioteca/', false, e.message);
  }
  await page.close();
}

// ── Integridade dos chips (10 áreas + ativo) ──
console.log('\n=== Integridade dos chips ===');
{
  const page = await newAuthedPage();
  await page.goto(BASE + '/biblioteca/', { waitUntil: 'networkidle', timeout: 30000 });
  const nav = page.locator('.logged-nav');
  const chips = nav.locator('.logged-chip');
  const chipsCount = await chips.count();
  check(`10 chips presentes`, chipsCount === 10, `got ${chipsCount}`);

  const hrefs = await chips.evaluateAll(els => els.map(a => a.getAttribute('href')));
  const expected = ['/dashboard', '/jornada', '/missoes', '/trilhas', '/conquistas', '/biblioteca', '/mapa', '/graos', '/torrefacao', '/perfil'];
  const same = JSON.stringify(hrefs) === JSON.stringify(expected);
  check('hrefs das 10 áreas corretos', same, hrefs.join(','));

  const active = await nav.locator('.logged-chip.active').first().textContent().catch(() => '');
  check('chip ativo = Biblioteca', (active || '').trim().includes('Biblioteca'), `got "${active}"`);
  await page.close();
}

await browser.close();
console.log(`\n${'='.repeat(50)}`);
console.log(`RESULTADO: ${passed} ✅ | ${failed} ❌`);
process.exit(failed > 0 ? 1 : 0);
