// Navegador de livros 100% client-side (mesma arquitetura do RecipeBrowser).
// Diferente das receitas (lista local), os livros vêm da OpenLibrary via
// backend — são milhões de títulos, então a busca é FEITA NO SERVIDOR com
// debounce + paginação, sincronizando a URL (replaceState) para
// compartilhamento. Sem busca ativa, mostra a curadoria (explore) como
// estado inicial, igual à aba "Explorar" da biblioteca.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { OpenLibraryBook } from '../lib/types'

const API_URL = '/api-proxy.php'
const PER_PAGE = 24

interface ExploreData {
  books: OpenLibraryBook[]
  themes: string[]
}

interface SearchData {
  query: string
  page: number
  limit: number
  total: number
  books: OpenLibraryBook[]
}

/** Nomes amigáveis (pt-BR) para os temas de curadoria da OpenLibrary. */
const THEME_LABELS: Record<string, string> = {
  coffee: 'Café',
  'coffee history': 'História do café',
  barista: 'Barista',
  café: 'Café (pt)',
  cooking: 'Culinária',
  technology: 'Tecnologia',
  'literature fiction': 'Literatura',
}

function themeLabel(t: string): string {
  return THEME_LABELS[t] || t.charAt(0).toUpperCase() + t.slice(1)
}

