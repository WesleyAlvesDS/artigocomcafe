/**
 * Auditoria visual das mudanças do "lado logado":
 * - CSS do editor aplicado (PostEditor/assistente)
 * - LoggedAreaNav presente nas páginas logadas (breadcrumb + chips)
 * - UserMenu com link Dashboard e ARIA
 * Uso: node tests/playwright/logged-nav-audit.mjs <port>
 */
import { chromium } from 'playwright';

const PORT = process.argv[2] || 4331;
const BASE = `http://localhost:${PORT}`;

const LOGGED_PAGES = [
  { path: '/dashboard/', crumb: 'Dashboard', active: 'dashboard' },
  { path: '/jornada/', crumb: 'Minha Jornada', active: 'jornada' },
  { path: '/missoes/', crumb: 'Missões', active: 'missoes' },
  { path: '/conquistas/', crumb: 'Conquistas', active: 'conquistas' },
  { path: '/trilhas/', crumb: 'Trilhas de Conhecimento', active: 'trilhas' },
  { path: '/biblioteca/', crumb: 'Minha Biblioteca', active: 'biblioteca' },
  { path: '/mapa/', crumb: 'Mapa do Conhecimento', active: 'mapa' },
  { path: '/graos/', crumb: 'Meus Grãos', active: 'graos' },
  { path: '/torrefacao/', crumb: 'Torrefação', active: 'torrefacao' },
  { path: '/perfil/', crumb: 'Meu Perfil', active: 'perfil' },
];

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); }
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });

const FAKE_USER = {
  user: {
    id: 1, name: 'Teste Leitor', username: 'teste', email: 'teste@teste.com',
    bio: null, avatar: null, theme: 'cafe',
    reading_time_total: 12, articles_read_count: 5, daily_streak: 3,
    total_grains: 42, completed_trails: 1, collections_count: 2, achievements_count: 4,
  },
};

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

// ── LoggedAreaNav em todas as páginas logadas ──
console.log('\n=== LoggedAreaNav (breadcrumb + chips) ===');
for (const p of LOGGED_PAGES) {
  const page = await newAuthedPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 30000 });
    const nav = page.locator('.logged-nav');
    check(`nav presente em ${p.path}`, (await nav.count()) > 0);
    if (await nav.count() > 0) {
      const crumbText = await nav.locator('.crumb-current').first().textContent().catch(() => '');
      check(`breadcrumb "${p.crumb}"`, (crumbText || '').trim() === p.crumb, `got "${crumbText}"`);
      const chips = await nav.locator('.logged-chip').count();
      check(`chips (>=9) em ${p.path}`, chips >= 9, `got ${chips}`);
      const active = await nav.locator('.logged-chip.active').first().textContent().catch(() => '');
      const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      check(`chip ativo = ${p.active}`, norm(active).includes(norm(p.active)), `got "${active}"`);
    }
    // breadcrumb JSON-LD
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents().catch(() => []);
    const hasBreadcrumbLd = ld.some(t => t.includes('BreadcrumbList') && t.includes('/dashboard/'));
    check(`JSON-LD BreadcrumbList com /dashboard em ${p.path}`, hasBreadcrumbLd);
  } catch (e) {
    check(`carregou ${p.path}`, false, e.message);
  }
  check(`sem pageerrors em ${p.path}`, errors.length === 0, errors.join(' | '));
  await page.close();
}

