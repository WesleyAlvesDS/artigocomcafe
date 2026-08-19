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
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-2xl font-bold text-[var(--color-accent)]">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">{user?.name}</h1>
            <p class="text-[var(--color-text-secondary)]">@{user?.username} &middot; {s?.daily_streak || 0} dias seguidos 🔥</p>
          </div>
        </div>
        <button onClick={logout} class="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-[var(--color-bg-card-border)] transition-colors">Sair</button>
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
          <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-4 text-center">
            <div class="text-2xl mb-1">{stat.icon}</div>
            <div class="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</div>
            <div class="text-xs text-[var(--color-text-muted)]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Índice de Evolução</h2>
        <p class="text-[var(--color-text-secondary)]">
          Você já investiu <strong class="text-[var(--color-text-primary)]">{s?.reading_time_hours || 0} horas</strong> em aprendizado,
          concluiu <strong class="text-[var(--color-text-primary)]">{s?.trails_completed || 0} trilhas</strong>
          e explorou <strong class="text-[var(--color-text-primary)]">{s?.categories_explored || 0} categorias</strong>.
        </p>
      </div>

      <FavoriteCategories />

      <div class="flex flex-wrap gap-3">
        <a href="/dashboard#/mapa" class="px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-btn-text)] rounded-xl font-medium hover:opacity-90 transition-opacity">🗺️ Mapa</a>
        <a href="/dashboard#/torrefacao" class="px-5 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:opacity-90 transition-opacity">☕ Torrefação</a>
        <a href="/dashboard#/biblioteca" class="px-5 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">Biblioteca</a>
        <a href="/dashboard#/graos" class="px-5 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">{vocab.currency}</a>
        <a href="/dashboard#/conquistas" class="px-5 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">Conquistas</a>
        <a href="/dashboard#/missoes" class="px-5 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">🎯 Missões</a>
        <a href="/dashboard#/trilhas" class="px-5 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">Trilhas</a>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return <AuthPage><ProfileContent /></AuthPage>
}
