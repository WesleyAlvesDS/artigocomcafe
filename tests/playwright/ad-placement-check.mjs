// ad-placement-check.mjs — regressão dos anúncios (docs/MAPA-DE-ANUNCIOS.md §9):
// (1) no máx. 1 <AdSterraNative> por página (containerId duplicado = 2º nunca preenche);
// (2) banners de tamanho fixo só renderizam onde cabem (bw-*):
//     bw-728/bw-468/bw-160 ocultos no mobile, bw-320 visível só no mobile.
// Uso: node tests/playwright/ad-placement-check.mjs [baseUrl]
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'

const PORT = 4357
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

const blog = readdirSync('dist/blog', { withFileTypes: true }).find(e => e.isDirectory())?.name
const rec = readdirSync('dist/receitas', { withFileTypes: true }).find(e => e.isDirectory())?.name
const livro = readdirSync('dist/livro', { withFileTypes: true }).find(e => e.isDirectory())?.name

const pages = [
  ['home', '/', null],
  ['artigo', blog ? `/blog/${blog}` : null],
  ['receita', rec ? `/receitas/${rec}` : null],
  ['livro', livro ? `/livro/${livro}` : null],
  ['blog-list', '/blog/', null],
  ['receitas-list', '/receitas/', null],
  ['livros-list', '/livros/', null],
  ['newsletter', '/newsletter/', null],
  ['sobre', '/sobre/', null],
  ['contato', '/contato/', null],
].filter(p => p[1])

const browser = await chromium.launch()
let failures = 0

function check(cond, label) {
  console.log(`${cond ? '✅' : '❌'} ${label}`)
  if (!cond) failures++
}

for (const [name, path] of pages) {
  for (const [w, label] of [[1440, 'desktop'], [375, 'mobile']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } })
    const page = await ctx.newPage()
    try {
      await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 20000 })
    } catch {
      await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 20000 })
    }
    await page.waitForTimeout(500)
    const acc = page.locator('#cookie-accept')
    if (await acc.count()) { await acc.first().click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(200) }

    const r = await page.evaluate(() => {
      // 1. nativo: ids de container duplicados?
      const ids = {}
      document.querySelectorAll('[id^="container-"]').forEach(el => { ids[el.id] = (ids[el.id] || 0) + 1 })
      const dup = Object.entries(ids).filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`)

      // 2. banners: classe bw-* + display atual
      const banners = Array.from(document.querySelectorAll('.adsterra-banner')).map(slot => ({
        bw: (slot.className.match(/bw-(\d+)/) || [])[1],
        display: getComputedStyle(slot).display,
      }))
      return { dup, banners }
    })

    const mobile = w <= 767
    check(r.dup.length === 0, `${name} ${label} — sem containerId duplicado${r.dup.length ? ' (' + r.dup.join(', ') + ')' : ''}`)

    // Regras: no mobile só o bw-320 (unidade mobile) fica visível; 160/468/728
    // somem. No desktop o inverso: só o 320 some.
    const bad = r.banners.filter(b => {
      if (!b.bw) return false
      const bw = parseInt(b.bw)
      if (mobile) return bw === 320 ? b.display === 'none' : b.display !== 'none'
      return bw === 320 ? b.display !== 'none' : false
    })
    check(bad.length === 0, `${name} ${label} — banners no tamanho certo (${r.banners.map(b => `bw${b.bw || '?'}:${b.display === 'none' ? 'off' : 'on'}`).join(' ') || 'sem banners'})`)
    await ctx.close()
  }
}

await browser.close()
if (server) server.kill()
console.log(`\n${failures === 0 ? '✅ PLACEMENT DOS ANÚNCIOS OK' : `❌ ${failures} problema(s)`}`)
process.exit(failures === 0 ? 0 : 1)
