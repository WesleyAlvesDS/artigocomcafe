import { useState, useEffect } from 'react'
import AuthPage from './AuthPage'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { getCurrentVocabulary } from '../lib/themes'

interface EvolutionData {
  total_grains: number
  articles_read: number
  reading_time_hours: number
  trails_completed: number
  achievements_unlocked: number
  daily_streak: number
  collections_count: number
  categories_explored: number
}

interface DashboardResponse {
  evolution: EvolutionData
}

interface WeatherData {
  city: string
  region: string | null
  country: string | null
  temperature_c: number | null
  feels_like_c: number | null
  description: string | null
  icon_url: string | null
  humidity: number | null
  wind_speed_kmph: number | null
  wind_direction: string | null
  uv_index: number | null
  observation_time: string | null
  source?: string
  cached_at?: string
}

interface ExchangeRate {
  base: string
  code: string
  rate: number
  inverse: number | null
}

interface ExchangeData {
  base: string
  updated_at: string | null
  rates: ExchangeRate[]
  source?: string
  cached_at?: string
}

interface HeadlineItem {
  title: string
  url: string | null
  section: string | null
  published_at: string | null
  thumbnail: string | null
  excerpt: string | null
  author: string | null
  source: string
}

interface HeadlinesSource {
  items: HeadlineItem[]
  total: number
  source: string
  cached_at?: string
}

interface HeadlinesResponse {
  data: {
    guardian: HeadlinesSource
    hacker_news: HeadlinesSource
  }
}

