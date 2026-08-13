// Verificação das correções contra o build local (dist).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4351
const server = spawn('node', ['tests/playwright/static-server.mjs', String(PORT), 'dist'], { stdio: 'ignore' })

const ok = (name, cond, detail = '') => console.log(`${cond ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`)

await new Promise(r => setTimeout(r, 1200))

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const BASE = `http://localhost:${PORT}`

// ── 1. Navbar: caret alinhado + dropdown opaco ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const nav = await page.evaluate(() => {
    const link = document.querySelector('[data-dropdown="receitas"] .nav-link')
    if (!link) return { err: 'no link' }
    const svg = link.querySelector('.nav-caret')
    const label = link.firstChild
    const lr = document.createRange(); lr.selectNodeContents(label)
    const lrRect = lr.getBoundingClientRect()
    const svgRect = svg.getBoundingClientRect()
    const cs = getComputedStyle(link)
    const panel = document.getElementById('dropdown-receitas')
    const pcs = panel ? getComputedStyle(panel) : null
    const m = pcs?.backgroundColor ? pcs.backgroundColor.match(/[\d.]+/g) : []
    return {
      linkDisplay: cs.display,
      caretDisplay: getComputedStyle(svg).display,
      caretBottom: Math.round(svgRect.bottom * 10) / 10,
      labelBottom: Math.round(lrRect.bottom * 10) / 10,
      caretAligned: Math.abs(svgRect.bottom - lrRect.bottom) < 8,
      panelBgAlpha: m && m.length >= 4 ? Number(m[3]) : null,
      panelBackdrop: pcs?.backdropFilter,
    }
  })
  ok('Navbar: caret alinhado ao nome (mesma linha)', nav.caretAligned, JSON.stringify(nav))
  ok('Navbar: dropdown opaco (alpha > 0.7)', (nav.panelBgAlpha ?? 0) > 0.7, `alpha=${nav.panelBgAlpha}`)
  ok('Navbar: dropdown com backdrop blur', !!nav.panelBackdrop && nav.panelBackdrop !== 'none', nav.panelBackdrop)
  await ctx.close()
}

// ── 2. Select do contato: color-scheme presente ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/contato/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const sel = await page.evaluate(() => {
    const s = document.querySelector('select')
    if (!s) return { err: 'no select' }
    const cs = getComputedStyle(s)
    const opt = s.querySelector('option')
    return {
      selectColorScheme: cs.colorScheme,
      optionBg: opt ? getComputedStyle(opt).backgroundColor : null,
      optionColor: opt ? getComputedStyle(opt).color : null,
      theme: document.documentElement.classList.contains('light') ? 'light' : 'dark',
    }
  })
  ok('Select: color-scheme definido', sel.selectColorScheme === 'dark' || sel.selectColorScheme === 'light', JSON.stringify(sel))
  ok('Select: option com fundo/cor explícitos', !!sel.optionBg && !!sel.optionColor, JSON.stringify(sel))
  await ctx.close()
}

// ── 3. Receitas: navegador client-side presente e filtros funcionam ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/receitas/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const browserState = await page.evaluate(() => {
    const cardsBefore = document.querySelectorAll('.recipes-main .recipe-card, [data-recipes-browser] + * .recipe-card').length
    const allCards = document.querySelectorAll('.recipe-card').length
    const searchInput = document.querySelector('[data-recipes-browser] input[name="busca"]')
    const catChips = document.querySelectorAll('[data-recipes-browser] .cat-chip').length
    const selects = document.querySelectorAll('[data-recipes-browser] select').length
    return { allCards, searchInput: !!searchInput, catChips, selects }
  })
  ok('Receitas: island renderizou (busca + chips + selects)', browserState.searchInput && browserState.catChips >= 3 && browserState.selects === 2, JSON.stringify(browserState))
  ok('Receitas: cards renderizados', browserState.allCards > 0, `${browserState.allCards} cards`)

  // Testa busca client-side
  const firstTitle = await page.locator('.recipe-card .recipe-title').first().textContent().catch(() => '')
  await page.fill('[data-recipes-browser] input[name="busca"]', 'café')
  await page.waitForTimeout(500)
  const afterSearch = await page.evaluate(() => ({
    url: location.pathname + location.search,
    count: document.querySelectorAll('.recipe-card').length,
    first: document.querySelector('.recipe-card .recipe-title')?.textContent?.trim() || '',
  }))
  ok('Receitas: busca filtra sem recarregar', afterSearch.count < browserState.allCards || afterSearch.url.includes('busca'), JSON.stringify(afterSearch))
  await ctx.close()
}

// ── 4. Blog: navegador client-side com filtros ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/blog/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const blogState = await page.evaluate(() => ({
    searchInput: !!document.querySelector('[data-posts-browser] input[name="busca"]'),
    chips: document.querySelectorAll('[data-posts-browser] .cat-chip').length,
    cards: document.querySelectorAll('.article-card').length,
  }))
  ok('Blog: island renderizou (busca + chips + cards)', blogState.searchInput && blogState.chips >= 3 && blogState.cards > 0, JSON.stringify(blogState))
  const cardsBefore = blogState.cards
  await page.fill('[data-posts-browser] input[name="busca"]', 'café')
  await page.waitForTimeout(500)
  const after = await page.evaluate(() => ({ url: location.pathname + location.search, cards: document.querySelectorAll('.article-card').length }))
  ok('Blog: busca filtra sem recarregar', after.cards < cardsBefore || after.url.includes('busca'), JSON.stringify(after))
  await ctx.close()
}

// ── 5. ReaderHeader nas páginas do leitor (HTML SSG) ──
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  for (const p of ['/jornada/', '/graos/', '/torrefacao/', '/missoes/', '/conquistas/', '/trilhas/']) {
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' })
    const has = await page.evaluate(() => {
      const hero = document.querySelector('.reader-hero')
      return {
        hero: !!hero,
        label: hero?.querySelector('.section-label')?.textContent?.trim() || null,
        title: hero?.querySelector('.reader-title')?.textContent?.trim().slice(0, 40) || null,
      }
    })
    ok(`Leitor ${p}: ReaderHeader presente`, has.hero && !!has.title, JSON.stringify(has))
  }
  await ctx.close()
}

await browser.close()
server.kill()
console.log('DONE')
