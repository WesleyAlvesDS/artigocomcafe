import AuthPage from './AuthPage'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'
import { getCurrentVocabulary } from '../lib/themes'
import FavoriteCategories from './FavoriteCategories'

interface DashboardData {
  evolution: {
    total_grains: number; articles_read: number; reading_time_hours: number
    trails_completed: number; achievements_unlocked: number; daily_streak: number
    collections_count: number; categories_explored: number
  }
}

function ProfileContent() {
  const { user, logout } = useAuth()
  const [dash, setDash] = useState<DashboardData | null>(null)
  const [vocab, setVocab] = useState(getCurrentVocabulary())

  useEffect(() => {
    api.get<DashboardData>('/user/dashboard').then(setDash).catch(() => {})
    setVocab(getCurrentVocabulary())
    const handler = () => setVocab(getCurrentVocabulary())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const s = dash?.evolution

  return (
    <div class="space-y-8">
      <div class="glass-card p-6">
        <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[var(--color-accent)]/8 blur-2xl pointer-events-none" />
        <div class="relative flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div class="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-secondary)] to-[var(--color-accent)] shadow-[0_0_24px_var(--color-accent-glow)]">
                <div class="w-full h-full rounded-[14px] bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] flex items-center justify-center text-2xl font-bold text-[var(--color-btn-text)]">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              </div>
              {s && s.daily_streak > 0 && (
                <span class="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs flex items-center justify-center shadow-md" title={`${s.daily_streak} dias seguidos`}>
                  🔥
                </span>
              )}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">{user?.name}</h1>
              <p class="text-sm text-[var(--color-text-secondary)]">@{user?.username} &middot; {s?.daily_streak || 0} dias seguidos 🔥</p>
            </div>
          </div>
          <button onClick={logout} class="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-xl border border-[var(--color-bg-card-border)] transition-colors">Sair</button>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: vocab.currency, value: s?.total_grains || 0, icon: vocab.currency_icon },
          { label: 'Artigos Lidos', value: s?.articles_read || 0, icon: '📖' },
          { label: 'Horas de Leitura', value: s?.reading_time_hours || 0, icon: '⏱️' },
          { label: 'Trilhas Completas', value: s?.trails_completed || 0, icon: '🎯' },
          { label: 'Conquistas', value: s?.achievements_unlocked || 0, icon: '🏆' },
          { label: 'Coleções', value: s?.collections_count || 0, icon: '📚' },
          { label: 'Categorias', value: s?.categories_explored || 0, icon: '🌍' },
        ].map(stat => (
          <div key={stat.label} class="glass-card p-5 text-center group cursor-default relative overflow-hidden">
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[var(--color-accent)]/5 via-transparent to-[var(--color-accent-secondary)]/5 pointer-events-none" />
            <div class="relative">
              <div class="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 12%, transparent), color-mix(in srgb, var(--color-accent-secondary) 8%, transparent))', border: '1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
                {stat.icon}
              </div>
              <div class="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">{stat.value}</div>
              <div class="text-[10px] text-[var(--color-text-muted)] mt-1 font-medium tracking-wide uppercase">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div class="glass-card p-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <h2 class="text-lg font-bold text-[var(--color-text-primary)] mb-3">Índice de Evolução</h2>
        <p class="text-[var(--color-text-secondary)] leading-relaxed relative">
          Você já investiu <strong class="text-[var(--color-text-primary)] gradient-text">{s?.reading_time_hours || 0} horas</strong> em aprendizado,
          concluiu <strong class="text-[var(--color-text-primary)] gradient-text">{s?.trails_completed || 0} trilhas</strong>
          e explorou <strong class="text-[var(--color-text-primary)] gradient-text">{s?.categories_explored || 0} categorias</strong>.
        </p>
      </div>

      <FavoriteCategories />

      <div class="flex flex-wrap gap-3">
        <a href="/dashboard#/mapa" class="btn-primary ripple">🗺️ Mapa</a>
        <a href="/dashboard#/torrefacao" class="btn-ghost">☕ Torrefação</a>
        <a href="/dashboard#/biblioteca" class="btn-ghost">📚 Biblioteca</a>
        <a href="/dashboard#/graos" class="btn-ghost">{vocab.currency}</a>
        <a href="/dashboard#/conquistas" class="btn-ghost">🏆 Conquistas</a>
        <a href="/dashboard#/missoes" class="btn-ghost">🎯 Missões</a>
        <a href="/dashboard#/trilhas" class="btn-ghost">🎓 Trilhas</a>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return <ProfileContent />
}