function StatSkeleton() {
  return (
    <div class="glass-card p-5 animate-pulse">
      <div class="w-10 h-10 rounded-xl bg-[var(--color-bg-card-border)] mb-3" />
      <div class="h-7 w-3/4 bg-[var(--color-bg-card-border)] rounded mb-1" />
      <div class="h-4 w-1/2 bg-[var(--color-bg-card-border)] rounded" />
    </div>
  )
}

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = sessionStorage.getItem('dash_weather')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as WeatherData
        if (parsed.temperature_c != null) {
          setWeather(parsed)
          setLoading(false)
          return
        }
      } catch {}
    }

    api.get<{ data: WeatherData }>('/integrations/weather?city=Sao Paulo')
      .then(d => {
        setWeather(d.data)
        try { sessionStorage.setItem('dash_weather', JSON.stringify(d.data)) } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div class="glass-card p-6 transition-all">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Clima do Café
        </span>
        <div class="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
          {loading ? (
            <div class="w-6 h-6 rounded bg-[var(--color-bg-card-border)] animate-pulse" />
          ) : weather?.icon_url ? (
            <img src={weather.icon_url} alt={weather.description || 'Ícone do clima'} width="28" height="28" loading="lazy" decoding="async" class="rounded" />
          ) : (
            <span class="text-xl">🌤️</span>
          )}
        </div>
      </div>

      {loading ? (
        <div class="space-y-2">
          <div class="h-8 w-1/4 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
          <div class="h-4 w-3/4 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
          <div class="h-4 w-1/2 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
        </div>
      ) : !weather || weather.temperature_c == null ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl">☁️</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indisponível no momento</span>
        </div>
      ) : (
        <>
          <div class="flex items-center gap-4 mb-1">
            <span class="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {Math.round(weather.temperature_c)}°C
            </span>
            <span class="text-sm text-[var(--color-text-secondary)] capitalize">
              {weather.description || '—'}
            </span>
          </div>
          <p class="text-sm text-[var(--color-text-secondary)] mb-3">
            {weather.city}{weather.region ? `, ${weather.region}` : ''}
          </p>
          <div class="grid grid-cols-3 gap-2 text-center">
            {weather.humidity != null && (
              <div>
                <div class="text-sm font-semibold text-[var(--color-text-primary)]">{weather.humidity}%</div>
                <div class="text-[10px] text-[var(--color-text-muted)]">Umidade</div>
              </div>
            )}
            {weather.wind_speed_kmph != null && (
              <div>
                <div class="text-sm font-semibold text-[var(--color-text-primary)]">{Math.round(weather.wind_speed_kmph)} km/h</div>
                <div class="text-[10px] text-[var(--color-text-muted)]">Vento</div>
              </div>
            )}
            {weather.feels_like_c != null && (
              <div>
                <div class="text-sm font-semibold text-[var(--color-text-primary)]">{Math.round(weather.feels_like_c)}°C</div>
                <div class="text-[10px] text-[var(--color-text-muted)]">Sensação</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ExchangeWidget() {
  const [rates, setRates] = useState<ExchangeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = sessionStorage.getItem('dash_exchange')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ExchangeData
        if (parsed.rates && parsed.rates.length > 0) {
          setRates(parsed)
          setLoading(false)
          return
        }
      } catch {}
    }

    api.get<{ data: ExchangeData }>('/integrations/exchange?base=BRL')
      .then(d => {
        setRates(d.data)
        try { sessionStorage.setItem('dash_exchange', JSON.stringify(d.data)) } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div class="glass-card p-6 transition-all">
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Câmbio ao Vivo
          </span>
          <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
            {rates ? `1 ${rates.base} para outras moedas` : 'Taxas de câmbio'}
          </p>
        </div>
        <span class="text-2xl">💱</span>
      </div>

      {loading ? (
        <div class="space-y-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} class="flex justify-between">
              <div class="h-4 w-10 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
              <div class="h-4 w-16 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : !rates || !rates.rates || rates.rates.length === 0 ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl">💱</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indisponível no momento</span>
        </div>
      ) : (
        <>
          <div class="divide-y divide-[var(--color-bg-card-border)]">
            {rates.rates.slice(0, 6).map(r => (
              <div key={r.code} class="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div class="flex items-center gap-2.5">
                  <span class="text-xs font-mono bg-[var(--color-bg-card-border)]/30 px-2 py-1 rounded text-[var(--color-text-primary)]">
                    {r.code}
                  </span>
                  <span class="text-xs text-[var(--color-text-muted)]">1 {r.base} =</span>
                </div>
                <span class="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                  {r.rate.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
          {rates.cached_at && (
            <p class="text-[10px] text-[var(--color-text-muted-dark)] mt-3 text-right">
              atualizado há pouco · {rates.source}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function HeadlinesWidget() {
  const [headlines, setHeadlines] = useState<HeadlineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = sessionStorage.getItem('dash_headlines')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as HeadlineItem[]
        if (parsed.length > 0) {
          setHeadlines(parsed)
          setLoading(false)
          return
        }
      } catch {}
    }

    api.get<HeadlinesResponse>('/integrations/headlines?limit=5')
      .then(d => {
        const combined = [
          ...(d.data.guardian?.items || []),
          ...(d.data.hacker_news?.items || []),
        ].slice(0, 6)
        setHeadlines(combined)
        try { sessionStorage.setItem('dash_headlines', JSON.stringify(combined)) } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div class="glass-card p-6 transition-all">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Manchetes do Dia
        </span>
        <span class="text-2xl">📰</span>
      </div>

      {loading ? (
        <div class="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} class="h-4 bg-[var(--color-bg-card-border)] rounded last:w-2/3 animate-pulse" />
          ))}
        </div>
      ) : headlines.length === 0 ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl">📭</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indisponível no momento</span>
        </div>
      ) : (
        <ul class="space-y-2.5">
          {headlines.map((h, i) => (
            <li key={i} class="group">
              <a
                href={h.url || '#'}
                target={h.url ? '_blank' : undefined}
                rel={h.url ? 'noopener noreferrer' : undefined}
                class="block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <span class="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                  {h.title}
                </span>
                <div class="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--color-text-muted-dark)]">
                  <span class="font-medium">{h.source || '—'}</span>
                  {h.excerpt && <span>·</span>}
                  {h.excerpt && <span class="truncate">{h.excerpt}</span>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DashboardContent() {
  const { user, logout } = useAuth()
  const [dash, setDash] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const vocab = getCurrentVocabulary()

  useEffect(() => {
    api.get<DashboardResponse>('/user/dashboard')
      .then(d => setDash(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const s = dash?.evolution

  const statCards = [
    { label: vocab.currency, value: s?.total_grains ?? 0, icon: vocab.currency_icon },
    { label: 'Artigos Lidos', value: s?.articles_read ?? 0, icon: '📖' },
    { label: 'Horas de Leitura', value: s?.reading_time_hours ?? 0, icon: '⏱️' },
    { label: 'Trilhas Completas', value: s?.trails_completed ?? 0, icon: '🎯' },
    { label: 'Conquistas', value: s?.achievements_unlocked ?? 0, icon: '🏆' },
    { label: 'Coleções', value: s?.collections_count ?? 0, icon: '📚' },
    { label: 'Categorias', value: s?.categories_explored ?? 0, icon: '🌍' },
    { label: 'Dias Seguidos', value: s?.daily_streak ?? 0, icon: '🔥' },
  ]

  const maxReading = 100
  const readingPct = s?.reading_time_hours ? Math.min(100, (s.reading_time_hours / maxReading) * 100) : 0
  const progressPct = s
    ? (s.total_grains + s.articles_read + s.trails_completed + s.achievements_unlocked + s.collections_count + s.categories_explored) > 0
      ? Math.min(100, Math.round(
        (s.total_grains / 1000) * 15 +
        (s.articles_read / 50) * 20 +
        (s.trails_completed / 10) * 20 +
        (s.achievements_unlocked / 20) * 15 +
        (s.collections_count / 5) * 15 +
        (s.categories_explored / 10) * 15
      ))
      : 0
    : 0

  const quickActions = [
    { label: 'Mapa do Conhecimento', icon: '🗺️', href: '/mapa' },
    { label: 'Torrefação', icon: '☕', href: '/torrefacao' },
    { label: 'Biblioteca', icon: '📚', href: '/biblioteca' },
    { label: vocab.currency, icon: vocab.currency_icon, href: '/graos' },
    { label: 'Conquistas', icon: '🏆', href: '/conquistas' },
    { label: 'Missões', icon: '🎯', href: '/missoes' },
    { label: 'Trilhas', icon: '🎓', href: '/trilhas' },
  ]

  return (
    <div class="space-y-8">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/20 flex items-center justify-center text-3xl font-bold text-[var(--color-accent)]">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">{user?.name || 'Carregando...'}</h1>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-sm text-[var(--color-text-secondary)]">@{user?.username || '—'}</span>
              {s && s.daily_streak > 0 && (
                <>
                  <span class="text-[var(--color-text-muted)]">·</span>
                  <span class="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                    🔥 {s.daily_streak} dias seguidos
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          class="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-[var(--color-bg-card-border)] transition-colors"
        >
          Sair
        </button>
      </div>

      {/* Stats Grid */}
      <div data-reveal>
        <div class="section-label mb-3">Sua Evolução</div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading ? (
            <>
              {statCards.map((_, i) => (
                <StatSkeleton key={i} />
              ))}
            </>
          ) : (
            statCards.map(stat => (
              <div key={stat.label} class="glass-card p-5 text-center group transition-all">
                <div class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
                  {stat.icon}
                </div>
                <div class="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
                  {stat.value}
                </div>
                <div class="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Progress Visualization + Quick Actions */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" data-reveal>
        {/* Progress viz */}
        <div class="glass-card p-6 lg:col-span-1">
          <div class="section-label mb-4">Progresso Geral</div>
          {loading ? (
            <div class="flex flex-col items-center py-6">
              <div class="w-24 h-24 rounded-full bg-[var(--color-bg-card-border)] animate-pulse mb-4" />
              <div class="h-4 w-20 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
            </div>
          ) : (
            <div class="flex flex-col items-center text-center">
              <div class="relative w-28 h-28">
                <svg class="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="var(--color-bg-card-border)"
                    stroke-width="8"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="var(--color-accent)"
                    stroke-width="8"
                    stroke-linecap="round"
                    stroke-dasharray={`${264 * (progressPct / 100)} 264`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
                    {progressPct}%
                  </span>
                </div>
              </div>
              <p class="text-xs text-[var(--color-text-muted)] mt-3">
                Baseado na sua atividade recente
              </p>
            </div>
          )}
        </div>

        {/* Reading time bar */}
        <div class="glass-card p-6 lg:col-span-1">
          <div class="section-label mb-4">Tempo de Leitura</div>
          {loading ? (
            <div class="space-y-3">
              <div class="h-3 w-full bg-[var(--color-bg-card-border)] rounded-full animate-pulse" />
              <div class="h-3 w-3/4 bg-[var(--color-bg-card-border)] rounded-full animate-pulse" />
            </div>
          ) : (
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--color-text-secondary)]">
                  {s?.reading_time_hours || 0} horas de leitura
                </span>
                <span class="text-xs text-[var(--color-text-muted)]">meta: {maxReading}h</span>
              </div>
              <div class="h-2.5 bg-[var(--color-bg-card-border)] rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)]"
                  style={{ width: `${readingPct}%` }}
                />
              </div>
              <div class="grid grid-cols-2 gap-3 text-center pt-2">
                <div>
                  <div class="text-lg font-bold text-[var(--color-text-primary)]">{s?.articles_read || 0}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)]">Artigos concluídos</div>
                </div>
                <div>
                  <div class="text-lg font-bold text-[var(--color-text-primary)]">{s?.trails_completed || 0}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)]">Trilhas concluídas</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div class="glass-card p-6 lg:col-span-1">
          <div class="section-label mb-4">Atalhos</div>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-2.5">
            {quickActions.map(action => (
              <a
                key={action.label}
                href={action.href}
                class="flex items-center gap-2.5 p-3 rounded-xl text-[var(--color-text-primary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-card-hover)] transition-all text-sm font-medium"
                style={{ background: 'color-mix(in srgb, var(--color-bg-card) 40%, transparent)' }}
              >
                <span class="text-xl flex-shrink-0">{action.icon}</span>
                <span>{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* API Plan Integrations Section */}
      <div data-reveal>
        <div class="section-label mb-2">Contexto do Dia</div>
        <p class="text-sm text-[var(--color-text-muted)] mb-4">
          Dados em tempo real integrados ao seu painel de acordo com o plano de APIs do projeto.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WeatherWidget />
          <ExchangeWidget />
          <HeadlinesWidget />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <AuthPage><DashboardContent /></AuthPage>
}
