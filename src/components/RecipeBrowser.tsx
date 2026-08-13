// Navegador de receitas 100% client-side.
// O site é estático (Astro): filtros via query string NUNCA re-renderizam no
// servidor. Este island busca a lista completa de receitas via API e aplica
// busca/filtros/paginação no navegador, sincronizando a URL (pushState) para
// compartilhamento. Os cards SSG são usados como estado inicial (sem flash).
import { useEffect, useMemo, useState } from 'react'
import type { Recipe, RecipeCategory, RecipeListResponse } from '../lib/types'

const API_URL = '/api-proxy.php'
const PER_PAGE = 12

const DIFF_LABEL: Record<string, string> = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' }
const DIFF_COLOR: Record<string, string> = { facil: '#22c55e', media: '#f59e0b', dificil: '#ef4444' }

function normCover(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http') || url.startsWith('/') ? url : `/${url}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function readParams(): { search: string; category: string; tag: string; difficulty: string; timeMax: string; page: number } {
  if (typeof window === 'undefined') return { search: '', category: '', tag: '', difficulty: '', timeMax: '', page: 1 }
  const qs = new URLSearchParams(window.location.search)
  return {
    search: qs.get('busca') || '',
    category: qs.get('categoria') || '',
    tag: qs.get('tag') || '',
    difficulty: qs.get('dificuldade') || '',
    timeMax: qs.get('tempo_max') || '',
    page: Math.max(1, Number(qs.get('page')) || 1),
  }
}

function RecipeCardView({ recipe }: { recipe: Recipe }) {
  return (
    <a href={`/receitas/${recipe.slug}`} class="recipe-card glass-card">
      <div class="recipe-image-wrapper">
        <img
          src={recipe.cover_image || '/images/recipe-default.svg'}
          alt={recipe.title}
          class="recipe-image"
          loading="lazy"
          decoding="async"
        />
        <span class="recipe-badge-difficulty" style={{ background: DIFF_COLOR[recipe.difficulty] || '#8b5a2b' }}>
          {DIFF_LABEL[recipe.difficulty] || recipe.difficulty}
        </span>
      </div>
      <div class="recipe-body">
        <div class="recipe-meta">
          {recipe.category && (
            <span class="recipe-category" style={{ color: recipe.category.color || 'var(--color-accent)' }}>
              {recipe.category.icon && <span aria-hidden="true">{recipe.category.icon}</span>}
              {recipe.category.name}
            </span>
          )}
          <span class="recipe-date">{formatDate(recipe.published_at)}</span>
        </div>
        <h2 class="recipe-title">{recipe.title}</h2>
        <p class="recipe-excerpt">{recipe.excerpt}</p>
        <div class="recipe-footer">
          <div class="recipe-stats">
            {recipe.prep_time_minutes != null && (
              <span class="recipe-stat">⏱ {recipe.prep_time_minutes} min</span>
            )}
            {recipe.servings != null && (
              <span class="recipe-stat">👥 {recipe.servings} porções</span>
            )}
          </div>
          <span class="recipe-read-more">
            Ver receita
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  )
}

function buildQuery(params: { search: string; category: string; tag: string; difficulty: string; timeMax: string; page: number }): string {
  const qs = new URLSearchParams()
  if (params.search) qs.set('busca', params.search)
  if (params.category) qs.set('categoria', params.category)
  if (params.tag) qs.set('tag', params.tag)
  if (params.difficulty) qs.set('dificuldade', params.difficulty)
  if (params.timeMax) qs.set('tempo_max', params.timeMax)
  if (params.page > 1) qs.set('page', String(params.page))
  const q = qs.toString()
  return q ? `/receitas?${q}` : '/receitas'
}

