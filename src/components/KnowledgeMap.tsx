import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../lib/api'
import AuthPage from './AuthPage'

interface KnowledgeMapData {
  categories: CategoryNode[]
  tags: TagNode[]
  connections: Connection[]
  evolution: EvolutionData
}

interface CategoryNode {
  id: number; name: string; slug: string; icon: string | null; color: string | null
  total_articles: number; completed_articles: number; progress_percent: number
  articles: ArticleNode[]
}

interface ArticleNode {
  id: number; title: string; slug: string; reading_time: string
  tags: { id: number; name: string; slug: string }[]
}

interface TagNode {
  id: number; name: string; slug: string; count: number
}

interface Connection {
  from: number; to: number; strength: number
}

interface EvolutionData {
  articles_read: number; reading_time_hours: number; trails_completed: number
  achievements_unlocked: number; daily_streak: number; categories_explored: number
  categories_total: number; total_grains: number
}

const DEFAULT_ICONS: Record<string, string> = {
  tecnologia: '💻', ia: '🤖', programacao: '👨‍💻', negocios: '💼',
  empreendedorismo: '🚀', produtividade: '⚡', automoveis: '🚗', casa: '🏠',
  saude: '💚', bemestar: '🧘', educacao: '📚', carreira: '🎯',
  curiosidades: '🔍', ciencia: '🔬', financas: '💰', reviews: '⭐',
  guias: '📖', tutoriais: '📝', musica: '🎵', games: '🎮',
  natureza: '🌿', espaco: '🌌', livros: '📕'
}

function colorFromSlug(slug: string): string {
  const colors = ['#d4a373', '#c68a53', '#b87333', '#a0522d', '#8b5a2b', '#96783f', '#c08552', '#d2a679', '#a9714b', '#b8860b']
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = ((hash << 5) - hash) + slug.charCodeAt(i)
  return colors[Math.abs(hash) % colors.length]
}

