import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4353
const server = spawn('node', ['tests/playwright/static-server.mjs', String(PORT), 'dist'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 1200))

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.addInitScript(() => {
  localStorage.setItem('auth_token', 'mocked-token')
  localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, date: new Date().toISOString() }))
})

// ── Mocks da API (espelhando o shape do backend) ──
const user = { id: 1, name: 'Wesley Teste', username: 'wesley', email: 't@t.com', bio: null, avatar: null, theme: 'cafe', reading_time_total: 10, articles_read_count: 3, daily_streak: 2, total_grains: 120, completed_trails: 1, collections_count: 2, achievements_count: 4 }

const mocks = [
  { url: '**/api-proxy.php/auth/me', body: { user } },
  { url: '**/api-proxy.php/user/jornada', body: { evolution: { total_grains: 120, articles_read: 3, reading_time_hours: 10, trails_completed: 1, achievements_unlocked: 4, daily_streak: 2, collections_count: 2, categories_explored: 3 }, weekly_activity: [{ date: '2026-08-12', articles_read: 1, minutes: 30 }, { date: '2026-08-13', articles_read: 2, minutes: 45 }], category_progress: [{ name: 'Café', slug: 'cafe', articles_read: 2, total_articles: 5, percent: 40 }] } },
  { url: '**/api-proxy.php/user/grains', body: { balance: 120, total_earned: 220, total_spent: 100, recent: [{ id: 1, amount: 10, type: 'earned', source: 'article', description: 'Leitura de artigo', created_at: '2026-08-13T10:00:00Z' }] } },
  { url: '**/api-proxy.php/user/rewards', body: { rewards: [], grouped: { themes: [], avatars: [], frames: [], specials: [] }, balance: 120, total_earned: 220, total_spent: 100, unlocked_count: 0, total_count: 4, active_count: 0 } },
  { url: '**/api-proxy.php/user/missions/daily', body: { missions: [{ id: 1, title: 'Leia 1 artigo', description: 'Leia um artigo hoje', icon: '📖', type: 'daily', grain_reward: 10, conditions: { action: 'read', target: 1 }, progress: 1, target: 1, is_completed: true, reward_claimed: false }] } },
  { url: '**/api-proxy.php/user/missions/weekly', body: { missions: [] } },
  { url: '**/api-proxy.php/user/achievements', body: { unlocked: [{ id: 1, name: 'Primeira Xícara', slug: 'first', description: 'Primeira leitura', icon: '☕', category: 'volume', rarity: 'common', grain_reward: 10, unlocked: true }], locked: [], total: 1, unlocked_count: 1 } },
  { url: '**/api-proxy.php/user/trails', body: { trails: [{ id: 1, title: 'Barista Iniciante', slug: 'barista', description: 'Aprenda o básico', icon: '☕', color: null, difficulty: 'beginner', estimated_hours: 5, grain_reward: 50, articles_count: 3, recipes_count: 1, user_progress: 40, is_completed: false }] } },
]

for (const m of mocks) {
  await page.route(m.url, async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(m.body) })
  })
}

const pages = [
  { path: '/jornada/', title: 'Sua Jornada' },
  { path: '/graos/', title: 'Meus Grãos' },
  { path: '/torrefacao/', title: 'Torrefação' },
  { path: '/missoes/', title: 'Missões' },
  { path: '/conquistas/', title: 'Conquistas' },
  { path: '/trilhas/', title: 'Trilhas de Conhecimento' },
]

for (const p of pages) {
  try {
    await page.goto(`http://localhost:${PORT}${p.path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const r = await page.evaluate(() => {
      const hero = document.querySelector('.reader-hero')
      return {
        hero: !!hero,
        label: hero?.querySelector('.section-label')?.textContent?.trim() || null,
        title: hero?.querySelector('.reader-title')?.textContent?.trim().slice(0, 40) || null,
        subtitle: hero?.querySelector('.reader-subtitle')?.textContent?.trim().slice(0, 40) || null,
        cards: document.querySelectorAll('.reader-card').length,
        redirect: location.pathname !== location.pathname,
        url: location.pathname,
      }
    })
    const okHero = r.hero && r.title
    console.log(`${okHero ? 'PASS' : 'FAIL'} | Leitor ${p.path} | hero=${r.hero} label=${r.label} title=${r.title} subtitle=${!!r.subtitle} cards=${r.cards}`)
  } catch (e) {
    console.log(`FAIL | Leitor ${p.path} | ${String(e.message).split('\n')[0]}`)
  }
}

await browser.close()
server.kill()
console.log('DONE')
