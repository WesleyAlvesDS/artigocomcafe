// Diagnóstico de layout: navbar caret, dropdown opacidade, selects dark mode,
// largura dos containers das páginas logadas, overflow.
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4331';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

// ── 1. Navbar: caret "v" em relação ao label (Receitas) ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() }));
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
  const dd = page.locator('[data-dropdown="receitas"] .nav-link');
  if (await dd.count()) {
    const geo = await dd.evaluate((el) => {
      const svg = el.querySelector('.nav-caret');
      const svgRect = svg.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const labelRect = el.firstChild.nodeType === 3 ? (() => {
        const r = document.createRange();
        r.selectNodeContents(el.firstChild);
        return r.getBoundingClientRect();
      })() : elRect;
      return {
        label: { top: labelRect.top, bottom: labelRect.bottom, height: labelRect.height },
        caret: { top: svgRect.top, bottom: svgRect.bottom, height: svgRect.height },
        labelCaretGap: labelRect.bottom - svgRect.top,
        linkDisplay: getComputedStyle(el).display,
        linkFlexDir: getComputedStyle(el).flexDirection,
        linkWhiteSpace: getComputedStyle(el).whiteSpace,
        linkHTML: el.outerHTML.slice(0, 220),
      };
    });
    console.log('NAVBAR receitas:', JSON.stringify(geo, null, 1));
  } else {
    console.log('NAVBAR: dropdown receitas não encontrado');
  }

  // Dropdown: opacidade do fundo quando aberto
  await page.hover('[data-dropdown="receitas"]');
  await page.waitForTimeout(500);
  const panel = await page.evaluate(() => {
    const p = document.querySelector('#dropdown-receitas');
    if (!p) return null;
    const cs = getComputedStyle(p);
    // Converte rgba p/ alpha para medir opacidade real do fundo
    const m = cs.backgroundColor.match(/[\d.]+/g) || [];
    const alpha = m.length >= 4 ? Number(m[3]) : 1;
    return { bg: cs.backgroundColor, bgAlpha: alpha, backdrop: cs.backdropFilter, visibility: cs.visibility, opacity: cs.opacity };
  });
  console.log('DROPDOWN painel:', JSON.stringify(panel));
  await ctx.close();
}

// ── 2. Selects em tema escuro (contato) ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() }));
  });
  await page.goto(BASE + '/contato/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const sel = await page.evaluate(() => {
    const s = document.querySelector('select.form-select, .form-select, select');
    if (!s) return null;
    const cs = getComputedStyle(s);
    const opt = s.querySelector('option');
    return {
      selectTag: s.tagName,
      selectBg: cs.backgroundColor,
      selectColor: cs.color,
      selectClass: s.className,
      optionBg: opt ? getComputedStyle(opt).backgroundColor : 'n/a',
      optionColor: opt ? getComputedStyle(opt).color : 'n/a',
      darkTheme: document.documentElement.classList.contains('light') ? 'light' : 'dark',
    };
  });
  console.log('SELECT contato:', JSON.stringify(sel));
  await ctx.close();
}

// ── 3. Containers das páginas logadas ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  for (const p of ['/jornada/', '/graos/', '/torrefacao/', '/missoes/', '/conquistas/', '/trilhas/', '/biblioteca/', '/dashboard/', '/receitas/']) {
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(600);
      const info = await page.evaluate(() => {
        const main = document.querySelector('main, .main-content') || document.body;
        const section = document.querySelector('section[class*="max-w"]');
        const inner = section ? section.querySelector('div[class*="max-w"]') : null;
        const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        return {
          pageW: document.documentElement.clientWidth,
          scrollW: document.documentElement.scrollWidth,
          overflow,
          sectionClass: section ? section.className : null,
          innerClass: inner ? inner.className : null,
          innerWidth: inner ? Math.round(inner.getBoundingClientRect().width) : null,
          h1: document.querySelector('h1')?.textContent?.trim().slice(0, 40) || null,
        };
      });
      console.log(`PAGE ${p}:`, JSON.stringify(info));
    } catch (e) {
      console.log(`PAGE ${p}: ERRO ${String(e.message).split('\n')[0]}`);
    }
    await page.close();
  }
  await ctx.close();
}

await browser.close();
console.log('DONE');
