// hero-responsive.mjs — valida o hero imersivo + newsletter em várias larguras
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4333
const BASE = `http://localhost:${PORT}`

const server = spawn(process.execPath, ['tests/playwright/static-server.mjs', String(PORT), 'dist'], {
  cwd: process.cwd(),
  stdio: 'ignore'
})

await new Promise(r => setTimeout(r, 1200))

const browser = await chromium.launch()
const widths = [
  { w: 375, h: 812, label: 'Mobile 375' },
  { w: 768, h: 1024, label: 'Tablet 768' },
  { w: 1024, h: 768, label: 'Tablet 1024' },
  { w: 1366, h: 768, label: 'Notebook 1366' },
  { w: 1920, h: 1080, label: 'Desktop 1920' }
]

let failures = 0
for (const vp of widths) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)

  const check = await page.evaluate(() => {
    const hero = document.querySelector('[data-hero]')
    const bg = hero ? hero.querySelector('.hero-bg') : null
    const img = hero ? hero.querySelector('.hero-bg-img') : null
    const nl = document.querySelector('.hero-newsletter')
    const input = nl ? nl.querySelector('input[type=email]') : null
    const btn = nl ? nl.querySelector('button[type=submit]') : null

    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    const heroBgVisible = bg && bg.getBoundingClientRect().height > 0
    const imgVisible = img && img.getBoundingClientRect().width > 100
    const nlVisible = nl && input && btn &&
      input.getBoundingClientRect().width > 50 &&
      btn.getBoundingClientRect().width > 50

    return { overflow, heroBgVisible, imgVisible, nlVisible, inputW: input?.getBoundingClientRect().width, btnW: btn?.getBoundingClientRect().width }
  })

  const ok = !check.overflow && check.heroBgVisible && check.imgVisible && check.nlVisible
  if (!ok) failures++
  console.log(`${ok ? '✅' : '❌'} ${vp.label} — overflow:${check.overflow} heroBg:${check.heroBgVisible} img:${check.imgVisible} newsletter(input ${check.inputW?.toFixed(0)}px / btn ${check.btnW?.toFixed(0)}px)`)

  await ctx.close()
}

// Verifica que o blur ao rolar NÃO é aplicado no hero inteiro (só no bg)
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, 300))
  await page.waitForTimeout(400)
  const filterState = await page.evaluate(() => {
    const hero = document.querySelector('[data-hero]')
    const bg = hero ? hero.querySelector('.hero-bg') : null
    return {
      heroFilter: hero ? getComputedStyle(hero).filter : null,
      heroOpacity: hero ? getComputedStyle(hero).opacity : null,
      bgFilter: bg ? bg.style.filter : null,
      bgOpacity: bg ? bg.style.opacity : null
    }
  })
  const heroUntouched = (!filterState.heroFilter || filterState.heroFilter === 'none') && parseFloat(filterState.heroOpacity) >= 0.9
  const bgAffected = filterState.bgFilter !== '' && parseFloat(filterState.bgOpacity) < 1
  console.log(`${heroUntouched && bgAffected ? '✅' : '❌'} Scroll-blur aplicado só no .hero-bg (hero filter:'${filterState.heroFilter}' opacity:${filterState.heroOpacity} | bg filter:'${filterState.bgFilter}' opacity:${filterState.bgOpacity})`)
  if (!heroUntouched || !bgAffected) failures++
  await ctx.close()
}

await browser.close()
server.kill()
console.log(`\n${failures === 0 ? '✅ TODOS OS TESTES PASSARAM' : `❌ ${failures} FALHA(S)`}`)
process.exit(failures === 0 ? 0 : 1)