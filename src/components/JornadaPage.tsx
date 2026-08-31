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
      <div class="glass-card p-6 data-reveal relative overflow-hidden">
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
              <h2 class="text-xl font-bold text-[var(--color-text-primary)]">{user?.name}</h2>
              <p class="text-sm text-[var(--color-text-secondary)]">@{user?.username} &middot; {s?.daily_streak || 0} dias seguidos</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-accent-secondary)]/10 border border-[var(--color-accent)]/20 shadow-[0_0_12px_var(--color-accent-glow)]">
            <span class="text-sm font-bold text-[var(--color-accent)]">Nível {Math.min(10, 1 + Math.floor((s?.total_grains || 0) / 300))}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: vocab.currency, value: s?.total_grains || 0, icon: vocab.currency_icon, accent: true },
          { label: 'Artigos Lidos', value: s?.articles_read || 0, icon: '📖' },
          { label: 'Horas de Leitura', value: s?.reading_time_hours || 0, icon: '⏱️' },
          { label: 'Trilhas Completas', value: s?.trails_completed || 0, icon: '🎯' },
          { label: 'Conquistas', value: s?.achievements_unlocked || 0, icon: '🏆' },
          { label: 'Coleções', value: s?.collections_count || 0, icon: '📚' },
          { label: 'Categorias', value: s?.categories_explored || 0, icon: '🌍' },
          { label: 'Dias Seguidos', value: s?.daily_streak || 0, icon: '🔥' },
        ].map((stat, idx) => (
          <div key={stat.label} class="glass-card p-5 text-center group cursor-default relative overflow-hidden" style={{ animationDelay: `${idx * 50}ms` }}>
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[var(--color-accent)]/5 via-transparent to-[var(--color-accent-secondary)]/5 pointer-events-none" />
            <div class="relative">
              <div class="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 12%, transparent), color-mix(in srgb, var(--color-accent-secondary) 8%, transparent))', border: '1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
                {stat.icon}
              </div>
              <div class={`text-2xl font-bold text-[var(--color-text-primary)] tabular-nums ${stat.accent ? 'gradient-text' : ''}`}>{stat.value}</div>
              <div class="text-[10px] text-[var(--color-text-muted)] mt-1 font-medium tracking-wide uppercase">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category progress */}
      {data?.category_progress && data.category_progress.length > 0 && (
        <div class="glass-card p-6 data-reveal relative overflow-hidden">
          <div class="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[var(--color-accent-secondary)]/6 blur-xl pointer-events-none" />
          <div class="relative">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-bold text-[var(--color-text-primary)]">📊 Progresso por Categoria</h2>
              <span class="text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-bg-card)] px-2 py-1 rounded-lg">{data.category_progress.length} categorias</span>
            </div>
            <div class="space-y-5">
              {data.category_progress.map(cat => (
                <div key={cat.slug} class="group">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{cat.name}</span>
                    <span class="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-card)] px-2 py-0.5 rounded-md">{cat.articles_read}/{cat.total_articles}</span>
                  </div>
                  <div class="h-2.5 bg-[var(--color-bg-card-border)] rounded-full overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] transition-all duration-700 shadow-[0_0_8px_var(--color-accent-glow)]" style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
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
        <h2 class="text-lg font-bold text-[var(--color-text-primary)] mb-3">Índice de Evolução</h2>
        <p class="text-[var(--color-text-secondary)] leading-relaxed">
          Você já investiu <strong class="text-[var(--color-text-primary)] gradient-text">{s?.reading_time_hours || 0} horas</strong> em aprendizado,
          concluiu <strong class="text-[var(--color-text-primary)] gradient-text">{s?.trails_completed || 0} trilhas</strong>
          e explorou <strong class="text-[var(--color-text-primary)] gradient-text">{s?.categories_explored || 0} categorias</strong>.
        </p>
      </div>

      {/* Quick actions */}
      <div class="flex flex-wrap gap-3 data-reveal">
        <a href="/dashboard#/mapa" class="btn-primary ripple">
          🗺️ Mapa
        </a>
        <a href="/dashboard#/trilhas" class="btn-ghost">Trilhas</a>
        <a href="/dashboard#/missoes" class="btn-ghost">🎯 Missões</a>
        <a href="/dashboard#/conquistas" class="btn-ghost">🏆 Conquistas</a>
      </div>
    </div>
  )
}

export default function JornadaPage() {
  return <JornadaContent />
}
