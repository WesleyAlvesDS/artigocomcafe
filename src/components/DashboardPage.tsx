import { useState, useEffect } from 'react'
import type { ChangeEvent, KeyboardEvent, FormEvent } from 'react'
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
  const [error, setError] = useState(false)
  const [city, setCity] = useState<string>('S├úo Paulo')

  const fetchWeather = (targetCity: string) => {
    setLoading(true)
    setError(false)
    setCity(targetCity)
    const cached = sessionStorage.getItem('dash_weather')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as WeatherData
        if (parsed.temperature_c != null && Date.now() - (parsed.cached_at ? Date.parse(parsed.cached_at) : 0) < 3600000 && parsed.city === targetCity) {
          setWeather(parsed)
          setLoading(false)
          return
        }
      } catch {}
    }

    api.get<{ data: WeatherData }>(`/integrations/weather?city=${encodeURIComponent(targetCity)}`)
      .then(d => {
        setWeather(d.data)
        try { sessionStorage.setItem('dash_weather', JSON.stringify({ ...d.data, cached_at: new Date().toISOString() })) } catch {}
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      fetchWeather('S├úo Paulo')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        api.get<{ data: WeatherData }>(`/integrations/weather?lat=${latitude}&lon=${longitude}`)
          .then(d => {
            setWeather(d.data)
            setCity(d.data.city || 'Sua localiza├º├úo')
            try { sessionStorage.setItem('dash_weather', JSON.stringify({ ...d.data, cached_at: new Date().toISOString() })) } catch {}
          })
          .catch(() => {
            setError(true)
            fetchWeather('S├úo Paulo')
          })
          .finally(() => setLoading(false))
      },
      () => fetchWeather('S├úo Paulo'),
      { timeout: 10000 }
    )
  }

  useEffect(() => {
    const cached = sessionStorage.getItem('dash_weather')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as WeatherData
        if (parsed.temperature_c != null && Date.now() - (parsed.cached_at ? Date.parse(parsed.cached_at) : 0) < 3600000) {
          setWeather(parsed)
          setCity(parsed.city || 'S├úo Paulo')
          setLoading(false)
          return
        }
      } catch {}
    }
    requestGeolocation()
  }, [])

  return (
    <div class="glass-card p-6 transition-all">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Clima do Caf├®
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--color-text-muted)] flex-shrink-0">{city}</span>
          <button
            onClick={requestGeolocation}
            disabled={loading}
            class="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
            aria-label="Atualizar localiza├º├úo"
            title="Atualizar pela localiza├º├úo atual"
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
          <span class="text-2xl" aria-hidden="true">Ôÿü´©Å</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indispon├¡vel</span>
          <button
            onClick={requestGeolocation}
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Tentar
          </button>
        </div>
      ) : !weather || weather.temperature_c == null ? (
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">Ôÿü´©Å</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indispon├¡vel no momento</span>
        </div>
      ) : (
        <>
          <div class="flex items-center gap-4 mb-1">
            <span class="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {Math.round(weather.temperature_c)}┬░C
            </span>
            <span class="text-sm text-[var(--color-text-secondary)] capitalize">
              {weather.description || 'ÔÇö'}
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
                <div class="text-sm font-semibold text-[var(--color-text-primary)]">{Math.round(weather.feels_like_c)}┬░C</div>
                <div class="text-[10px] text-[var(--color-text-muted)]">Sensa├º├úo</div>
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
    <div class="glass-card p-6 transition-all">
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            C├ómbio ao Vivo
          </span>
          <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
            {rates ? `1 ${rates.base} para outras moedas` : 'Taxas de c├ómbio'}
          </p>
        </div>
            <span class="text-2xl" aria-hidden="true">­ƒÆ▒</span>
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
              <span class="text-2xl" aria-hidden="true">­ƒÆ▒</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indispon├¡vel</span>
          <button
            onClick={fetchExchange}
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Tentar
          </button>
        </div>
      ) : !rates || !rates.rates || rates.rates.length === 0 ? (
        <div class="flex items-center gap-3">
              <span class="text-2xl" aria-hidden="true">­ƒÆ▒</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indispon├¡vel no momento</span>
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
              atualizado h├í pouco ┬À {rates.source}
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
    <div class="glass-card p-6 transition-all">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Manchetes do Dia
        </span>
        <span class="text-2xl" aria-hidden="true">­ƒô░</span>
      </div>

      {loading ? (
        <div class="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} class="h-4 bg-[var(--color-bg-card-border)] rounded last:w-2/3 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div class="flex items-center gap-3">
            <span class="text-2xl" aria-hidden="true">­ƒô¡</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indispon├¡vel</span>
          <button
            onClick={fetchHeadlines}
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Tentar
          </button>
        </div>
      ) : headlines.length === 0 ? (
        <div class="flex items-center gap-3">
            <span class="text-2xl" aria-hidden="true">­ƒô¡</span>
          <span class="text-sm text-[var(--color-text-muted)]">Indispon├¡vel no momento</span>
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
                  <span class="font-medium">{h.source || 'ÔÇö'}</span>
                  {h.excerpt && <span>┬À</span>}
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

function PostManagementWidget() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [editingPost, setEditingPost] = useState<PostItem | null>(null)
  const [formData, setFormData] = useState<Partial<PostItem> & { content: string; tags_input: string }>({
    title: '',
    excerpt: '',
    content: '',
    status: 'draft',
    category: null,
    tags_input: '',
  })

  const fetchPosts = async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<PostsResponse>(`/user/posts?page=${p}&per_page=10`)
      setPosts(res.data.data)
      setTotalPages(res.data.meta.last_page)
      setPage(res.data.meta.current_page)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/user/posts', {
        ...formData,
        tags: formData.tags_input.split(',').map(t => t.trim()).filter(Boolean),
      })
      setShowCreate(false)
      setFormData({ title: '', excerpt: '', content: '', status: 'draft', category: null, tags_input: '' })
      fetchPosts(page)
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar post')
    }
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingPost) return
    setError(null)
    try {
      await api.put(`/user/posts/${editingPost.id}`, {
        ...formData,
        tags: formData.tags_input.split(',').map(t => t.trim()).filter(Boolean),
      })
      setEditingPost(null)
      setFormData({ title: '', excerpt: '', content: '', status: 'draft', category: null, tags_input: '' })
      fetchPosts(page)
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar post')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return
    try {
      await api.delete(`/user/posts/${id}`)
      fetchPosts(page)
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir post')
    }
  }

  const startEdit = (post: PostItem) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      content: '',
      status: post.status,
      category: post.category,
      tags_input: post.tags.map(t => t.name).join(', '),
    })
    setShowCreate(false)
  }

  const startCreate = () => {
    setEditingPost(null)
    setFormData({ title: '', excerpt: '', content: '', status: 'draft', category: null, tags_input: '' })
    setShowCreate(true)
  }

  const statusColors: Record<string, string> = {
    published: 'var(--color-accent)',
    draft: 'var(--color-text-muted)',
    review: '#f59e0b',
    scheduled: '#3b82f6',
    archived: '#6b7280',
  }

  const statusLabels: Record<string, string> = {
    published: 'Publicado',
    draft: 'Rascunho',
    review: 'Em Revis├úo',
    scheduled: 'Agendado',
    archived: 'Arquivado',
  }

  return (
    <div class="glass-card p-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Meus Artigos
        </span>
        <span class="text-2xl" aria-hidden="true">­ƒôØ</span>
      </div>

      {error && (
        <div class="mb-4 p-3 text-sm text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-500/30">
          {error}
        </div>
      )}

      {showCreate || editingPost ? (
        <form onSubmit={editingPost ? handleUpdate : handleCreate} class="space-y-3">
          <div>
            <label class="form-label">T├¡tulo</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              class="form-input"
              placeholder="T├¡tulo do artigo"
            />
          </div>
          <div>
            <label class="form-label">Resumo</label>
            <textarea
              value={formData.excerpt || ''}
              onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
              class="form-input form-textarea"
              placeholder="Resumo do artigo (opcional)"
              rows={3}
            />
          </div>
          <div>
            <label class="form-label">Conte├║do (Markdown)</label>
            <textarea
              value={formData.content || ''}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              class="form-input form-textarea font-mono text-sm"
              placeholder="Escreva seu artigo em Markdown..."
              rows={8}
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select
                value={formData.status || 'draft'}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                class="form-input form-select"
              >
                <option value="draft">Rascunho</option>
                <option value="review">Em Revis├úo</option>
                <option value="scheduled">Agendado</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <input
                type="text"
                value={formData.category?.name || ''}
                onChange={e => setFormData({ ...formData, category: { name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') } })}
                class="form-input"
                placeholder="Categoria"
              />
            </div>
          </div>
          <div>
            <label class="form-label">Tags (separadas por v├¡rgula)</label>
            <input
              type="text"
              value={formData.tags_input || ''}
              onChange={e => setFormData({ ...formData, tags_input: e.target.value })}
              class="form-input"
              placeholder="caf├®, torrefa├º├úo, m├®todo, etc."
            />
          </div>
          <div class="flex gap-2">
            <button type="submit" class="btn-primary form-submit flex-1">
              {editingPost ? 'Salvar Altera├º├Áes' : 'Criar Artigo'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setEditingPost(null); }}
              class="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-xl hover:bg-[var(--color-bg-card-hover)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          {loading ? (
            <div class="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} class="h-20 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div class="text-center py-8">
              <span class="text-3xl mb-3 block" aria-hidden="true">­ƒôä</span>
              <p class="text-sm text-[var(--color-text-muted)] mb-4">Nenhum artigo ainda</p>
              <button onClick={startCreate} class="btn-primary form-submit">
                Criar Primeiro Artigo
              </button>
            </div>
          ) : (
            <>
              <div class="divide-y divide-[var(--color-bg-card-border)]">
                {posts.map(post => (
                  <div key={post.id} class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="font-medium text-[var(--color-text-primary)] line-clamp-1">{post.title}</span>
                        <span class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${statusColors[post.status] || 'var(--color-text-muted)'}22`, color: statusColors[post.status] || 'var(--color-text-muted)' }}>
                          {statusLabels[post.status] || post.status}
                        </span>
                        {post.featured_image && <span class="text-[10px] text-[var(--color-text-muted)]" aria-hidden="true">­ƒû╝´©Å</span>}
                      </div>
                      <div class="flex items-center gap-3 text-[10px] text-[var(--color-text-muted-dark)]">
                        <span>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                        {post.category && <span>┬À {post.category.name}</span>}
                        {post.reading_time && <span>ÔÅ▒´©Å {post.reading_time} min</span>}
                        {post.tags.length > 0 && <span>­ƒÅÀ´©Å {post.tags.slice(0, 3).map(t => t.name).join(', ')}{post.tags.length > 3 ? 'ÔÇª' : ''}</span>}
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        class="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                        title="Ver no site"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                      <button
                        onClick={() => startEdit(post)}
                        class="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                        title="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        class="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Excluir"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div class="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => fetchPosts(page - 1)}
                    disabled={page === 1}
                    class="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span class="text-sm text-[var(--color-text-muted)]">
                    P├ígina {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => fetchPosts(page + 1)}
                    disabled={page === totalPages}
                    class="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Pr├│xima
                  </button>
                </div>
              )}

              <button onClick={startCreate} class="w-full mt-4 btn-primary form-submit">
                + Novo Artigo
              </button>
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

  const fetchDashboard = () => {
    setLoading(true)
    setError(null)
    api.get<DashboardResponse>('/user/dashboard')
      .then(d => setDash(d))
      .catch(err => {
        setError(err?.message || 'N├úo foi poss├¡vel carregar os dados do dashboard')
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
    { label: 'Artigos Lidos', value: s?.articles_read ?? 0, icon: '­ƒôû' },
    { label: 'Horas de Leitura', value: s?.reading_time_hours ?? 0, icon: 'ÔÅ▒´©Å' },
    { label: 'Trilhas Completas', value: s?.trails_completed ?? 0, icon: '­ƒÄ»' },
    { label: 'Conquistas', value: s?.achievements_unlocked ?? 0, icon: '­ƒÅå' },
    { label: 'Cole├º├Áes', value: s?.collections_count ?? 0, icon: '­ƒôÜ' },
    { label: 'Categorias', value: s?.categories_explored ?? 0, icon: '­ƒîì' },
    { label: 'Dias Seguidos', value: s?.daily_streak ?? 0, icon: '­ƒöÑ' },
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
    { label: 'Mapa do Conhecimento', icon: '­ƒù║´©Å', href: '/mapa' },
    { label: 'Torrefa├º├úo', icon: 'Ôÿò', href: '/torrefacao' },
    { label: 'Biblioteca', icon: '­ƒôÜ', href: '/biblioteca' },
    { label: vocab.currency, icon: vocab.currency_icon, href: '/graos' },
    { label: 'Conquistas', icon: '­ƒÅå', href: '/conquistas' },
    { label: 'Miss├Áes', icon: '­ƒÄ»', href: '/missoes' },
    { label: 'Trilhas', icon: '­ƒÄô', href: '/trilhas' },
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
              <span class="text-sm text-[var(--color-text-secondary)]">@{user?.username || 'ÔÇö'}</span>
              {s && s.daily_streak > 0 && (
                <>
                  <span class="text-[var(--color-text-muted)]">┬À</span>
                  <span class="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                    ­ƒöÑ {s.daily_streak} dias seguidos
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
        <div class="section-label mb-3">Sua Evolu├º├úo</div>
        {error ? (
          <div class="glass-card p-6 text-center">
            <p class="text-sm text-[var(--color-text-secondary)] mb-3">{error}</p>
            <button
              onClick={fetchDashboard}
              class="px-4 py-2 text-sm font-medium text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/10 rounded-xl transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
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
                  style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}
                  role="img" aria-hidden="true">
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
        )}
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
                  <div class="text-[10px] text-[var(--color-text-muted)]">Artigos conclu├¡dos</div>
                </div>
                <div>
                  <div class="text-lg font-bold text-[var(--color-text-primary)]">{s?.trails_completed || 0}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)]">Trilhas conclu├¡das</div>
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

      {/* Creator Assistant (AI) */}
      <div data-reveal>
        <div class="section-label mb-2">Assistente do Criador</div>
        <p class="text-sm text-[var(--color-text-muted)] mb-4">
          Pergunte ao assistente de IA para sugest├Áes de t├¡tulos, resumos ou d├║vidas sobre caf├®.
        </p>
        <CreatorAssistantWidget />
      </div>

      {/* Post Management */}
      <div data-reveal>
        <div class="section-label mb-2">Meus Artigos</div>
        <p class="text-sm text-[var(--color-text-muted)] mb-4">
          Gerencie seus artigos: crie, edite, publique e organize seu conte├║do.
        </p>
        <PostManagementWidget />
      </div>
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
        setError(err?.message || 'N├úo foi poss├¡vel conectar ao assistente de IA')
      })
      .finally(() => setLoading(false))
  }

  const aiAction = (action: string, prompt: string) => {
    if (!selectedPost) return
    const fullPrompt = `${action}\n\nT├¡tulo: ${selectedPost.title}\n\nConte├║do:\n${selectedPost.excerpt || 'Sem resumo'}\n\nCategoria: ${selectedPost.category?.name || 'Sem categoria'}`
    ask(fullPrompt)
  }

  const actionPrompts = {
    translate: 'Traduza o artigo abaixo para ingl├¬s, mantendo o tom e a formata├º├úo em Markdown.',
    summarize: 'Crie um resumo executivo de 3-5 bullet points do artigo abaixo.',
    seo: 'Analise o artigo abaixo e sugira: 1) Meta title otimizado (at├® 60 chars), 2) Meta description (at├® 155 chars), 3) 5 palavras-chave SEO, 4) Sugest├Áes de headings H2/H3.',
    improve: 'Melhore o texto abaixo: corrija gram├ítica, torne mais fluido, adicione exemplos pr├íticos, mantenha o tom autoral.',
    titles: 'Sugira 5 t├¡tulos alternativos atrativos e otimizados para SEO para o artigo abaixo.',
    outline: 'Crie um outline detalhado (H2, H3) para expandir este artigo em um guia completo.',
  }

  return (
    <div class="glass-card p-6">
      <div class="flex items-center justify-between mb-4">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Assistente do Criador
        </span>
        <span class="text-2xl" aria-hidden="true">­ƒñû</span>
      </div>

      {!status?.available ? (
        <div class="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span>ÔÜá´©Å</span>
          <span>Assistente de IA n├úo configurado no servidor</span>
        </div>
      ) : (
        <>
          <div class="flex gap-2 mb-4 border-b border-[var(--color-bg-card-border)] pb-3">
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
                  placeholder="Como preparar um bom caf├®?"
                  class="flex-1 px-3 py-2 text-sm bg-[var(--color-bg-card-border)]/20 rounded-xl border border-[var(--color-bg-card-border)] focus:outline-none focus:border-[var(--color-accent)] text-[var(--color-text-primary)]"
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') ask() }}
                  aria-label="Pergunte ao assistente de IA"
                />
                <button
                  onClick={ask}
                  disabled={loading || !query.trim()}
                  class="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 disabled:opacity-50 rounded-xl transition-colors border border-[var(--color-accent)]/30"
                >
                  {loading ? 'ÔÇª' : 'Enviar'}
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
                  <span>ÔÜá´©Å</span>
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
                    <span>ÔÅ▒´©Å {selectedPost.reading_time || '?'} min</span>
                  </div>
                </div>
              )}

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(actionPrompts).map(([key, prompt]) => (
                  <button
                    key={key}
                    onClick={() => aiAction(prompt, prompt)}
                    disabled={loading || !selectedPost}
                    class="px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-card-border)]/30 hover:bg-[var(--color-accent)]/20 disabled:opacity-50 rounded-xl transition-colors border border-[var(--color-bg-card-border)] text-left"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
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
                  <span>ÔÜá´©Å</span>
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

const statusLabels: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  review: 'Em Revis├úo',
  scheduled: 'Agendado',
  archived: 'Arquivado',
}

export default function DashboardPage() {
  return <AuthPage><DashboardContent /></AuthPage>
}
