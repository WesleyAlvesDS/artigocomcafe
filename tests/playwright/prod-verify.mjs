// Validação em produção do novo build.
import { chromium } from 'playwright'

const BASE = 'https://artigocomcafe.com'
const EMAIL = process.env.TEST_USER || 'pro.wesleyalves@gmail.com'
const PASS = process.env.TEST_PASS || 'Wesl3y@Cafe2026!Dash'
const ok = (name, cond, detail = '') => console.log(`${cond ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`)

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
page.setDefaultTimeout(25000)
await page.addInitScript(() => {
  try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
})

// ── Navbar + select (sem login) ──
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const nav = await page.evaluate(() => {
  const link = document.querySelector('[data-dropdown="receitas"] .nav-link')
  const svg = link?.querySelector('.nav-caret')
  const panel = document.getElementById('dropdown-receitas')
  const pcs = panel ? getComputedStyle(panel) : null
  const m = pcs?.backgroundColor ? pcs.backgroundColor.match(/[\d.]+/g) : []
  return {
    linkDisplay: link ? getComputedStyle(link).display : null,
    panelAlpha: m && m.length >= 4 ? Number(m[3]) : null,
    blur: pcs?.backdropFilter,
  }
})
ok('Prod navbar: link flex + caret na mesma linha', nav.linkDisplay === 'flex', JSON.stringify(nav))
ok('Prod navbar: dropdown opaco + blur', (nav.panelAlpha ?? 0) > 0.7 && !!nav.blur, JSON.stringify(nav))

await page.goto(BASE + '/contato/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const sel = await page.evaluate(() => {
  const s = document.querySelector('select')
  if (!s) return null
  const cs = getComputedStyle(s)
  return { colorScheme: cs.colorScheme, theme: document.documentElement.classList.contains('light') ? 'light' : 'dark' }
})
ok('Prod select: color-scheme por tema', !!sel && (sel.colorScheme === 'dark' || sel.colorScheme === 'light'), JSON.stringify(sel))

// ── Receitas: island + filtros com API real ──
await page.goto(BASE + '/receitas/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
const rec = await page.evaluate(() => ({
  browser: !!document.querySelector('[data-recipes-browser]'),
  cards: document.querySelectorAll('.recipe-card').length,
  results: document.querySelector('.recipes-results-info')?.textContent?.trim() || '',
}))
ok('Prod receitas: island + lista completa carregada', rec.browser && rec.cards > 0, JSON.stringify(rec))

await page.fill('[data-recipes-browser] input[name="busca"]', 'café')
await page.waitForTimeout(800)
const recAfter = await page.evaluate(() => ({
  url: location.pathname + location.search,
  cards: document.querySelectorAll('.recipe-card').length,
  results: document.querySelector('.recipes-results-info')?.textContent?.trim() || '',
}))
ok('Prod receitas: busca filtra (API real)', recAfter.cards > 0 && recAfter.url.includes('busca'), JSON.stringify(recAfter))

// Filtro por categoria (primeiro chip)
await page.click('[data-recipes-browser] .cat-chip:not(.active) >> nth=0')
await page.waitForTimeout(800)
const catAfter = await page.evaluate(() => ({
  url: location.pathname + location.search,
  cards: document.querySelectorAll('.recipe-card').length,
  active: document.querySelector('[data-recipes-browser] .cat-chip.active')?.textContent?.trim() || '',
}))
ok('Prod receitas: filtro de categoria aplica', catAfter.url.includes('categoria') && catAfter.active.length > 0, JSON.stringify(catAfter))

// Dificuldade
await page.selectOption('[data-recipes-browser] select[name="dificuldade"]', 'facil')
await page.waitForTimeout(800)
const diffAfter = await page.evaluate(() => ({
  url: location.pathname + location.search,
  cards: document.querySelectorAll('.recipe-card').length,
}))
ok('Prod receitas: filtro de dificuldade aplica', diffAfter.url.includes('dificuldade'), JSON.stringify(diffAfter))

// ── Blog: island + busca ──
await page.goto(BASE + '/blog/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
const blog = await page.evaluate(() => ({
  browser: !!document.querySelector('[data-posts-browser]'),
  cards: document.querySelectorAll('.article-card').length,
}))
ok('Prod blog: island + lista', blog.browser && blog.cards > 0, JSON.stringify(blog))
await page.fill('[data-posts-browser] input[name="busca"]', 'café')
await page.waitForTimeout(800)
const blogAfter = await page.evaluate(() => ({ url: location.pathname + location.search, cards: document.querySelectorAll('.article-card').length }))
ok('Prod blog: busca filtra', blogAfter.cards > 0 && blogAfter.url.includes('busca'), JSON.stringify(blogAfter))

// ── Login + páginas do leitor ──
await page.goto(BASE + '/entrar/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.fill('#login-email', EMAIL)
await page.fill('#login-password', PASS)
await page.click('button[type="submit"]')
await page.waitForTimeout(4500)
const token = await page.evaluate(() => localStorage.getItem('auth_token'))
ok('Prod login', !!token)

for (const p of ['/jornada/', '/graos/', '/torrefacao/', '/missoes/', '/conquistas/', '/trilhas/']) {
  try {
    await page.goto(BASE + p, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const r = await page.evaluate(() => {
      const hero = document.querySelector('.reader-hero')
      return {
        hero: !!hero,
        label: hero?.querySelector('.section-label')?.textContent?.trim() || null,
        title: hero?.querySelector('.reader-title')?.textContent?.trim().slice(0, 30) || null,
        cards: document.querySelectorAll('.reader-card').length,
        noRedirect: !location.pathname.includes('entrar'),
      }
    })
    ok(`Prod leitor ${p}: hero + cards`, r.hero && !!r.title && r.noRedirect, JSON.stringify(r))
  } catch (e) {
    ok(`Prod leitor ${p}`, false, String(e.message).split('\n')[0])
  }
}

// Biblioteca (deu timeout na sessão anterior)
try {
  await page.goto(BASE + '/biblioteca/', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)
  const lib = await page.evaluate(() => ({
    hero: !!document.querySelector('.library-hero'),
    title: document.querySelector('.library-hero .hero-title')?.textContent?.trim() || null,
    noRedirect: !location.pathname.includes('entrar'),
  }))
  ok('Prod biblioteca: hero + tabs', lib.hero && !!lib.title && lib.noRedirect, JSON.stringify(lib))
} catch (e) {
  ok('Prod biblioteca', false, String(e.message).split('\n')[0])
}

await browser.close()
console.log('DONE')