function normKey(raw?: string | null): string {
  const seg = (raw || '').replace(/^\//, '').split('/').pop() || ''
  return seg
}

function bookCover(b: OpenLibraryBook): string | null {
  const c = b.covers
  return c?.M || c?.L || c?.S || null
}

function readParams(): { busca: string; tema: string; page: number } {
  if (typeof window === 'undefined') return { busca: '', tema: '', page: 1 }
  const qs = new URLSearchParams(window.location.search)
  return {
    busca: qs.get('busca') || '',
    tema: qs.get('tema') || '',
    page: Math.max(1, Number(qs.get('page')) || 1),
  }
}

function BookCardView({ book }: { book: OpenLibraryBook }) {
  const cover = bookCover(book)
  const key = normKey(book.key)
  const href = key ? `/livro/${key}/` : null
  const inner = (
    <>
      <div class="book-cover">
        {cover ? (
          <img src={cover} alt={`Capa de ${book.title}`} width="180" height="270" loading="lazy" decoding="async" />
        ) : (
          <div class="book-cover-fallback"><span aria-hidden="true">📖</span></div>
        )}
        <div class="book-cover-shine" aria-hidden="true" />
      </div>
      <div class="book-info">
        <h2 class="book-title">{book.title}</h2>
        {book.subtitle && <p class="book-subtitle">{book.subtitle}</p>}
        <p class="book-authors">{(book.authors || []).slice(0, 2).join(', ') || 'Autor desconhecido'}</p>
        <div class="book-meta">
          {book.first_publish_year && <span class="meta-chip">{book.first_publish_year}</span>}
          {book.rating_avg != null && book.rating_count != null && book.rating_count > 0 && (
            <span class="meta-chip rating">★ {Number(book.rating_avg).toFixed(1)}</span>
          )}
        </div>
        {href && (
          <span class="book-read-more">
            Conhecer livro
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        )}
      </div>
    </>
  )
  return href ? (
    <a href={href} class="book-card glass-card">{inner}</a>
  ) : (
    <div class="book-card glass-card">{inner}</div>
  )
}

function buildQuery(params: { busca: string; tema: string; page: number }): string {
  const qs = new URLSearchParams()
  if (params.busca) qs.set('busca', params.busca)
  if (params.tema) qs.set('tema', params.tema)
  if (params.page > 1) qs.set('page', String(params.page))
  const q = qs.toString()
  return q ? `/livros?${q}` : '/livros'
}

export default function BookBrowser({ initialBooks, initialThemes }: {
  initialBooks: OpenLibraryBook[]
  initialThemes: string[]
}) {
  // Estado inicial IGUAL ao SSR (build sem query params) — a URL real é
  // aplicada num efeito APÓS a hidratação (evita mismatch React #418).
  const [exploreBooks, setExploreBooks] = useState<OpenLibraryBook[]>(initialBooks)
  const [themes, setThemes] = useState<string[]>(initialThemes)
  const [busca, setBusca] = useState('')
  const [tema, setTema] = useState('')
  const [page, setPage] = useState(1)
  const [results, setResults] = useState<OpenLibraryBook[]>([])
  const [total, setTotal] = useState(0)
  const [exploreLoaded, setExploreLoaded] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<number | null>(null)

  const isSearching = busca.trim().length >= 2 || Boolean(tema)

  // Aplica filtros da URL depois da hidratação.
  useEffect(() => {
    const p = readParams()
    setBusca(p.busca)
    setTema(p.tema)
    setPage(p.page)
  }, [])

  // Carrega a curadoria (explore) + temas em background — mantém os cards SSG
  // enquanto isso e atualiza a grade com dados frescos.
  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/integrations/library/explore?limit=30`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: { data: ExploreData }) => {
        if (cancelled) return
        if (json.data?.books?.length) {
          setExploreBooks(json.data.books.map(b => ({ ...b, key: normKey(b.key) })))
        }
        if (json.data?.themes?.length) setThemes(json.data.themes)
      })
      .catch(() => { /* mantém SSG */ })
      .finally(() => { if (!cancelled) setExploreLoaded(true) })
    return () => { cancelled = true }
  }, [])

  // Busca no servidor (debounce) sempre que busca/tema/página mudam.
  useEffect(() => {
    if (!isSearching) {
      setResults([])
      setTotal(0)
      setError('')
      return
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setSearching(true)
      setError('')
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) })
      const term = busca.trim() || tema
      if (term) params.set('q', term)
      fetch(`${API_URL}/integrations/library/search?${params}`)
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((json: { data: SearchData }) => {
          setResults((json.data?.books || []).map(b => ({ ...b, key: normKey(b.key) })))
          setTotal(json.data?.total || 0)
        })
        .catch(() => {
          setError('Busca indisponível no momento. Tente novamente em instantes.')
          setResults([])
        })
        .finally(() => setSearching(false))
    }, 400)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [busca, tema, page, isSearching])

  // Sincroniza a URL sem recarregar (compartilhável, botão voltar ok).
  useEffect(() => {
    if (typeof history === 'undefined') return
    history.replaceState(null, '', buildQuery({ busca, tema, page }))
  }, [busca, tema, page])

  // Paginação: curadoria (cliente, sem total) ou busca (servidor).
  const totalPages = isSearching
    ? Math.max(1, Math.ceil(total / PER_PAGE))
    : Math.max(1, Math.ceil(exploreBooks.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const shown = isSearching
    ? results
    : exploreBooks.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function goToPage(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function applyTema(t: string) {
    setTema(t === tema ? '' : t)
    setPage(1)
  }

  function clearAll() {
    setBusca('')
    setTema('')
    setPage(1)
    setError('')
  }

  const countLabel = isSearching
    ? (searching ? 'Buscando…' : `${total} ${total === 1 ? 'livro encontrado' : 'livros encontrados'}`)
    : (exploreLoaded ? `${exploreBooks.length} livros em destaque` : 'Carregando livros…')

  return (
    <>
      <form class="recipes-filters books-filters" method="GET" action="/livros" onSubmit={e => e.preventDefault()} data-books-browser>
        <div class="search-form">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            name="busca"
            value={busca}
            placeholder="Buscar por título, autor ou tema…"
            class="search-input"
            aria-label="Buscar livros"
            onChange={e => { setBusca(e.target.value); setPage(1) }}
          />
        </div>

        {themes.length > 0 && (
          <div class="categories-filter">
            <button type="button" class={`cat-chip ${!tema ? 'active' : ''}`} onClick={() => { setTema(''); setPage(1) }}>
              Todos
            </button>
            {themes.slice(0, 8).map(t => (
              <button
                type="button"
                key={t}
                class={`cat-chip ${tema === t ? 'active' : ''}`}
                onClick={() => applyTema(t)}
                aria-pressed={tema === t}
              >
                {themeLabel(t)}
              </button>
            ))}
          </div>
        )}

        {(busca || tema) && (
          <div class="active-filters">
            {busca && (
              <span class="filter-tag">
                Busca: {busca}
                <button type="button" class="remove-filter" aria-label="Remover busca" onClick={() => { setBusca(''); setPage(1) }}>×</button>
              </span>
            )}
            {tema && (
              <span class="filter-tag">
                Tema: {themeLabel(tema)}
                <button type="button" class="remove-filter" aria-label="Remover tema" onClick={() => { setTema(''); setPage(1) }}>×</button>
              </span>
            )}
            <button type="button" class="clear-filters" onClick={clearAll}>Limpar todos</button>
          </div>
        )}
      </form>

      <div class="recipes-results-info">
        <span>{countLabel}</span>
        {(searching || (!isSearching && !exploreLoaded)) && <span class="results-spinner" aria-hidden="true" />}
      </div>

      {error && <p class="search-error" role="alert">{error}</p>}

      {shown.length > 0 ? (
        <>
          <div class="books-grid">
            {shown.map((book, i) => (
              <BookCardView key={book.key || `${book.title}-${i}`} book={book} />
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
                {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => i + 1).map(p => (
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
        !searching && (
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2 class="empty-title">Nenhum livro encontrado</h2>
            <p class="empty-desc">{busca || tema ? `Nenhum resultado para "${busca || tema}".` : 'Nenhum livro disponível no momento.'}</p>
            <button type="button" class="btn-primary" onClick={clearAll}>Ver todos os livros</button>
          </div>
        )
      )}
    </>
  )
}
