import AuthPage from './AuthPage'
import ReaderHeader from './ReaderHeader'
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
      <ReaderHeader
        label="📊 Jornada"
        title="Sua Jornada"
        subtitle="Acompanhe sua evolução como leitor e conhecedor"
      />

      {/* Profile summary */}
      <div class="glass-card p-6 data-reveal">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] flex items-center justify-center text-2xl font-bold text-[var(--color-btn-text)] shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 class="text-xl font-bold text-[var(--color-text-primary)]">{user?.name}</h2>
              <p class="text-[var(--color-text-secondary)]">@{user?.username} &middot; {s?.daily_streak || 0} dias seguidos 🔥</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
            <span class="text-xs font-mono text-[var(--color-accent)]">NÍVEL {Math.floor((s?.reading_time_hours || 0) / 10) + 1}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-stagger">
        {[
          { label: vocab.currency, value: s?.total_grains || 0, icon: vocab.currency_icon, accent: true },
          { label: 'Artigos Lidos', value: s?.articles_read || 0, icon: '📖' },
          { label: 'Horas de Leitura', value: s?.reading_time_hours || 0, icon: '⏱️' },
          { label: 'Trilhas Completas', value: s?.trails_completed || 0, icon: '🎯' },
          { label: 'Conquistas', value: s?.achievements_unlocked || 0, icon: '🏆' },
          { label: 'Coleções', value: s?.collections_count || 0, icon: '📚' },
          { label: 'Categorias', value: s?.categories_explored || 0, icon: '🌍' },
          { label: 'Dias Seguidos', value: s?.daily_streak || 0, icon: '🔥' },
        ].map(stat => (
          <div key={stat.label} class="reader-card p-5 text-center group cursor-default">
            <div class="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110">{stat.icon}</div>
            <div class={`text-2xl font-bold text-[var(--color-text-primary)] tabular-nums ${stat.accent ? 'gradient-text' : ''}`}>{stat.value}</div>
            <div class="text-xs text-[var(--color-text-muted)] mt-1 font-medium tracking-wide uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category progress */}
      {data?.category_progress && data.category_progress.length > 0 && (
        <div class="glass-card p-6 data-reveal">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold text-[var(--color-text-primary)]">Progresso por Categoria</h2>
            <span class="text-xs text-[var(--color-text-muted)] font-mono">{data.category_progress.length} categorias</span>
          </div>
          <div class="space-y-5">
            {data.category_progress.map(cat => (
              <div key={cat.slug} class="group">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{cat.name}</span>
                  <span class="text-xs font-mono text-[var(--color-text-muted)]">{cat.articles_read}/{cat.total_articles}</span>
                </div>
                <div class="reader-progress-track">
                  <div class="reader-progress-fill relative" style={{ width: `${cat.percent}%` }}>
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse opacity-60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly activity */}
      {data?.weekly_activity && data.weekly_activity.length > 0 && (
        <div class="glass-card p-6 data-reveal">
          <h2 class="text-lg font-bold text-[var(--color-text-primary)] mb-5">Atividade da Semana</h2>
          <div class="grid grid-cols-7 gap-3">
            {data.weekly_activity.map((day, i) => (
              <div key={i} class="text-center p-2 rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors">
                <div class="text-[10px] font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
                  {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                </div>
                <div class="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">{day.articles_read}</div>
                <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5">{day.minutes}min</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolution index */}
      <div class="glass-card p-6 data-reveal relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <h2 class="text-lg font-bold text-[var(--color-text-primary)] mb-3">Indice de Evolucao</h2>
        <p class="text-[var(--color-text-secondary)] leading-relaxed">
          Voce ja investiu <strong class="text-[var(--color-text-primary)] gradient-text">{s?.reading_time_hours || 0} horas</strong> em aprendizado,
          concluiu <strong class="text-[var(--color-text-primary)] gradient-text">{s?.trails_completed || 0} trilhas</strong>
          e explorou <strong class="text-[var(--color-text-primary)] gradient-text">{s?.categories_explored || 0} categorias</strong>.
        </p>
      </div>

      {/* Quick actions */}
      <div class="flex flex-wrap gap-3 data-reveal">
        <a href="/mapa" class="btn-primary ripple">
          🗺️ Mapa
        </a>
        <a href="/trilhas" class="btn-ghost">Trilhas</a>
        <a href="/missoes" class="btn-ghost">🎯 Missoes</a>
        <a href="/conquistas" class="btn-ghost">🏆 Conquistas</a>
      </div>
    </div>
  )
}

export default function JornadaPage() {
  return <AuthPage><JornadaContent /></AuthPage>
}