function MapContent() {
  const [data, setData] = useState<KnowledgeMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const load = () => {
    setLoading(true)
    setError(false)
    api.get<KnowledgeMapData>('/user/knowledge-map')
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    setScale(prev => Math.max(0.4, Math.min(2.5, prev * delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    setSelectedCategory(null)
  }

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="relative w-16 h-16 mx-auto mb-6">
            <div class="absolute inset-0 rounded-full border-2 border-[var(--color-accent)] opacity-20 animate-ping" />
            <div class="w-16 h-16 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
          <p class="text-[var(--color-text-muted)] text-sm font-medium">Construindo seu mapa...</p>
          <p class="text-[var(--color-text-muted)] text-xs mt-1 opacity-60">Isso pode levar alguns segundos</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center glass-card p-8 max-w-md">
          <div class="text-5xl mb-4">🗺️</div>
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">Mapa temporariamente indisponível</h2>
          <p class="text-[var(--color-text-secondary)] mb-6">Ocorreu um erro ao carregar seu Mapa do Conhecimento. Tente novamente em instantes.</p>
          <button onClick={load} class="btn-primary">Tentar novamente</button>
        </div>
      </div>
    )
  }

  const { categories, evolution } = data
  const hasData = categories.some(c => c.completed_articles > 0)

  if (!hasData) {
    return (
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center glass-card p-8 max-w-md">
          <div class="text-5xl mb-4">🌱</div>
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">Seu mapa está começando</h2>
          <p class="text-[var(--color-text-secondary)] mb-2">
            Complete a leitura de artigos para desbloquear novos caminhos no seu Mapa do Conhecimento.
          </p>
          <p class="text-sm text-[var(--color-text-muted)] mb-6">
            {categories.filter(c => c.total_articles > 0).length} temas disponíveis para explorar
          </p>
          <a href="/blog" class="btn-primary">Explorar Artigos</a>
        </div>
      </div>
    )
  }

  const selected = selectedCategory ? categories.find(c => c.id === selectedCategory) : null

  const viewW = 1200, viewH = 800
  const centerX = viewW / 2, centerY = viewH / 2
  const radius = Math.min(viewW, viewH) * 0.32
  const activeCats = categories.filter(c => c.total_articles > 0)
  const catCount = activeCats.length

  const positionedCats = activeCats.map((cat, i) => {
    const angle = (i / Math.max(1, catCount)) * Math.PI * 2 - Math.PI / 2
    return {
      ...cat,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      angle,
      catColor: cat.color || colorFromSlug(cat.slug),
      nodeRadius: 28 + (cat.completed_articles / Math.max(1, cat.total_articles)) * 22
    }
  })

  const connectionLines = data.connections
    .map(c => {
      const from = positionedCats.find(p => p.id === c.from)
      const to = positionedCats.find(p => p.id === c.to)
      return from && to ? { x1: from.x, y1: from.y, x2: to.x, y2: to.y, strength: c.strength, key: `${c.from}-${c.to}` } : null
    })
    .filter(Boolean)

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Mapa do Conhecimento</h1>
          <p class="text-sm text-[var(--color-text-muted)]">
            {evolution.categories_explored} de {evolution.categories_total} categorias exploradas · {evolution.articles_read} artigos lidos · {evolution.reading_time_hours}h de leitura
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button onClick={resetView} class="btn-ghost text-sm px-3 py-1.5">Centralizar</button>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        class="relative glass-card overflow-hidden"
        style={{ height: 'min(70vh, 600px)', cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          class="w-full h-full"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.15" />
              <stop offset="60%" stopColor="var(--color-accent)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`} style={{ transformOrigin: `${centerX}px ${centerY}px` }}>
            <circle cx={centerX} cy={centerY} r={radius * 2} fill="url(#centerGlow)" />

            {connectionLines.map(line => line && (
              <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke="var(--color-accent)" strokeOpacity={0.15 + line.strength * 0.06}
                strokeWidth={1.5 + line.strength * 0.7} strokeDasharray="8,6" strokeLinecap="round"
              >
                <animate attributeName="strokeDashoffset" from="0" to="28" dur="4s" repeatCount="indefinite" />
              </line>
            ))}

            <circle cx={centerX} cy={centerY} r={16} fill="var(--color-accent)" opacity={0.2}>
              <animate attributeName="r" values="12;20;12" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx={centerX} cy={centerY} r={7} fill="var(--color-accent)" filter="url(#glow)" />

            {positionedCats.map(cat => {
              const isSelected = selectedCategory === cat.id
              const isHovered = hoveredNode === cat.id
              const icon = cat.icon || DEFAULT_ICONS[cat.slug] || '📂'
              const labelX = cat.x + Math.cos(cat.angle) * (cat.nodeRadius + 24)
              const labelY = cat.y + Math.sin(cat.angle) * (cat.nodeRadius + 24)
              const progressCircumference = (cat.progress_percent / 100) * Math.PI * 2 * (cat.nodeRadius + 5)
              const totalCircumference = Math.PI * 2 * (cat.nodeRadius + 5)

              return (
                <g key={cat.id} className="cursor-pointer" style={{ transition: 'all 0.3s ease' }}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  onMouseEnter={() => setHoveredNode(cat.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {(isSelected || isHovered) && (
                    <circle cx={cat.x} cy={cat.y} r={cat.nodeRadius + 16} fill="url(#nodeGlow)" />
                  )}

                  {isSelected && (
                    <circle cx={cat.x} cy={cat.y} r={cat.nodeRadius + 14} fill="none" stroke={cat.catColor}
                      strokeWidth="3" opacity={0.6}>
                      <animate attributeName="r" values={`${cat.nodeRadius + 12};${cat.nodeRadius + 18};${cat.nodeRadius + 12}`} dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0.25;0.6" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}

                  <circle cx={cat.x} cy={cat.y} r={cat.nodeRadius}
                    fill={cat.completed_articles > 0 ? `${cat.catColor}30` : 'var(--color-bg-card)'}
                    stroke={isSelected ? cat.catColor : (cat.completed_articles > 0 ? `${cat.catColor}70` : 'var(--color-bg-card-border)')}
                    strokeWidth={isSelected ? 3.5 : 2}
                    style={{ transition: 'all 0.3s ease' }}
                  />

                  {cat.completed_articles > 0 && (
                    <circle cx={cat.x} cy={cat.y} r={cat.nodeRadius + 5} fill="none"
                      stroke={cat.catColor} strokeWidth="2.5" opacity={0.75}
                      strokeDasharray={`${progressCircumference} ${totalCircumference}`}
                      strokeLinecap="round"
                      transform={`rotate(-90, ${cat.x}, ${cat.y})`}
                    />
                  )}

                  <text x={cat.x} y={cat.y + 6} textAnchor="middle" fontSize="18" fill="var(--color-text-primary)" style={{ transition: 'all 0.3s ease' }}>
                    {icon}
                  </text>

                  <text x={labelX} y={labelY} textAnchor="middle" fontSize="12"
                    fill={isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'}
                    fontWeight={isSelected ? '700' : '600'}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    {cat.name}
                  </text>

                  {cat.completed_articles > 0 && (
                    <g>
                      <rect x={cat.x + cat.nodeRadius - 10} y={cat.y - cat.nodeRadius - 8} width={20} height={20} rx="10" fill={cat.catColor} filter="url(#glow)" />
                      <text x={cat.x + cat.nodeRadius} y={cat.y - cat.nodeRadius + 5} textAnchor="middle" fontSize="10" fill="#1a1209" fontWeight="700">
                        {cat.completed_articles}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {selected && selected.completed_articles > 0 && (
          <div className="absolute top-4 right-4 bottom-4 w-80 glass-card p-5 overflow-y-auto animate-slide-up"
            style={{ maxHeight: 'calc(100% - 2rem)' }}
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-[var(--color-text-primary)] text-sm flex items-center gap-2">
                <span class="text-lg">{selected.icon || DEFAULT_ICONS[selected.slug] || '📂'}</span>
                {selected.name}
              </h3>
              <button onClick={() => setSelectedCategory(null)}
                class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] transition-colors text-lg">✕</button>
            </div>
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 h-2 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700"
                  style={{ width: `${selected.progress_percent}%`, background: selected.color || 'var(--color-accent)' }} />
              </div>
              <span class="text-xs font-mono text-[var(--color-text-muted)] font-bold">{selected.progress_percent}%</span>
            </div>
            <p class="text-xs text-[var(--color-text-muted)] mb-4">{selected.completed_articles} de {selected.total_articles} artigos lidos</p>
            <div class="space-y-2">
              {selected.articles.map(article => (
                <a key={article.id} href={`/blog/${article.slug}`}
                  class="block p-3 rounded-xl hover:bg-[var(--color-bg-card)] transition-all group">
                  <p class="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">{article.title}</p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span class="text-xs text-[var(--color-text-muted)]">{article.reading_time} min</span>
                    {article.tags.slice(0, 2).map(tag => (
                      <span key={tag.id} class="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg-card)] text-[var(--color-text-muted)]">#{tag.name}</span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
            <a href={`/blog?categoria=${selected.slug}`} class="block mt-4 text-center text-xs font-medium text-[var(--color-accent)] hover:underline">
              Ver todos os artigos de {selected.name} →
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Artigos Lidos', value: evolution.articles_read, icon: '📖', color: 'var(--color-accent)' },
          { label: 'Horas de Leitura', value: evolution.reading_time_hours, icon: '⏱️', color: '#c68a53' },
          { label: 'Categorias', value: evolution.categories_explored, icon: '🌍', color: '#b87333' },
          { label: 'Dias Seguidos', value: evolution.daily_streak, icon: '🔥', color: '#d4a373' },
        ].map(stat => (
          <div key={stat.label} class="glass-card p-4 text-center group hover:scale-[1.02] transition-transform">
            <div class="text-2xl mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
            <div class="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{stat.value}</div>
            <div class="text-xs text-[var(--color-text-muted)]">{stat.label}</div>
            <div class="mt-2 h-1 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (stat.value / Math.max(1, stat.value + 5)) * 100)}%`, background: stat.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div class="flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full border border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)]" /> Não explorado</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style={{ background: 'var(--color-accent)', opacity: 0.4 }} /> Em progresso</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style={{ background: 'var(--color-accent)' }} /> Completo</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-0.5 bg-[var(--color-accent)] opacity-40" /> Conexão</span>
        <span class="text-[var(--color-text-secondary)]">Clique em um tema para ver os artigos</span>
      </div>
    </div>
  )
}

export default function KnowledgeMap() {
  return (
    <AuthPage>
      <MapContent />
    </AuthPage>
  )
}
