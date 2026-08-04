import AuthPage from './AuthPage'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'
import { getCurrentVocabulary } from '../lib/themes'

interface JourneyData {
  evolution: {
    total_grains: number
    articles_read: number
    reading_time_hours: number
    trails_completed: number
    achievements_unlocked: number
    daily_streak: number
    collections_count: number
    categories_explored: number
  }
  weekly_activity: Array<{
    date: string
    articles_read: number
    minutes: number
  }>
  category_progress: Array<{
    name: string
    slug: string
    articles_read: number
    total_articles: number
    percent: number
  }>
}

function JornadaContent() {
  const { user } = useAuth()
  const [data, setData] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const vocab = getCurrentVocabulary()

  useEffect(() => {
    api.get<JourneyData>('/user/jornada')
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p class="text-[var(--color-text-muted)]">Carregando sua jornada...</p>
        </div>
      </div>
    )
  }

  const s = data?.evolution

  return (
    <div class="space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Sua Jornada</h1>
        <p class="text-[var(--color-text-secondary)] mt-2">
          Acompanhe sua evolução como leitor e conhecedor
        </p>
      </div>

      {/* Profile summary */}
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-2xl font-bold text-[var(--color-accent)]">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 class="text-xl font-bold text-[var(--color-text-primary)]">{user?.name}</h2>
            <p class="text-[var(--color-text-secondary)]">@{user?.username} &middot; {s?.daily_streak || 0} dias seguidos 🔥</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: vocab.currency, value: s?.total_grains || 0, icon: vocab.currency_icon },
          { label: 'Artigos Lidos', value: s?.articles_read || 0, icon: '📖' },
          { label: 'Horas de Leitura', value: s?.reading_time_hours || 0, icon: '⏱️' },
          { label: 'Trilhas Completas', value: s?.trails_completed || 0, icon: '🎯' },
          { label: 'Conquistas', value: s?.achievements_unlocked || 0, icon: '🏆' },
          { label: 'Coleções', value: s?.collections_count || 0, icon: '📚' },
          { label: 'Categorias', value: s?.categories_explored || 0, icon: '🌍' },
          { label: 'Dias Seguidos', value: s?.daily_streak || 0, icon: '🔥' },
        ].map(stat => (
          <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-4 text-center">
            <div class="text-2xl mb-1">{stat.icon}</div>
            <div class="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</div>
            <div class="text-xs text-[var(--color-text-muted)]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category progress */}
      {data?.category_progress && data.category_progress.length > 0 && (
        <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Progresso por Categoria</h2>
          <div class="space-y-4">
            {data.category_progress.map(cat => (
              <div key={cat.slug}>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-[var(--color-text-primary)]">{cat.name}</span>
                  <span class="text-xs font-mono text-[var(--color-text-muted)]">{cat.articles_read}/{cat.total_articles}</span>
                </div>
                <div class="w-full h-2 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percent}%`,
                      background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-secondary))',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly activity */}
      {data?.weekly_activity && data.weekly_activity.length > 0 && (
        <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Atividade da Semana</h2>
          <div class="grid grid-cols-7 gap-2">
            {data.weekly_activity.map((day, i) => (
              <div key={i} class="text-center">
                <div class="text-xs text-[var(--color-text-muted)] mb-1">
                  {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                </div>
                <div class="text-lg font-bold text-[var(--color-text-primary)]">{day.articles_read}</div>
                <div class="text-xs text-[var(--color-text-muted)]">{day.minutes}min</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolution index */}
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Índice de Evolução</h2>
        <p class="text-[var(--color-text-secondary)]">
          Você já investiu <strong class="text-[var(--color-text-primary)]">{s?.reading_time_hours || 0} horas</strong> em aprendizado,
          concluiu <strong class="text-[var(--color-text-primary)]">{s?.trails_completed || 0} trilhas</strong>
          e explorou <strong class="text-[var(--color-text-primary)]">{s?.categories_explored || 0} categorias</strong>.
        </p>
      </div>

      {/* Quick actions */}
      <div class="flex flex-wrap gap-3">
        <a href="/mapa" class="px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-btn-text)] rounded-xl font-medium hover:opacity-90 transition-opacity">🗺️ Mapa</a>
        <a href="/trilhas" class="px-5 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">Trilhas</a>
        <a href="/missoes" class="px-5 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">🎯 Missões</a>
        <a href="/conquistas" class="px-5 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">🏆 Conquistas</a>
      </div>
    </div>
  )
}

export default function JornadaPage() {
  return <AuthPage><JornadaContent /></AuthPage>
}