// Navegador de artigos 100% client-side — mesmo problema/solução do
// RecipeBrowser: o site é estático, então filtros via query string não
// re-renderizam no servidor. Busca a lista completa via API e filtra no
// navegador, sincronizando a URL.
import { useEffect, useMemo, useState } from 'react'
import type { BlogPost, LaravelArticle, LaravelCategory, LaravelPaginatedResponse } from '../lib/laravel'
import type { WPPageInfo } from '../lib/types'
import LazyImage from './LazyImage'

const API_URL = '/api-proxy.php'
const PER_PAGE = 9

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mapArticle(a: LaravelArticle): BlogPost {
  const cover = a.featured_image
    ? (a.featured_image.startsWith('http') || a.featured_image.startsWith('/') ? a.featured_image : `/${a.featured_image}`)
    : a.cover_image
      ? (a.cover_image.startsWith('http') || a.cover_image.startsWith('/') ? a.cover_image : `/${a.cover_image}`)
      : null
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    content: a.content,
    excerpt: a.excerpt ?? '',
    date: a.published_at,
    modified: a.published_at,
    featuredImage: cover,
    featuredImageAlt: a.title,
    categories: a.category ? [{ id: a.category.id, name: a.category.name, slug: a.category.slug }] : [],
    tags: (a.tags || []).map(t => ({ id: t.id, name: t.name, slug: t.slug })),
    readingTime: parseInt(a.reading_time) || 5,
  }
}

function readParams(): { search: string; category: string; tag: string; page: number } {
  if (typeof window === 'undefined') return { search: '', category: '', tag: '', page: 1 }
  const qs = new URLSearchParams(window.location.search)
  return {
    search: qs.get('busca') || '',
    category: qs.get('categoria') || '',
    tag: qs.get('tag') || '',
    page: Math.max(1, Number(qs.get('page')) || 1),
  }
}

function PostCardView({ post }: { post: BlogPost }) {
  return (
    <a href={`/blog/${post.slug}`} class="article-card glass-card">
      {post.featuredImage && (
        <div class="article-image-wrapper">
          <LazyImage
            src={post.featuredImage}
            alt={post.featuredImageAlt}
            className="article-image"
            width={1200}
            height={675}
            rootMargin="200px"
          />
          <div class="image-overlay" aria-hidden="true" />
        </div>
      )}
      <div class="article-body">
        <div class="article-meta">
          {post.categories.length > 0 && (
            <span class="article-category">{post.categories[0].name}</span>
          )}
          <span class="article-date">{formatDate(post.date)}</span>
          <span class="article-reading">{post.readingTime} min de leitura</span>
        </div>
        <h2 class="article-title">{post.title}</h2>
        <p class="article-excerpt">{post.excerpt}</p>
        <span class="article-read-more">
          Ler artigo
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
      <div class="card-glow" aria-hidden="true" />
    </a>
  )
}

function buildQuery(params: { search: string; category: string; tag: string; page: number }): string {
  const qs = new URLSearchParams()
  if (params.search) qs.set('busca', params.search)
  if (params.category) qs.set('categoria', params.category)
  if (params.tag) qs.set('tag', params.tag)
  if (params.page > 1) qs.set('page', String(params.page))
  const q = qs.toString()
  return q ? `/blog?${q}` : '/blog'
}

export default function PostBrowser({ categories, initialPosts, initialPagination }: {
  categories: LaravelCategory[]
  initialPosts: BlogPost[]
  initialPagination: WPPageInfo
}) {
  // Estado inicial VAZIO (igual ao SSR): os parâmetros da URL são aplicados
  // após a hidratação para evitar mismatch (React #418).
  const [all, setAll] = useState<BlogPost[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const p = readParams()
    setSearch(p.search)
    setCategory(p.category)
    setTag(p.tag)
    setPage(p.page)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/articles?per_page=1000`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: LaravelPaginatedResponse) => {
        if (cancelled) return
        setAll(json.data.map(mapArticle))
      })
      .catch(() => { /* mantém lista SSG */ })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (typeof history === 'undefined') return
    history.replaceState(null, '', buildQuery({ search, category, tag, page }))
  }, [search, category, tag, page])

  const filtered = useMemo(() => {
    let list = all.length > 0 ? all : initialPosts
    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(term) ||
        (p.excerpt || '').toLowerCase().includes(term)
      )
    }
    if (category) list = list.filter(p => p.categories.some(c => c.slug === category))
    if (tag) list = list.filter(p => p.tags.some(t => t.slug === tag))
    return list
  }, [all, initialPosts, search, category, tag])

  const totalCount = all.length > 0 ? all.length : (initialPagination.total || initialPosts.length)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pagePosts = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function goToPage(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <form class="blog-filters" method="GET" action="/blog" onSubmit={e => e.preventDefault()} data-posts-browser>
        <div class="search-form">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            name="busca"
            value={search}
            placeholder="Buscar artigos…"
            class="search-input"
            aria-label="Buscar artigos"
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <div class="categories-filter">
          <button type="button" class={`cat-chip ${!category && !tag ? 'active' : ''}`} onClick={() => { setCategory(''); setTag(''); setPage(1) }}>
            Todos
          </button>
          {categories.slice(0, 12).map(cat => (
            <button
              type="button"
              key={cat.slug}
              class={`cat-chip ${category === cat.slug ? 'active' : ''}`}
              onClick={() => { setCategory(cat.slug); setPage(1) }}
            >
              {cat.name}
              <span class="cat-count">{cat.articles_count}</span>
            </button>
          ))}
        </div>

        {tag && (
          <div class="tag-filter-bar">
            <span>Filtrando por tag:</span>
            <button type="button" class="tag-filter-chip" onClick={() => { setTag(''); setPage(1) }}>#{tag} ✕</button>
          </div>
        )}
      </form>

      <div class="recipes-results-info">
        <span>{loaded ? `${filtered.length} ${filtered.length === 1 ? 'artigo' : 'artigos'}` : 'Carregando artigos…'}</span>
        {!loaded && <span class="results-spinner" aria-hidden="true" />}
      </div>

      {pagePosts.length > 0 ? (
        <>
          <div class="articles-grid">
            {pagePosts.map(post => (
              <PostCardView key={post.id} post={post} />
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h2 class="empty-title">Nenhum artigo encontrado</h2>
          <p class="empty-desc">{search ? `Nenhum resultado para "${search}".` : 'Nenhum artigo publicado nesta categoria ainda.'}</p>
          <button type="button" class="btn-primary" onClick={() => { setSearch(''); setCategory(''); setTag(''); setPage(1) }}>
            Ver todos os artigos
          </button>
        </div>
      )}
    </>
  )
}
