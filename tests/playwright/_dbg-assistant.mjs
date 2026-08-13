// Diagnóstico: por que "Assistente do Criador" não renderiza no dash-audit?
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4342
const server = spawn('node', ['tests/playwright/static-server.mjs', String(PORT), 'dist'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 1500))

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const BASE = `http://localhost:${PORT}`

const MOCK_USER = { id: 1, name: 'Admin Café', username: 'admin', email: 'admin@artigocomcafe.com', bio: 'Administrador', avatar: null, theme: 'cafe', reading_time_total: 360, articles_read_count: 42, daily_streak: 7, total_grains: 850, completed_trails_count: 3, collections_count: 2, achievements_count: 8, categories_explored_count: 5 }
const MOCK_DASHBOARD = { evolution: { total_grains: 850, articles_read: 42, reading_time_hours: 6, trails_completed: 3, achievements_unlocked: 8, daily_streak: 7, collections_count: 2, categories_explored: 5 } }
const MOCK_POSTS = { data: { data: [{ id: 1, title: 'Meu primeiro artigo sobre café', slug: 'meu-primeiro-artigo-sobre-cafe', excerpt: 'Resumo', status: 'draft', featured_image: null, reading_time: 3, category: { name: 'Guias', slug: 'guias' }, tags: [{ name: 'café', slug: 'cafe' }], date: '2026-08-10', created_at: '2026-08-10T10:00:00Z', updated_at: '2026-08-10T10:00:00Z' }], meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 } } }
const MOCK_WEATHER = { data: { city: 'São Paulo', region: 'SP', country: 'Brasil', temperature_c: 24, feels_like_c: 26, description: 'Ensolarado', icon_url: 'x', humidity: 65, wind_speed_kmph: 12, wind_direction: 'NE', uv_index: 5, observation_time: '09:00', source: 'wttr.in', cached_at: '2026-08-06T09:00:00Z' } }
const MOCK_EXCHANGE = { data: { base: 'BRL', updated_at: 'x', rates: [{ base: 'BRL', code: 'USD', rate: 4.5, inverse: 0.2222 }], source: 'open.er-api.com', cached_at: 'x' } }
const MOCK_HEADLINES = { data: { guardian: { items: [{ title: 'Notícia sobre café da manhã', url: 'x', section: 'News', published_at: 'x', thumbnail: null, excerpt: 'R', author: 'A', source: 'Guardian' }], total: 1, source: 'Guardian', cached_at: 'x' }, hacker_news: { items: [], total: 0, source: 'Hacker News', cached_at: 'x' } } }

function setupMocks(page) {
  const json = body => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  page.route('**/api-proxy.php/auth/me', r => r.fulfill(json({ user: MOCK_USER })))
  page.route('**/api-proxy.php/user/posts**', r => r.fulfill(json(MOCK_POSTS)))
  page.route('**/api-proxy.php/user/dashboard', r => r.fulfill(json(MOCK_DASHBOARD)))
  page.route('**/api-proxy.php/integrations/weather**', r => r.fulfill(json(MOCK_WEATHER)))
  page.route('**/api-proxy.php/integrations/exchange**', r => r.fulfill(json(MOCK_EXCHANGE)))
  page.route('**/api-proxy.php/integrations/headlines**', r => r.fulfill(json(MOCK_HEADLINES)))
  page.route('**/api-proxy.php/ai/status', r => r.fulfill(json({ data: { available: true, providers: { groq: true, gemini: true } } })))
  page.route('**/api-proxy.php/ai/ask*', r => r.fulfill(json({ data: { reply: 'ok', provider: 'groq', cached: false, elapsed_ms: 1 } })))
}

async function runViewport(name, viewport) {
  console.log(`\n===== ${name} (${viewport.width}x${viewport.height}) =====`)
  const ctx = await browser.newContext({ viewport, ignoreHTTPSErrors: true })
  const page = await ctx.newPage()
  page.on('pageerror', e => console.log(`  [pageerror] ${String(e.message).slice(0, 200)}`))
  page.on('console', m => { if (m.type() === 'error') console.log(`  [console.error] ${m.text().slice(0, 200)}`) })
  setupMocks(page)
  await ctx.addInitScript(() => {
    localStorage.setItem('auth_token', 'mocked-token')
    localStorage.setItem('user_theme', 'cafe')
    localStorage.setItem('ai_widget_welcomed', '1')
  })
  await page.goto(BASE + '/dashboard/', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1200)

  // Aceitar cookies se aparecer
  const accept = page.locator('#cookie-accept')
  if (await accept.count()) { await accept.click().catch(() => {}); await page.waitForTimeout(400) }

  const dumpState = async (label) => {
    const s = await page.evaluate(() => {
      const hash = location.hash
      const sections = [...document.querySelectorAll('.dash-section')].map(sec => ({
        label: sec.querySelector('.section-label')?.textContent?.trim(),
        hidden: sec.hidden,
      }))
      return {
        hash,
        sections,
        aiText: [...document.querySelectorAll('body *')].filter(el => el.childElementCount === 0 && /assistente do criador/i.test(el.textContent || '')).map(el => el.tagName + '.' + (el.className || '').toString().slice(0, 40)),
        inputs: [...document.querySelectorAll('input')].map(i => i.getAttribute('aria-label') || i.getAttribute('placeholder') || i.type),
      }
    })
    console.log(`  [${label}] hash=${s.hash}`)
    console.log(`  [${label}] sections=${JSON.stringify(s.sections)}`)
    console.log(`  [${label}] aiText=${JSON.stringify(s.aiText)}`)
    console.log(`  [${label}] inputs=${JSON.stringify(s.inputs.slice(0, 8))}`)
  }

  // Botões com "Assistente IA"
  const btns = await page.evaluate(() => {
    return [...document.querySelectorAll('button')].filter(b => {
      const t = (b.textContent || '') + '|' + (b.getAttribute('aria-label') || '')
      return /assistente ia/i.test(t)
    }).map(b => {
      const r = b.getBoundingClientRect()
      return {
        cls: (b.className || '').toString().slice(0, 60),
        text: (b.textContent || '').trim().slice(0, 30),
        visible: r.width > 0 && r.height > 0,
        rect: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      }
    })
  })
  console.log(`  Botões com 'Assistente IA': ${JSON.stringify(btns)}`)

  // Fluxo igual ao teste: Contexto do Dia -> Meus Artigos -> Assistente IA
  const goToSection = async (label) => {
    let btn = page.locator(`button:has-text("${label}")`).filter({ visible: true }).first()
    let found = await btn.count()
    let via = 'desktop'
    if (found === 0) {
      const fab = page.locator('.dash-mobile-fab').filter({ visible: true }).first()
      const fabCount = await fab.count()
      if (fabCount > 0) {
        await fab.click({ timeout: 5000 }).catch(() => {})
        await page.waitForTimeout(500)
        btn = page.locator(`.dash-mobile-sheet.open button:has-text("${label}")`).first()
        via = 'mobile-sheet'
      }
    }
    await btn.click({ timeout: 8000 }).catch(e => console.log(`  [click-error ${label}] ${String(e.message).slice(0, 120)}`))
    await page.waitForTimeout(900)
    await dumpState(`após ${label} (via ${via})`)
  }

  await dumpState('inicial')
  await goToSection('Contexto do Dia')
  await goToSection('Meus Artigos')
  await goToSection('Assistente IA')

  await ctx.close()
}

await runViewport('DESKTOP', { width: 1280, height: 800 })
await runViewport('MOBILE', { width: 375, height: 812 })

await browser.close()
server.kill()
console.log('DONE')
