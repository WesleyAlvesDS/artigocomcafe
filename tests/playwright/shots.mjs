// Quick screenshot script for layout audit
import { chromium } from 'playwright'

const pages = [
  { path: '/', name: 'home' },
  { path: '/dashboard/', name: 'dashboard' },
  { path: '/jornada/', name: 'jornada' },
  { path: '/biblioteca/', name: 'biblioteca' },
  { path: '/missoes/', name: 'missoes' },
  { path: '/trilhas/', name: 'trilhas' },
  { path: '/mapa/', name: 'mapa' },
  { path: '/graos/', name: 'graos' },
  { path: '/torrefacao/', name: 'torrefacao' }
]

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-gpu'], timeout: 20000 })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.setDefaultTimeout(8000)

for (const p of pages) {
  try {
    console.log(`VISIT ${p.name}`)
    await page.goto(`http://localhost:4321${p.path}`, { waitUntil: 'commit', timeout: 20000 })
    await page.waitForTimeout(1500)
    await page.evaluate(() => {
      document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('revealed'))
    })
    await page.waitForTimeout(300)
    await page.screenshot({ path: `shots/${p.name}.png`, fullPage: true, animations: 'disabled', timeout: 20000 })
    console.log(`OK ${p.name}`)
  } catch (e) {
    console.log(`FAIL ${p.name}: ${String(e.message).split('\n')[0]}`)
  }
}

await browser.close()
console.log('DONE')
