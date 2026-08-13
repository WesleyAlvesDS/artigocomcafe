import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4356
const server = spawn('node', ['tests/playwright/static-server.mjs', String(PORT), 'dist'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 1200))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await ctx.newPage()
page.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300)) })
page.on('pageerror', e => console.log('[pageerror]', String(e.message).slice(0, 300)))
await page.addInitScript(() => {
  try { localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() })); } catch (e) {}
})
for (const url of ['/receitas/', '/receitas/?categoria=cafe', '/receitas/?busca=gelado', '/blog/', '/blog/?categoria=cafe']) {
  console.log('=== URL:', url)
  await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  const cards = await page.locator('.recipe-card, .article-card').count()
  const active = await page.evaluate(() => document.querySelector('.cat-chip.active')?.textContent?.trim() || '(sem chip ativo)')
  console.log('cards:', cards, '| chip ativo:', active)
}
await browser.close()
server.kill()
console.log('DONE')
