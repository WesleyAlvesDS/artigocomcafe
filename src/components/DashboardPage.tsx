import { useState, useEffect, useRef, useCallback } from 'react'
import type { ChangeEvent, KeyboardEvent, FormEvent } from 'react'
import AuthPage from './AuthPage'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { getCurrentVocabulary } from '../lib/themes'
import { getLocationPref, saveLocationPref, type LocationPref } from '../lib/consent'
import { saveDraft, readDraft, readDraftList, clearDraft, emitDraftChange, type PostFormData } from '../lib/draft'
import PostManagementWidget from './PostManagementWidget'
import DashboardMobileNav from './DashboardMobileNav'
import { showToast } from './Toast'

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

// Post types for management
interface PostItem {
  id: number
  title: string
  slug: string
  excerpt: string | null
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived'
  featured_image: string | null
  reading_time: number | null
  category: { name: string; slug: string } | null
  tags: { name: string; slug: string }[]
  date: string
  created_at: string
  updated_at: string
}

interface PostsResponse {
  data: PostItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

const statusLabels: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  review: 'Em Revisão',
  scheduled: 'Agendado',
  archived: 'Arquivado',
}

const statusColors: Record<string, string> = {
  published: 'var(--color-accent)',
  draft: 'var(--color-text-muted)',
  review: '#f59e0b',
  scheduled: '#3b82f6',
  archived: '#6b7280',
}

