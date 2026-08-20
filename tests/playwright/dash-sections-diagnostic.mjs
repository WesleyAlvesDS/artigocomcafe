// Diagnostic: walks ALL 10 dashboard sections on the real (production) site
// with a real login, capturing console errors, failed requests, and layout issues.
// Uso: $env:TEST_USER='...'; $env:TEST_PASS='...'; node tests/playwright/dash-sections-diagnostic.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://artigocomcafe.com';
const EMAIL = process.env.TEST_USER || 'pro.wesleyalves@gmail.com';
const PASS = process.env.TEST_PASS || 'Wesl3y@Cafe2026!Dash';

const SECTIONS = [
  { id: 'dashboard', label: 'Visão Geral' },
  { id: 'jornada', label: 'Jornada' },
  { id: 'missoes', label: 'Missões' },
  { id: 'trilhas', label: 'Trilhas' },
  { id: 'conquistas', label: 'Conquistas' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'mapa', label: 'Mapa' },
  { id: 'graos', label: 'Grãos' },
  { id: 'torrefacao', label: 'Torrefação' },
  { id: 'perfil', label: 'Perfil' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const badResponses = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push({ sec: '?', text: m.text().slice(0, 220) }); });
  page.on('pageerror', e => consoleErrors.push({ sec: '?', text: 'PAGEERROR: ' + e.message.slice(0, 220) }));
  page.on('response', r => {
    if (r.status() >= 400) badResponses.push({ sec: '?', url: r.url().replace(BASE, ''), status: r.status() });
  });

  // Fix section attribution as we navigate
  let curSec = 'pre-login';
  page.on('console', m => { if (m.type() === 'error') { consoleErrors[consoleErrors.length - 1] = { sec: curSec, text: m.text().slice(0, 220) }; } });
  page.on('response', r => { if (r.status() >= 400) { badResponses[badResponses.length - 1] = { sec: curSec, url: r.url().replace(BASE, ''), status: r.status() }; } });

  const issues = [];
  const secResults = [];

  try {
    // Login real
    await page.addInitScript(() => {
      try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch {}
    });
    await page.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#login-email', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.fill('#login-email', EMAIL);
    await page.fill('#login-password', PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4500);
    let token = await page.evaluate(() => localStorage.getItem('auth_token'));
    if (!token) {
      // Retry uma vez (login compartilhado / throttling transiente)
      await page.fill('#login-email', EMAIL);
      await page.fill('#login-password', PASS);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4500);
      token = await page.evaluate(() => localStorage.getItem('auth_token'));
    }
    console.log(`LOGIN token=${!!token} url=${page.url()}`);

    // Go to dashboard root and wait for the app to hydrate
    await page.goto(BASE + '/dashboard/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    for (const sec of SECTIONS) {
      curSec = sec.id;
      const before = { errors: consoleErrors.length, bad: badResponses.length };

      // Navigate via hash to trigger section render
      await page.evaluate((id) => { window.location.hash = '#/' + id; }, sec.id);
      await page.waitForTimeout(3000);

      const snapshot = await page.evaluate(() => {
        const body = document.body.textContent || '';
        const app = document.querySelector('.dash-app');
        const view = document.querySelector('.dash-app-view');
        const title = document.querySelector('.dash-app-title')?.textContent?.trim() || '';
        return {
          bodyLen: body.length,
          app: !!app,
          view: !!view,
          title,
          hash: location.hash,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          topbarText: document.querySelector('.dash-app-topbar')?.textContent?.trim().slice(0, 60) || '',
          loadingVisible: /carregando|Carregando/i.test(body.slice(0, 20000)),
          errorVisible: /erro|falhou|tente novamente|Tentar novamente/i.test(body.slice(0, 20000)),
        };
      });

      const newErrors = consoleErrors.slice(before.errors);
      const newBad = badResponses.slice(before.bad);
      const problems = [];
      if (!snapshot.view) problems.push('SEM .dash-app-view');
      if (snapshot.horizontalOverflow) problems.push(`OVERFLOW ${snapshot.scrollWidth}px > ${snapshot.clientWidth}px`);
      if (snapshot.loadingVisible) problems.push('texto de loading visível (pode ter travado)');
      if (newErrors.length) problems.push(`${newErrors.length} console erro(s)`);
      if (newBad.length) problems.push(`${newBad.length} request(s) com erro`);
      if (problems.length) issues.push({ sec: sec.id, problems, newErrors, newBad });

      secResults.push({
        id: sec.id,
        title: snapshot.title,
        app: snapshot.app,
        view: snapshot.view,
        overflow: snapshot.horizontalOverflow,
        errors: newErrors.length,
        bad: newBad.length,
      });
      console.log(`SEC ${sec.id.padEnd(12)} title="${snapshot.title}" view=${snapshot.view} overflow=${snapshot.horizontalOverflow} errs=${newErrors.length} bad=${newBad.length} hash=${snapshot.hash}`);
    }

    // Final dashboard state check
    curSec = 'final';
    await page.goto(BASE + '/dashboard/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

  } catch (err) {
    console.log('FATAL:', err.message.slice(0, 300));
  } finally {
    console.log('\n=== RESUMO DE SEÇÕES ===');
    for (const s of secResults) {
      const status = s.view && !s.overflow && s.errors === 0 && s.bad === 0 ? 'OK' : 'PROBLEMA';
      console.log(`  [${status}] ${s.id.padEnd(12)} title="${s.title}" overflow=${s.overflow} errs=${s.errors} bad=${s.bad}`);
    }
    console.log('\n=== PROBLEMAS DETALHADOS ===');
    for (const iss of issues) {
      console.log(`\n  ${iss.sec}:`);
      for (const p of iss.problems) console.log(`    - ${p}`);
      for (const e of (iss.newErrors || []).slice(0, 6)) console.log(`    [console] ${e.text.slice(0, 160)}`);
      for (const b of (iss.newBad || []).slice(0, 6)) console.log(`    [http ${b.status}] ${b.url}`);
    }
    console.log('\n=== TOTAL CONSOLE ERRORS (todas) ===');
    consoleErrors.slice(0, 20).forEach(e => console.log(`  [${e.sec}] ${e.text.slice(0, 160)}`));
    console.log('\n=== TOTAL BAD REQUESTS (todas) ===');
    badResponses.slice(0, 20).forEach(b => console.log(`  [${b.sec}] ${b.status} ${b.url.slice(0, 120)}`));

    await browser.close();
  }
})();