export default function RecipeBrowser({ categories, initialRecipes }: {
  categories: RecipeCategory[]
  initialRecipes: Recipe[]
}) {
  // Estado inicial VAZIO (igual ao SSR): o build SSG sempre gera a página sem
  // query params. Aplicar a URL aqui causaria mismatch de hydration (React
  // #418) quando o usuário chega via /receitas?busca=... — os parâmetros são
  // aplicados num efeito APÓS a hidratação.
  const [all, setAll] = useState<Recipe[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [timeMax, setTimeMax] = useState('')
  const [page, setPage] = useState(1)

  // Aplica filtros vindos da URL somente depois da hidratação (sem mismatch).
  useEffect(() => {
    const p = readParams()
    setSearch(p.search)
    setCategory(p.category)
    setTag(p.tag)
    setDifficulty(p.difficulty)
    setTimeMax(p.timeMax)
    setPage(p.page)
  }, [])

  // Carrega a lista completa em background; enquanto isso usa os cards SSG.
  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/recipes?per_page=1000`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: RecipeListResponse) => {
        if (cancelled) return
        setAll(json.data.map(r => ({ ...r, cover_image: normCover(r.cover_image) })))
      })
      .catch(() => { /* mantém lista SSG */ })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  // Sincroniza a URL sem recarregar a página (compartilhável, botão voltar ok).
  useEffect(() => {
    if (typeof history === 'undefined') return
    history.replaceState(null, '', buildQuery({ search, category, tag, difficulty, timeMax, page }))
  }, [search, category, tag, difficulty, timeMax, page])

  const filtered = useMemo(() => {
    let list = all.length > 0 ? all : initialRecipes
    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter(r =>
        (r.title || '').toLowerCase().includes(term) ||
        (r.excerpt || '').toLowerCase().includes(term)
      )
    }
    if (category) list = list.filter(r => r.category?.slug === category)
    if (tag) list = list.filter(r => (r.tags || []).some(t => t.slug === tag))
    if (difficulty) list = list.filter(r => r.difficulty === difficulty)
    if (timeMax) {
      const max = Number(timeMax)
      list = list.filter(r => (r.prep_time_minutes ?? Infinity) <= max)
    }
    return list
  }, [all, initialRecipes, search, category, tag, difficulty, timeMax])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageRecipes = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function goToPage(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasActiveFilters = Boolean(tag || difficulty || timeMax)

  return (
    <>
      <form class="recipes-filters" method="GET" action="/receitas" onSubmit={e => e.preventDefault()} data-recipes-browser>
        <div class="search-form">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            name="busca"
            value={search}
            placeholder="Buscar receitas…"
            class="search-input"
            aria-label="Buscar receitas"
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <div class="filters-row">
          <div class="categories-filter">
            <button type="button" class={`cat-chip ${!category && !tag ? 'active' : ''}`} onClick={() => { setCategory(''); setTag(''); setPage(1) }}>
              Todas
            </button>
            {categories.slice(0, 12).map(cat => (
              <button
                type="button"
                key={cat.slug}
                class={`cat-chip ${category === cat.slug ? 'active' : ''}`}
                onClick={() => { setCategory(cat.slug); setPage(1) }}
              >
                {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
                {cat.name}
                <span class="cat-count">{cat.recipes_count}</span>
              </button>
            ))}
          </div>

          <div class="quick-filters">
            <select
              name="dificuldade"
              class="filter-select"
              aria-label="Filtrar por dificuldade"
              value={difficulty}
              onChange={e => { setDifficulty(e.target.value); setPage(1) }}
            >
              <option value="">Todas as dificuldades</option>
              <option value="facil">Fácil</option>
              <option value="media">Média</option>
              <option value="dificil">Difícil</option>
            </select>
            <select
              name="tempo_max"
              class="filter-select"
              aria-label="Filtrar por tempo máximo"
              value={timeMax}
              onChange={e => { setTimeMax(e.target.value); setPage(1) }}
            >
              <option value="">Qualquer tempo</option>
              <option value="15">Até 15 min</option>
              <option value="30">Até 30 min</option>
              <option value="60">Até 1 hora</option>
              <option value="120">Até 2 horas</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div class="active-filters">
            {tag && (
              <span class="filter-tag">
                Tag: #{tag}
                <button type="button" class="remove-filter" aria-label="Remover filtro de tag" onClick={() => { setTag(''); setPage(1) }}>×</button>
              </span>
            )}
            {difficulty && (
              <span class="filter-tag">
                Dificuldade: {DIFF_LABEL[difficulty] || difficulty}
                <button type="button" class="remove-filter" aria-label="Remover filtro de dificuldade" onClick={() => { setDifficulty(''); setPage(1) }}>×</button>
              </span>
            )}
            {timeMax && (
              <span class="filter-tag">
                Tempo: até {timeMax} min
                <button type="button" class="remove-filter" aria-label="Remover filtro de tempo" onClick={() => { setTimeMax(''); setPage(1) }}>×</button>
              </span>
            )}
            <button type="button" class="clear-filters" onClick={() => { setSearch(''); setCategory(''); setTag(''); setDifficulty(''); setTimeMax(''); setPage(1) }}>
              Limpar todos
            </button>
          </div>
        )}
      </form>

      <div class="recipes-results-info">
        <span>{loaded ? `${filtered.length} ${filtered.length === 1 ? 'receita' : 'receitas'}` : 'Carregando receitas…'}</span>
        {!loaded && <span class="results-spinner" aria-hidden="true" />}
      </div>

      {pageRecipes.length > 0 ? (
        <>
          <div class="recipes-grid">
            {pageRecipes.map((recipe, i) => (
              <RecipeCardView key={recipe.id || recipe.slug} recipe={recipe} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav class="pagination" aria-label="Paginação">
              {safePage > 1 && (
                <button type="button" class="page-btn" aria-label="Página anterior" onClick={() => goToPage(safePage - 1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
                  Anterior
                </button>
              )}
              <div class="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    type="button"
                    key={p}
                    class={`page-number ${p === safePage ? 'active' : ''}`}
                    aria-current={p === safePage ? 'page' : undefined}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {safePage < totalPages && (
                <button type="button" class="page-btn" aria-label="Próxima página" onClick={() => goToPage(safePage + 1)}>
                  Próximo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
            </nav>
          )}
        </>
      ) : (
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h2 class="empty-title">Nenhuma receita encontrada</h2>
          <p class="empty-desc">{search ? `Nenhum resultado para "${search}".` : 'Nenhuma receita publicada com estes filtros.'}</p>
          <button type="button" class="btn-primary" onClick={() => { setSearch(''); setCategory(''); setTag(''); setDifficulty(''); setTimeMax(''); setPage(1) }}>
            Ver todas as receitas
          </button>
        </div>
      )}
    </>
  )
}