const SECTIONS = [
  { id: 'overview', label: 'Visão Geral', icon: '📊' },
  { id: 'context', label: 'Contexto do Dia', icon: '🌤️' },
  { id: 'posts', label: 'Meus Artigos', icon: '📝' },
  { id: 'assistant', label: 'Assistente IA', icon: '🤖' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

function currentSection(): SectionId {
  if (typeof window !== 'undefined') {
    const h = window.location.hash.replace('#', '')
    if (SECTIONS.some(s => s.id === h)) return h as SectionId
  }
  return 'overview'
}

const emptyFormData = (): PostFormData => ({
  title: '',
  excerpt: '',
  content: '',
  status: 'draft',
  category: null,
  tags_input: '',
})

function StatSkeleton() {
  return (
    <div class="glass-card p-5 animate-pulse">
      <div class="w-10 h-10 rounded-xl bg-[var(--color-bg-card-border)] mb-3" />
      <div class="h-7 w-3/4 bg-[var(--color-bg-card-border)] rounded mb-1" />
      <div class="h-4 w-1/2 bg-[var(--color-bg-card-border)] rounded" />
    </div>
  )
}

function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const fromValue = from.current
    const delta = value - fromValue
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(fromValue + delta * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{display}</>
}

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [city, setCity] = useState<string>('São Paulo')

  const fetchByQuery = (query: string) => {
    setLoading(true)
    setError(false)
    api.get<{ data: WeatherData }>(`/integrations/weather?${query}`)
      .then(d => {
        setWeather(d.data)
        setCity(d.data.city || 'Sua localização')
        try { sessionStorage.setItem('dash_weather', JSON.stringify({ ...d.data, query, cached_at: new Date().toISOString() })) } catch {}
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const queryFor = (pref: LocationPref | null) => {
    if (pref?.granted && pref.lat != null && pref.lon != null) {
      return `lat=${pref.lat}&lon=${pref.lon}`
    }
    return `city=${encodeURIComponent(pref?.city || 'São Paulo')}`
  }

  const loadFromPref = (pref: LocationPref | null) => {
    const query = queryFor(pref)
    const cached = sessionStorage.getItem('dash_weather')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as WeatherData & { query?: string }
        if (parsed.temperature_c != null && parsed.query === query && Date.now() - (parsed.cached_at ? Date.parse(parsed.cached_at) : 0) < 3600000) {
          setWeather(parsed)
          setCity(parsed.city || 'São Paulo')
          setLoading(false)
          return
        }
      } catch {}
    }
    fetchByQuery(query)
  }

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      saveLocationPref({ granted: false, city: 'São Paulo' })
      loadFromPref(getLocationPref())
      return
    }
    setLoading(true)
    setError(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pref: LocationPref = {
          granted: true,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          updated_at: new Date().toISOString(),
        }
        saveLocationPref(pref)
        loadFromPref(pref)
      },
      () => {
        saveLocationPref({ granted: false, city: 'São Paulo' })
        loadFromPref(getLocationPref())
      },
      { timeout: 10000, maximumAge: 600000 }
    )
  }

  useEffect(() => {
    loadFromPref(getLocationPref())
  }, [])

  return (
    <div class="glass-card p-6 transition-all hover:shadow-glow h-full">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Clima do Café
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--color-text-muted)] flex-shrink-0">{city}</span>
          <button
            onClick={requestGeolocation}
            disabled={loading}
            class="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
            aria-label="Atualizar localização"
            title="Atualizar pela localização atual"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div class="space-y-2">
          <div class="h-8 w-1/4 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
          <div class="h-4 w-3/4 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
          <div class="h-4 w-1/2 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
        </div>
      ) : error ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">⛅️</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indisponível</span>
          <button
            onClick={requestGeolocation}
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Tentar
          </button>
        </div>
      ) : !weather || weather.temperature_c == null ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">⛅️</span>
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
          {weather.uv_index != null && (
            <p class="text-[10px] text-[var(--color-text-muted-dark)] mt-3">
              Índice UV {Math.round(weather.uv_index)} · {weather.source || 'wttr.in'}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function ExchangeWidget() {
  const [rates, setRates] = useState<ExchangeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchExchange = () => {
    setLoading(true)
    setError(false)

    const cached = sessionStorage.getItem('dash_exchange')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ExchangeData
        if (parsed.rates && parsed.rates.length > 0 && Date.now() - (parsed.cached_at ? Date.parse(parsed.cached_at) : 0) < 3600000) {
          setRates(parsed)
          setLoading(false)
          return
        }
      } catch {}
    }

    api.get<{ data: ExchangeData }>('/integrations/exchange?base=BRL')
      .then(d => {
        setRates(d.data)
        try { sessionStorage.setItem('dash_exchange', JSON.stringify({ ...d.data, cached_at: new Date().toISOString() })) } catch {}
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchExchange()
  }, [])

  return (
    <div class="glass-card p-6 transition-all hover:shadow-glow h-full">
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Câmbio ao Vivo
          </span>
          <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
            {rates ? `1 ${rates.base} para outras moedas` : 'Taxas de câmbio'}
          </p>
        </div>
        <span class="text-2xl" aria-hidden="true">💱</span>
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
      ) : error ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">💱</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indisponível</span>
          <button
            onClick={fetchExchange}
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Tentar
          </button>
        </div>
      ) : !rates || !rates.rates || rates.rates.length === 0 ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">💱</span>
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
  const [error, setError] = useState(false)

  const fetchHeadlines = () => {
    setLoading(true)
    setError(false)

    const cached = sessionStorage.getItem('dash_headlines')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { items: HeadlineItem[]; ts: number }
        if (parsed.items?.length > 0 && Date.now() - parsed.ts < 3600000) {
          setHeadlines(parsed.items)
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
        try { sessionStorage.setItem('dash_headlines', JSON.stringify({ items: combined, ts: Date.now() })) } catch {}
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchHeadlines()
  }, [])

  return (
    <div class="glass-card p-6 transition-all hover:shadow-glow h-full">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Manchetes do Dia
        </span>
        <span class="text-2xl" aria-hidden="true">📰</span>
      </div>

      {loading ? (
        <div class="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} class="h-4 bg-[var(--color-bg-card-border)] rounded last:w-2/3 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">📡</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indisponível</span>
          <button
            onClick={fetchHeadlines}
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Tentar
          </button>
        </div>
      ) : headlines.length === 0 ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">📡</span>
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

function CreatorAssistantWidget() {
  const [query, setQuery] = useState('')
  const [reply, setReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ available: boolean; providers: Record<string, boolean> } | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
  const [posts, setPosts] = useState<PostItem[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'tools'>('chat')

  useEffect(() => {
    api.get<{ data: { available: boolean; providers: Record<string, boolean> } }>('/ai/status')
      .then(d => setStatus(d.data))
      .catch(() => setStatus({ available: false, providers: {} }))
  }, [])

  const fetchUserPosts = async () => {
    setPostsLoading(true)
    try {
      const res = await api.get<PostsResponse>('/user/posts?per_page=20')
      setPosts(res.data.data)
    } catch {}
    finally { setPostsLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'tools') fetchUserPosts()
  }, [activeTab])

  const ask = (customQuery?: string) => {
    const q = customQuery || query
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setReply(null)
    api.get<{ data: { reply: string; provider: string; elapsed_ms: number } }>(`/ai/ask?q=${encodeURIComponent(q)}`)
      .then(d => {
        setReply(d.data.reply)
      })
      .catch(err => {
        setError(err?.message || 'Não foi possível conectar ao assistente de IA')
      })
      .finally(() => setLoading(false))
  }

  const aiAction = (action: string) => {
    if (!selectedPost) return
    const fullPrompt = `${action}\n\nTítulo: ${selectedPost.title}\n\nConteúdo:\n${selectedPost.excerpt || 'Sem resumo'}\n\nCategoria: ${selectedPost.category?.name || 'Sem categoria'}`
    ask(fullPrompt)
  }

  const actionPrompts: Record<string, string> = {
    translate: 'Traduza o artigo abaixo para inglês, mantendo o tom e a formatação em Markdown.',
    summarize: 'Crie um resumo executivo de 3-5 bullet points do artigo abaixo.',
    seo: 'Analise o artigo abaixo e sugira: 1) Meta title otimizado (até 60 chars), 2) Meta description (até 155 chars), 3) 5 palavras-chave SEO, 4) Sugestões de headings H2/H3.',
    improve: 'Melhore o texto abaixo: corrija gramática, torne mais fluido, adicione exemplos práticos, mantenha o tom autoral.',
    titles: 'Sugira 5 títulos alternativos atrativos e otimizados para SEO para o artigo abaixo.',
    outline: 'Crie um outline detalhado (H2, H3) para expandir este artigo em um guia completo.',
  }

  const actionLabels: Record<string, string> = {
    translate: 'Traduzir',
    summarize: 'Resumir',
    seo: 'SEO',
    improve: 'Melhorar',
    titles: 'Títulos',
    outline: 'Outline',
  }

  return (
    <div class="glass-card p-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Assistente do Criador
        </span>
        <span class="text-2xl" aria-hidden="true">🤖</span>
      </div>

      {!status?.available ? (
        <div class="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span>⚠️</span>
          <span>Assistente de IA não configurado no servidor</span>
        </div>
      ) : (
        <>
          <div class="flex gap-2 mb-4 border-b border-[var(--color-bg-card-border)] pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('chat')}
              class={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[var(--color-accent)] text-[var(--color-btn-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              class={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === 'tools'
                  ? 'bg-[var(--color-accent)] text-[var(--color-btn-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]'
              }`}
            >
              Ferramentas de Post
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div class="flex gap-2 mb-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  placeholder="Como preparar um bom café?"
                  class="flex-1 px-3 py-2 text-sm bg-[var(--color-bg-card-border)]/20 rounded-xl border border-[var(--color-bg-card-border)] focus:outline-none focus:border-[var(--color-accent)] text-[var(--color-text-primary)]"
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') ask() }}
                  aria-label="Pergunte ao assistente de IA"
                />
                <button
                  onClick={() => ask()}
                  disabled={loading || !query.trim()}
                  class="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 disabled:opacity-50 rounded-xl transition-colors border border-[var(--color-accent)]/30"
                >
                  {loading ? '…' : 'Enviar'}
                </button>
              </div>

              {loading && (
                <div class="space-y-2">
                  <div class="h-4 w-full bg-[var(--color-bg-card-border)] rounded animate-pulse" />
                  <div class="h-4 w-3/4 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
                  <div class="h-4 w-1/2 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
                </div>
              )}

              {error && (
                <div class="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {reply && !loading && !error && (
                <div class="prose prose-sm max-w-none text-[var(--color-text-primary)]">
                  {reply.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div class="mb-4">
                <label class="form-label mb-2 block">Selecionar artigo para trabalhar</label>
                {postsLoading ? (
                  <div class="h-10 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
                ) : posts.length === 0 ? (
                  <p class="text-sm text-[var(--color-text-muted)]">Nenhum artigo encontrado. Crie um em "Meus Artigos".</p>
                ) : (
                  <select
                    value={selectedPost?.id || ''}
                    onChange={e => {
                      const id = Number(e.target.value)
                      setSelectedPost(posts.find(p => p.id === id) || null)
                    }}
                    class="form-input form-select"
                  >
                    <option value="">Escolha um artigo...</option>
                    {posts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({statusLabels[p.status] || p.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedPost && (
                <div class="mb-4 p-3 rounded-xl bg-[var(--color-bg-card-border)]/30">
                  <div class="font-medium text-sm text-[var(--color-text-primary)]">{selectedPost.title}</div>
                  <div class="flex items-center gap-3 mt-1 text-[10px] text-[var(--color-text-muted)]">
                    <span>{statusLabels[selectedPost.status] || selectedPost.status}</span>
                    {selectedPost.category && <span>{selectedPost.category.name}</span>}
                    <span>⏱️ {selectedPost.reading_time || '?'} min</span>
                  </div>
                </div>
              )}

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.keys(actionPrompts).map(key => (
                  <button
                    key={key}
                    onClick={() => aiAction(actionPrompts[key])}
                    disabled={loading || !selectedPost}
                    class="px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-card-border)]/30 hover:bg-[var(--color-accent)]/20 disabled:opacity-50 rounded-xl transition-colors border border-[var(--color-bg-card-border)] text-left"
                  >
                    {actionLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>

              {loading && (
                <div class="mt-4 space-y-2">
                  <div class="h-4 w-full bg-[var(--color-bg-card-border)] rounded animate-pulse" />
                  <div class="h-4 w-3/4 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
                  <div class="h-4 w-1/2 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
                </div>
              )}

              {error && (
                <div class="mt-4 flex items-center gap-2 p-3 text-sm text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {reply && !loading && !error && (
                <div class="mt-4 prose prose-sm max-w-none text-[var(--color-text-primary)]">
                  {reply.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function DashboardContent() {
  const { user, logout } = useAuth()
  const [dash, setDash] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const vocab = getCurrentVocabulary()

  const [active, setActive] = useState<SectionId>(currentSection)
  const [visited, setVisited] = useState<Set<string>>(() => new Set([currentSection()]))
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    const sync = () => setHasDraft(Object.keys(readDraftList()).length > 0 || !!readDraft())
    sync()
    window.addEventListener('dash-draft-change', sync)
    return () => window.removeEventListener('dash-draft-change', sync)
  }, [])

  const goTo = (id: SectionId) => {
    setActive(id)
    setVisited(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    try { history.replaceState(null, '', `#${id}`) } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Keyboard shortcuts for power users
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      
      // Number keys 1-4 for sections
      const idx = parseInt(e.key, 10)
      if (idx >= 1 && idx <= SECTIONS.length) {
        e.preventDefault()
        goTo(SECTIONS[idx - 1].id)
        return
      }
      
      // Additional shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault()
            if (active === 'posts') {
              // Trigger new post creation - will be handled by PostManagementWidget
              window.dispatchEvent(new CustomEvent('dash:new-post'))
            }
            break
          case 'k':
            e.preventDefault()
            // Focus search if available
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
            searchInput?.focus()
            break
          case '/':
            e.preventDefault()
            const search = document.querySelector('input[type="search"]') as HTMLInputElement
            search?.focus()
            break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const fetchDashboard = () => {
    setLoading(true)
    setError(null)
    api.get<DashboardResponse>('/user/dashboard')
      .then(d => setDash(d))
      .catch(err => {
        setError(err?.message || 'Não foi possível carregar os dados do dashboard')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDashboard()

    const onFocus = () => fetchDashboard()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
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

  const level = s ? Math.min(10, 1 + Math.floor((s.total_grains || 0) / 300)) : 1
  const levelProgress = s ? ((s.total_grains || 0) % 300) / 300 * 100 : 0

  const quickActions = [
    { label: 'Mapa do Conhecimento', icon: '🗺️', href: '/mapa' },
    { label: 'Torrefação', icon: '☕', href: '/torrefacao' },
    { label: 'Biblioteca', icon: '📚', href: '/biblioteca' },
    { label: vocab.currency, icon: vocab.currency_icon, href: '/graos' },
    { label: 'Conquistas', icon: '🏆', href: '/conquistas' },
    { label: 'Missões', icon: '🎯', href: '/missoes' },
    { label: 'Trilhas', icon: '🎓', href: '/trilhas' },
  ]

  const firstName = user?.name?.split(' ')[0] || 'Explorador'

  const navItem = (sec: (typeof SECTIONS)[number], mobile = false) => (
    <button
      key={sec.id}
      type="button"
      onClick={() => goTo(sec.id)}
      aria-current={active === sec.id ? 'page' : undefined}
      class={mobile
        ? `flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full transition-all ${
            active === sec.id
              ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-[var(--color-btn-text)] shadow-[var(--shadow-glow)]'
              : 'text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] hover:text-[var(--color-accent)]'
          }`
        : `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            active === sec.id
              ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-[var(--color-btn-text)] shadow-[var(--shadow-glow)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]'
          }`}
    >
      <span class={mobile ? 'text-base' : 'text-lg w-7 text-center'} aria-hidden="true">{sec.icon}</span>
      <span class="flex-1 text-left text-sm font-semibold whitespace-nowrap">{sec.label}</span>
      {sec.id === 'posts' && hasDraft && (
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" aria-hidden="true" title="Rascunho salvo disponível" />
      )}
    </button>
  )

  return (
    <div class="space-y-5">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div class="flex items-center gap-4">
          <div class="relative flex-shrink-0">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] flex items-center justify-center text-3xl font-bold text-[var(--color-btn-text)] shadow-[0_0_30px_var(--color-accent-glow)]">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {s && s.daily_streak > 0 && (
              <span class="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shadow-md" title={`${s.daily_streak} dias seguidos`}>
                🔥
              </span>
            )}
          </div>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">
              Olá, <span class="gradient-text">{firstName}</span> 👋
            </h1>
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
              <span class="text-[var(--color-text-muted)]">·</span>
              <span class="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)]">
                Nível {level}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          class="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-[var(--color-bg-card-border)] transition-colors flex-shrink-0"
        >
          Sair
        </button>
      </div>

      {/* Global draft banner */}
      {hasDraft && (
        <div class="p-3 rounded-xl border border-amber-500/30 bg-amber-500/8 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
          <span class="flex-1 min-w-0 font-medium text-[var(--color-text-secondary)]">
            ✍️ Você tem um rascunho não salvo em seus artigos
          </span>
          <span class="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => goTo('posts')}
              class="px-3 py-1.5 text-xs font-semibold text-[var(--color-btn-text)] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-lg hover:opacity-90 transition-opacity"
            >
              Continuar escrevendo
            </button>
          </span>
        </div>
      )}

      {/* Mobile Navigation - Bottom Sheet */}
      <DashboardMobileNav
        sections={SECTIONS}
        activeSection={active}
        onSectionChange={goTo}
        hasDraft={hasDraft}
      />

      <div class="grid grid-cols-1 lg:grid-cols-[264px_1fr] gap-6 items-start">
        {/* Desktop sidebar */}
        <aside class="hidden lg:block lg:sticky lg:top-24">
          <nav class="glass-card p-3 space-y-1" aria-label="Seções do dashboard">
            {SECTIONS.map(sec => navItem(sec, false))}
          </nav>
          <div class="mt-4 glass-card p-4">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-xs font-semibold text-[var(--color-text-primary)]">
                Nível {level} · {!!s ? `${Math.round(levelProgress)}% para o próximo` : '…'}
              </span>
            </div>
            <div class="h-1.5 bg-[var(--color-bg-card-border)] rounded-full overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] transition-all duration-700"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p class="text-[10px] text-[var(--color-text-muted)] mt-3">
              Navegue rápido: <span class="font-mono">1</span>–<span class="font-mono">4</span> trocam de seção.
            </p>
          </div>
        </aside>

        {/* Content */}
        <main class="min-w-0">
          {visited.has('overview') && (
            <section class="dash-section" hidden={active !== 'overview'} aria-hidden={active !== 'overview'}>
              <div class="mb-5">
                <div class="section-label">Visão Geral</div>
                <h2 class="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">Sua evolução no café</h2>
              </div>

              {error ? (
                <div class="glass-card p-6 text-center mb-6">
                  <p class="text-sm text-[var(--color-text-secondary)] mb-3">{error}</p>
                  <button
                    onClick={fetchDashboard}
                    class="px-4 py-2 text-sm font-medium text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/10 rounded-xl transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                  {loading ? (
                    <>
                      {statCards.map((_, i) => (
                        <StatSkeleton key={i} />
                      ))}
                    </>
                  ) : (
                    statCards.map(stat => (
                      <div key={stat.label} class="glass-card p-5 text-center group transition-all hover:-translate-y-1">
                        <div class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                          style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}
                          role="img" aria-hidden="true">
                          {stat.icon}
                        </div>
                        <div class="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
                          <CountUp value={stat.value} />
                        </div>
                        <div class="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {stat.label}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            stroke="url(#progressGradient)"
                            stroke-width="8"
                            stroke-linecap="round"
                            stroke-dasharray={`${264 * (progressPct / 100)} 264`}
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dasharray 0.8s ease' }}
                          />
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stop-color="var(--color-accent)" />
                              <stop offset="100%" stop-color="var(--color-accent-secondary)" />
                            </linearGradient>
                          </defs>
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
                      <span class="mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        Nível {level} · Continue evoluindo
                      </span>
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
            </section>
          )}

          {visited.has('context') && (
            <section class="dash-section" hidden={active !== 'context'} aria-hidden={active !== 'context'}>
              <div class="mb-5">
                <div class="section-label">Contexto do Dia</div>
                <h2 class="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">Clima, câmbio e notícias</h2>
                <p class="text-sm text-[var(--color-text-muted)] mt-1">
                  Dados em tempo real integrados ao seu painel de acordo com o plano de APIs do projeto.
                </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <WeatherWidget />
                <ExchangeWidget />
                <HeadlinesWidget />
              </div>
            </section>
          )}

          {visited.has('posts') && (
            <section class="dash-section" hidden={active !== 'posts'} aria-hidden={active !== 'posts'}>
              <div class="mb-5">
                <div class="section-label">Meus Artigos</div>
                <h2 class="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">Gerencie seu conteúdo</h2>
                <p class="text-sm text-[var(--color-text-muted)] mt-1">
                  Crie, edite e publique seus artigos. Rascunhos são salvos automaticamente.
                </p>
              </div>
              <PostManagementWidget />
            </section>
          )}

          {visited.has('assistant') && (
            <section class="dash-section" hidden={active !== 'assistant'} aria-hidden={active !== 'assistant'}>
              <div class="mb-5">
                <div class="section-label">Assistente do Criador</div>
                <h2 class="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">Crie e refine com IA</h2>
                <p class="text-sm text-[var(--color-text-muted)] mt-1">
                  Pergunte, traduza, melhore ou gere títulos para seus artigos.
                </p>
              </div>
              <CreatorAssistantWidget />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <AuthPage><DashboardContent /></AuthPage>
}