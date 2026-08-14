// mobile-grid-detail.mjs — inspeção detalhada dos cards em 2 colunas no mobile:
// verifica se o conteúdo interno dos cards estoura, se títulos ficam cortados
// de forma ilegível e se a barra de categorias vaza scroll horizontal na página.
// Uso: node tests/playwright/mobile-grid-detail.mjs [baseUrl]
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4336
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
let failures = 0

async function inspect(width, label, path) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } })
  const page = await ctx.newPage()
  try {
    await page.goto(base + path, { waitUntil: 'networkidle', timeout: 20000 })
  } catch {
    await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 20000 })
  }
  await page.waitForTimeout(500)

  const res = await page.evaluate(() => {
    const doc = document.documentElement
    const pageOverflow = doc.scrollWidth > doc.clientWidth + 1
    const out = { pageOverflow, cards: [], categoryBarScrollable: false }

    const grid = document.querySelector('.articles-grid')
    if (grid) {
      const cards = grid.querySelectorAll(':scope > .article-card')
      cards.forEach((card, i) => {
        const cr = card.getBoundingClientRect()
        // Texto interno que estoura o card
        const title = card.querySelector('.article-title')
        const excerpt = card.querySelector('.article-excerpt')
        const readMore = card.querySelector('.article-read-more')
        const meta = card.querySelector('.article-meta')
        const overflowEls = []
        card.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width > 0 && (r.right > cr.right + 1 || r.left < cr.left - 1)) {
            overflowEls.push(el.tagName + '.' + (el.className || '').split(' ')[0])
          }
        })
        out.cards.push({
          i,
          w: Math.round(cr.width),
          h: Math.round(cr.height),
          titleOverflow: title ? title.scrollWidth > title.clientWidth + 4 : false,
          excerptLines: excerpt ? getComputedStyle(excerpt).webkitLineClamp : null,
          internalOverflow: [...new Set(overflowEls)].slice(0, 4),
        })
      })
    }

    // Barra de categorias: scroll interno é esperado, vazamento na página não
    const catBar = document.querySelector('.category-bar-inner') || document.querySelector('.categories-scroll')
    if (catBar) {
      const bar = catBar.closest('.category-bar') || catBar.parentElement
      const barRect = bar ? bar.getBoundingClientRect() : null
      out.categoryBarScrollable = catBar.scrollWidth > catBar.clientWidth
      if (barRect) {
        out.categoryBarInViewport = barRect.left >= -1 && barRect.right <= doc.clientWidth + 1
      }
    }
    return out
  })

  const cardIssues = res.cards.filter(c => c.internalOverflow.length > 0 || (c.w < 110))
  const catOk = !res.categoryBarScrollable || res.categoryBarInViewport !== false
  const ok = !res.pageOverflow && cardIssues.length === 0 && catOk
  if (!ok) failures++

  console.log(`${ok ? '✅' : '❌'} ${label} ${path} — pageOverflow:${res.pageOverflow} cards:${res.cards.length}`)
  res.cards.forEach(c => {
    if (c.internalOverflow.length || c.w < 110) {
      console.log(`   card#${c.i} w:${c.w}px titleClip:${c.titleOverflow} overflow:[${c.internalOverflow.join(', ')}]`)
    }
  })
  if (res.categoryBarScrollable) {
    console.log(`   categoryBar scroll interno ok (inViewport:${res.categoryBarInViewport})`)
  }
  await ctx.close()
}

for (const vp of [
  { w: 320, label: '320' },
  { w: 360, label: '360' },
  { w: 375, label: '375' },
  { w: 400, label: '400' },
]) {
  await inspect(vp.w, vp.label, '/blog/')
}

await browser.close()
if (server) server.kill()
console.log(`\n${failures === 0 ? '✅ SEM PROBLEMAS NOS CARDS' : `❌ ${failures} problema(s)`}`)
process.exit(failures === 0 ? 0 : 1)
