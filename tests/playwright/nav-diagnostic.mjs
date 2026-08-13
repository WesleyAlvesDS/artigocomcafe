// Diagnóstico de navegação SPA: revela bugs de view transitions.
// Uso: node tests/playwright/nav-diagnostic.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4345;
const BASE = `http://localhost:${PORT}`;
let server;

function startServer() {
  return new Promise((resolve) => {
    server = spawn('node', ['tests/playwright/static-server.mjs', String(PORT), 'dist'], { stdio: 'ignore' });
    setTimeout(resolve, 800);
  });
}

(async () => {
  await startServer();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Aceita cookies
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
  });

  const report = (name, ok, detail = '') => console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
  const fails = [];
  const pass = (name, ok, detail = '') => { report(name, ok, detail); if (!ok) fails.push(name); };

  try {
    // ── 1. Carregar home ──
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Verifica hero bg
    const heroBgTransform = await page.evaluate(() => {
      const bg = document.querySelector('.hero-bg');
      return bg ? getComputedStyle(bg).transform : null;
    });
    pass('Home: hero-bg presente', !!heroBgTransform, heroBgTransform);

    // ── 2. Navegação SPA: home → /blog (clique no link nav) ──
    await page.locator('a[href="/blog"]').first().click();
    await page.waitForTimeout(2500); // espera transição + reveal
    const blogUrl = page.url();
    pass('SPA navega para /blog', blogUrl.includes('/blog'), blogUrl);

    // Verifica se os elementos NO VIEWPORT são visíveis (data-scroll-reveal opacity)
    // — elementos abaixo da dobra ficam ocultos até rolar (comportamento de design).
    const invisible = await page.evaluate(() => {
      const vh = window.innerHeight;
      const els = document.querySelectorAll('[data-scroll-reveal]');
      let totalInView = 0;
      let invisibleInView = 0;
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          totalInView++;
          const cs = getComputedStyle(el);
          if (cs.opacity === '0') invisibleInView++;
        }
      });
      return { total: els.length, inView: totalInView, invisibleInView };
    });
    pass('Blog: nenhum elemento NO VIEWPORT invisível (opacity 0)', invisible.invisibleInView === 0, JSON.stringify(invisible));

    // Verifica se há header duplicado
    const headerCount = await page.evaluate(() => document.querySelectorAll('header.header').length);
    const mobileMenuCount = await page.evaluate(() => document.querySelectorAll('.mobile-menu').length);
    pass('Blog: header único', headerCount === 1, `headers=${headerCount}`);
    pass('Blog: mobile-menu único', mobileMenuCount === 1, `mobileMenu=${mobileMenuCount}`);

    // Navbar duplicada abaixo do footer? Checa se há header/nav DEPOIS do footer
    // (o route-announcer do Astro após o footer é esperado e não é navbar).
    const dupCheck = await page.evaluate(() => {
      const footer = document.querySelector('footer.footer');
      if (!footer) return { footerPresent: false };
      const all = Array.from(document.body.children);
      const footerIndex = all.indexOf(footer);
      const after = all.slice(footerIndex + 1);
      const dupNav = after.filter(el =>
        el.tagName === 'HEADER' ||
        el.classList.contains('mobile-menu') ||
        (el.tagName === 'NAV' && el.closest('.header'))
      );
      return {
        footerPresent: true,
        afterFooter: after.map(el => el.tagName + '.' + (el.className || '').toString().slice(0, 40)),
        duplicatedNavAfterFooter: dupNav.length,
      };
    });
    pass('Blog: nenhuma navbar duplicada abaixo do footer', dupCheck.footerPresent && dupCheck.duplicatedNavAfterFooter === 0, JSON.stringify(dupCheck));

    // ── 3. Navegação SPA: /blog → home (voltar) ──
    await page.goBack();
    await page.waitForTimeout(2500);
    pass('SPA voltou para home', page.url().endsWith('/'), page.url());

    const heroVisible = await page.evaluate(() => {
      const hero = document.querySelector('[data-hero]');
      if (!hero) return false;
      const cs = getComputedStyle(hero);
      return cs.opacity !== '0' && cs.visibility !== 'hidden';
    });
    pass('Home: hero visível após voltar', heroVisible);

    // ── 4. Rolar o hero e verificar o transform do bg (bug dos quadrados) ──
    const transformAtScroll = [];
    for (const offset of [0, 100, 300, 600]) {
      await page.evaluate((o) => window.scrollTo(0, o), offset);
      await page.waitForTimeout(300);
      const t = await page.evaluate(() => {
        const bg = document.querySelector('.hero-bg');
        return bg ? bg.style.transform : null;
      });
      transformAtScroll.push({ offset, transform: t });
    }
    console.log('  [hero] transforms:', JSON.stringify(transformAtScroll));
    // Detecta zoom-out (escala < 1) vs zoom-in (escala >= 1)
    const scale1 = transformAtScroll.find(t => t.offset >= 100);
    const scaleMatch = scale1?.transform?.match(/scale\(([\d.]+)/);
    const s = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    pass('Hero: bg NÃO diminui (scale >= 1 = zoom-in, sem quadrados)', s >= 1, `scale=${s} em offset=${scale1?.offset}`);

    // ── 5. Dropdown de Receitas no hover ──
    const dd = page.locator('[data-dropdown="receitas"]');
    if (await dd.count()) {
      await dd.hover();
      await page.waitForTimeout(600);
      const ddVisible = await page.evaluate(() => {
        const el = document.querySelector('.nav-dropdown.open .dropdown-panel');
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.visibility !== 'hidden' && cs.opacity !== '0' && cs.pointerEvents !== 'none';
      });
      pass('Navbar: dropdown Receitas abre no hover', ddVisible);
      const panelWidth = await page.evaluate(() => {
        const el = document.querySelector('.nav-dropdown.open .dropdown-panel');
        return el ? Math.round(el.getBoundingClientRect().width) : 0;
      });
      const viewportW = await page.evaluate(() => window.innerWidth);
      const panelRect = await page.evaluate(() => {
        const el = document.querySelector('.nav-dropdown.open .dropdown-panel');
        return el ? el.getBoundingClientRect() : null;
      });
      if (panelRect) {
        const overflows = panelRect.left < 0 || panelRect.right > viewportW;
        pass('Navbar: dropdown não estoura a tela', !overflows, `left=${Math.round(panelRect.left)} right=${Math.round(panelRect.right)} w=${viewportW}`);
      }
      // Move mouse para fora
      await page.mouse.move(10, 400);
    } else {
      pass('Navbar: dropdown Receitas presente', false, 'seletor não encontrado');
    }

  } catch (err) {
    console.error('ERRO:', err.message);
    fails.push(err.message);
  } finally {
    await browser.close();
    server?.kill();
  }

  console.log(`\n=== DIAGNÓSTICO NAVEGAÇÃO: ${fails.length === 0 ? 'TUDO OK' : fails.length + ' falhas'} ===`);
  process.exitCode = fails.length ? 1 : 0;
})();