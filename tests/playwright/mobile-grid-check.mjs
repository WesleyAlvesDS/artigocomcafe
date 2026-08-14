// mobile-grid-check.mjs — valida a grade de artigos em 2 colunas no celular
// (pedido do usuário) e procura overflow horizontal em /blog, / e /livros.
// Uso: node tests/playwright/mobile-grid-check.mjs [baseUrl]
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4335
const DEFAULT_BASE = `http://localhost:${PORT}`
const base = process.argv[2] || DEFAULT_BASE

let server = null
if (base === DEFAULT_BASE) {
  server = spawn(process.execPath, ['tests/playwright/static-server.mjs', String(PORT), 'dist'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  })
  await new Promise(r => setTimeout(r, 1200))
}

const browser = await chromium.launch()
const widths = [
  { w: 320, h: 700, label: '320 (iPhone SE)' },
  { w: 375, h: 812, label: '375 (iPhone)' },
  { w: 414, h: 896, label: '414 (Android)' },
  { w: 640, h: 800, label: '640 (breakpoint)' },
  { w: 768, h: 1024, label: '768 (tablet)' },
]

let failures = 0
const paths = [
  { path: '/blog/', grid: '.articles-grid' },
  { path: '/', grid: '.articles-grid' },
  { path: '/livros/', grid: '.books-grid' },
  { path: '/livro/OL17072046W/', grid: '.books-grid' },
]

for (const vp of widths) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } })
  const page = await ctx.newPage()

  for (const { path, grid } of paths) {
    try {
      await page.goto(base + path, { waitUntil: 'networkidle', timeout: 20000 })
    } catch {
      // SPA/fallback: tenta domcontentloaded
      try {
        await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 20000 })
      } catch {
        console.log(`❌ ${vp.label} ${path} — não carregou`)
        failures++
        continue
      }
    }
    await page.waitForTimeout(400)

    const check = await page.evaluate((sel) => {
      const doc = document.documentElement
      const overflow = doc.scrollWidth > doc.clientWidth + 1
      const grid = document.querySelector(sel)
      let cols = null
      let cardW = null
      let firstCard = null
      if (grid) {
        const style = getComputedStyle(grid)
        cols = style.gridTemplateColumns.split(' ').length
        const cards = grid.querySelectorAll(':scope > .article-card, :scope > .book-card')
        firstCard = cards[0] ? cards[0].getBoundingClientRect() : null
        if (firstCard) cardW = Math.round(firstCard.width)
      }
      // Coleto elementos que estouram a largura da viewport
      const offenders = []
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1)) {
          const cls = (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 2).join('.') : el.tagName
          offenders.push(`${el.tagName}.${cls} L${Math.round(r.left)} R${Math.round(r.right)}`)
        }
      })
      return { overflow, cols, cardW, offenders: offenders.slice(0, 6) }
    }, grid)

    const mobile = vp.w <= 640
    const expectedCols = mobile ? 2 : (path.includes('livro') && vp.w <= 640 ? null : null)
    const colOk = !mobile || (check.cols === 2 || check.cols === null)
    const ok = !check.overflow && colOk
    if (!ok) failures++

    const status = ok ? '✅' : '❌'
    console.log(`${status} ${vp.label} ${path} — overflow:${check.overflow} cols:${check.cols} cardW:${check.cardW}px${check.offenders.length ? ' OFENSORES: ' + check.offenders.join(' | ') : ''}`)
  }

  // Screenshot do /blog para revisão visual
  if (vp.w === 375 || vp.w === 414) {
    const page = await ctx.newPage()
    await page.goto(base + '/blog/', { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(500)
    await page.screenshot({ path: `shots/mobile-blog-${vp.w}.png`, fullPage: false })
    await page.close()
  }

  await ctx.close()
}

await browser.close()
if (server) server.kill()
console.log(`\n${failures === 0 ? '✅ SEM OVERFLOW — layout 2 colunas ok' : `❌ ${failures} problema(s) encontrado(s)`}`)
process.exit(failures === 0 ? 0 : 1)