// ── UserMenu no header (deslogado renderiza "Entrar") ──
console.log('\n=== UserMenu no Header ===');
{
  const page = await newAuthedPage();
  await page.goto(BASE + '/jornada/', { waitUntil: 'networkidle', timeout: 30000 });
  const overlay = page.locator('#cookie-overlay, .cookie-overlay');
  if (await overlay.count() > 0) {
    const accept = overlay.locator('button').first();
    if (await accept.count() > 0) { try { await accept.click({ timeout: 3000 }); } catch {} }
  }
  const trigger = page.locator('.user-menu__trigger');
  if (await trigger.count() > 0) {
    await trigger.click();
    const dashLink = page.locator('.user-menu__dropdown a[href="/dashboard"]');
    check('dropdown tem link Dashboard', (await dashLink.count()) > 0);
    const expanded = await trigger.getAttribute('aria-expanded');
    check('aria-expanded="true" ao abrir', expanded === 'true');
    const menuRole = await page.locator('.user-menu__dropdown').getAttribute('role');
    check('role="menu" no dropdown', menuRole === 'menu');
    const countLinks = await page.locator('.user-menu__dropdown a[role="menuitem"]').count();
    check('itens com role=menuitem', countLinks >= 5, `got ${countLinks}`);
  } else {
    check('dropdown abre com token fake', false, 'trigger não encontrado');
  }
  await page.close();
}

// ── CSS do editor embutido no CSS global ──
console.log('\n=== CSS do editor global ===');
{
  const page = await newAuthedPage();
  await page.goto(BASE + '/jornada/', { waitUntil: 'networkidle', timeout: 30000 });
  const present = await page.evaluate(() => {
    const sheets = [...document.styleSheets];
    const all = [];
    for (const s of sheets) {
      try {
        const rules = [...s.cssRules];
        for (const r of rules) all.push((r.selectorText || '').toLowerCase());
      } catch {}
    }
    const joined = all.join(' ');
    return {
      editorToolbar: joined.includes('.editor-toolbar'),
      toolbarBtn: joined.includes('.toolbar-btn'),
      btnDanger: joined.includes('.btn-danger'),
      btnSm: joined.includes('.btn-sm'),
      visuallyHidden: joined.includes('.visually-hidden'),
      formSubmit: joined.includes('.form-submit'),
      spinner: joined.includes('.spinner'),
      loggedNav: joined.includes('.logged-nav'),
    };
  });
  check('CSS .editor-toolbar', present.editorToolbar);
  check('CSS .toolbar-btn', present.toolbarBtn);
  check('CSS .btn-danger', present.btnDanger);
  check('CSS .btn-sm', present.btnSm);
  check('CSS .visually-hidden', present.visuallyHidden);
  check('CSS .form-submit', present.formSubmit);
  check('CSS .spinner', present.spinner);
  check('CSS .logged-nav (global)', present.loggedNav);
  await page.close();
}

// ── Blog (SmartSidebar) sem erros ──
console.log('\n=== Blog: SmartSidebar ===');
{
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString(), location: { granted: false, city: 'São Paulo' } }));
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(BASE + '/blog/', { waitUntil: 'networkidle', timeout: 30000 });
    const first = page.locator('a[href^="/blog/"]').first();
    if (await first.count() > 0) {
      const href = await first.getAttribute('href');
      await page.goto(BASE + href, { waitUntil: 'networkidle', timeout: 30000 });
      const toc = page.locator('.toc-list, .toc-nav');
      check('TOC presente no artigo', (await toc.count()) > 0);
      const ring = page.locator('.progress-ring');
      check('Anel de progresso presente', (await ring.count()) > 0);
      const theme = page.locator('[data-reading-theme]');
      check('Temas de leitura presentes', (await theme.count()) >= 3, `got ${await theme.count()}`);
      const copyBtn = page.locator('#copy-link');
      check('Botão copiar link presente', (await copyBtn.count()) > 0);
      const quickActions = page.locator('.quick-actions .action-btn');
      check('Ações rápidas estilizadas', (await quickActions.count()) >= 4, `got ${await quickActions.count()}`);
    }
  } catch (e) {
    check('carregou blog', false, e.message);
  }
  check('sem pageerrors no blog', errors.length === 0, errors.join(' | '));
  await page.close();
}

await browser.close();
console.log(`\n${'='.repeat(50)}`);
console.log(`RESULTADO: ${passed} ✅ | ${failed} ❌`);
process.exit(failed > 0 ? 1 : 0);
