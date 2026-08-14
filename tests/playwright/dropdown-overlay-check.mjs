// dropdown-overlay-check.mjs — valida o overlay de foco do dropdown da navbar:
// (1) painel opaco (pedido: "mais opaco para melhorar a leitura"),
// (2) overlay desfoca/escurece o fundo da página inteira quando o dropdown abre
//     (pedido: "desfocar não é a navbar, é o fundo todo") e some ao fechar.
// Uso: node tests/playwright/dropdown-overlay-check.mjs [baseUrl]
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4337
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
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

let failures = 0
function check(cond, label) {
  console.log(`${cond ? '✅' : '❌'} ${label}`)
  if (!cond) failures++
}

try {
  await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 20000 })
} catch {
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 20000 })
}
await page.waitForTimeout(600)

// Aceita os cookies primeiro (o overlay de cookies intercepta cliques)
const cookieAccept = page.locator('#cookie-accept')
if (await cookieAccept.count()) {
  await cookieAccept.first().click({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(400)
}

const overlay = page.locator('#dropdown-overlay')
check(await overlay.count() === 1, 'overlay existe no DOM')

// Estado inicial: invisível
let overlayState = await overlay.evaluate(el => {
  const s = getComputedStyle(el)
  return { opacity: s.opacity, visibility: s.visibility, show: el.classList.contains('show') }
})
check(overlayState.opacity === '0' && overlayState.visibility === 'hidden', `overlay invisível no início (opacity:${overlayState.opacity})`)

// Abre o dropdown por CLIQUE (pedido: "deixe clicável") — clique sintético
// para não disparar o mouseenter antes (Playwright move o mouse ao clicar).
await page.evaluate(() => {
  const link = document.querySelector('[data-dropdown] .nav-link')
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
})
await page.waitForTimeout(500)
overlayState = await overlay.evaluate(el => {
  const s = getComputedStyle(el)
  return { opacity: s.opacity, visibility: s.visibility, show: el.classList.contains('show') }
})
check(overlayState.show && overlayState.visibility === 'visible', `overlay visível com dropdown aberto por clique (opacity:${overlayState.opacity})`)
check(parseFloat(overlayState.opacity) > 0.9, `overlay com opacidade alta (${overlayState.opacity})`)

// Painel opaco (97% do fundo do tema + blur)
const panel = page.locator('.dropdown-panel').first()
const panelStyle = await panel.evaluate(el => {
  const s = getComputedStyle(el)
  return { bg: s.backgroundColor, blur: s.backdropFilter || s.webkitBackdropFilter }
})
check(panelStyle.blur.includes('blur'), `dropdown-panel com backdrop blur (${panelStyle.blur})`)
// O CSS moderno serializa como color(srgb r g b / 0.97) — checa a fração alfa
const alphaMatch = panelStyle.bg.match(/\/\s*([\d.]+)\s*\)?$/)
const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : null
check(alpha !== null && alpha >= 0.95, `dropdown-panel quase opaco (bg: ${panelStyle.bg}, alpha:${alpha})`)

// Painel legível sobre o overlay (z-index do painel > overlay)
const zPanel = await panel.evaluate(el => getComputedStyle(el).zIndex)
const zOverlay = await overlay.evaluate(el => getComputedStyle(el).zIndex)
check(parseInt(zPanel) > parseInt(zOverlay), `painel (z:${zPanel}) acima do overlay (z:${zOverlay})`)

// Fecha: clique fora
await page.mouse.click(20, 400)
await page.waitForTimeout(500)
overlayState = await overlay.evaluate(el => {
  const s = getComputedStyle(el)
  return { opacity: s.opacity, visibility: s.visibility, show: el.classList.contains('show') }
})
check(!overlayState.show && overlayState.visibility === 'hidden', `overlay some ao fechar o dropdown (opacity:${overlayState.opacity})`)

// Abre por HOVER (painel não deve sumir rápido — ponte invisível)
await page.hover('[data-dropdown] .nav-link')
await page.waitForTimeout(500)
overlayState = await overlay.evaluate(el => el.classList.contains('show'))
check(overlayState, 'overlay abre também no hover')
await page.mouse.move(20, 500)
await page.waitForTimeout(400)

// SPA: navega para outra página e o overlay não fica preso
await page.click('.header-logo')
await page.waitForTimeout(900)
overlayState = await overlay.evaluate(el => {
  const s = getComputedStyle(el)
  return { show: el.classList.contains('show'), visibility: s.visibility }
})
check(!overlayState.show, `overlay limpo após navegação SPA (visibility:${overlayState.visibility})`)

await browser.close()
if (server) server.kill()
console.log(`\n${failures === 0 ? '✅ OVERLAY DO DROPDOWN OK' : `❌ ${failures} problema(s)`}`)
process.exit(failures === 0 ? 0 : 1)
