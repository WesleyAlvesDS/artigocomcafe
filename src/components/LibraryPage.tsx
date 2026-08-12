import AuthPage from './AuthPage'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useState, useEffect, useCallback, useRef } from 'react'

interface Collection {
  id: number
  name: string
  description: string | null
  icon: string | null
  color: string | null
  articles_count: number
  created_at: string
}

interface OpenLibraryBook {
  key: string | null
  title: string
  subtitle?: string | null
  authors: string[]
  first_publish_year?: number | null
  subjects: string[]
  cover_id?: number | null
  covers?: { S: string; M: string; L: string } | null
  rating_avg?: number | null
  rating_count?: number | null
  isbn?: string[]
}

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

const bookCover = (b: OpenLibraryBook): string | null =>
  b.covers?.M || b.covers?.L || b.covers?.S || null

function BookCard({ book, onOpen }: { book: OpenLibraryBook; onOpen: (b: OpenLibraryBook) => void }) {
  const cover = bookCover(book)
  const [imgOk, setImgOk] = useState(true)
  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      class="book-card glass-card group"
      aria-label={`Ver detalhes de ${book.title}`}
    >
      <div class="book-cover">
        {cover && imgOk ? (
          <img
            src={cover}
            alt={`Capa de ${book.title}`}
            loading="lazy"
            decoding="async"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div class="book-cover-fallback">
            <span aria-hidden="true">📖</span>
          </div>
        )}
        <div class="book-cover-shine" aria-hidden="true" />
      </div>
      <div class="book-info">
        <h3 class="book-title">{book.title}</h3>
        {book.subtitle && <p class="book-subtitle">{book.subtitle}</p>}
        <p class="book-authors">{(book.authors || []).slice(0, 2).join(', ') || 'Autor desconhecido'}</p>
        <div class="book-meta">
          {book.first_publish_year && <span class="meta-chip">{book.first_publish_year}</span>}
          {book.rating_avg != null && book.rating_count != null && book.rating_count > 0 && (
            <span class="meta-chip rating">★ {Number(book.rating_avg).toFixed(1)}</span>
          )}
        </div>
      </div>
    </button>
  )
}

function BookModal({ book, onClose }: { book: OpenLibraryBook; onClose: () => void }) {
  const cover = bookCover(book)
  const [details, setDetails] = useState<{ description?: string | null; subjects?: string[] } | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  // A OpenLibrary retorna chaves como "/works/OL1234567W" — extraímos o ID
  const rawKey = book.key?.replace(/^\//, '') || ''
  const key = rawKey.split('/').pop() || rawKey

  useEffect(() => {
    if (!key) return
    setLoadingDetails(true)
    api.get<{ data: { description?: string | null; subjects?: string[] } }>(`/integrations/library/books/${encodeURIComponent(key)}`)
      .then(d => setDetails(d.data))
      .catch(() => setDetails(null))
      .finally(() => setLoadingDetails(false))
  }, [key])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const subjects = details?.subjects?.length ? details.subjects : book.subjects

  return (
    <div class="book-modal-overlay" role="dialog" aria-modal="true" aria-label={`Detalhes de ${book.title}`} onClick={onClose}>
      <div class="book-modal" onClick={e => e.stopPropagation()}>
        <button type="button" class="modal-close" onClick={onClose} aria-label="Fechar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div class="modal-grid">
          <div class="modal-cover">
            {cover ? (
              <img src={cover} alt={`Capa de ${book.title}`} />
            ) : (
              <div class="book-cover-fallback large"><span aria-hidden="true">📖</span></div>
            )}
          </div>
          <div class="modal-body">
            <span class="modal-kicker">OpenLibrary</span>
            <h2 class="modal-title">{book.title}</h2>
            {book.subtitle && <p class="modal-subtitle">{book.subtitle}</p>}
            <p class="modal-authors">{(book.authors || []).join(', ') || 'Autor desconhecido'}</p>

            {loadingDetails ? (
              <div class="modal-skeleton" aria-hidden="true" />
            ) : details?.description ? (
              <p class="modal-description">{String(details.description).substring(0, 600)}</p>
            ) : null}

            {subjects && subjects.length > 0 && (
              <div class="modal-subjects">
                {subjects.slice(0, 6).map(s => <span key={s} class="subject-chip">{s}</span>)}
              </div>
            )}

            <div class="modal-stats">
              {book.first_publish_year && <span>📅 {book.first_publish_year}</span>}
              {book.rating_avg != null && book.rating_count != null && book.rating_count > 0 && (
                <span>★ {Number(book.rating_avg).toFixed(1)} ({book.rating_count} avaliações)</span>
              )}
              {book.isbn && book.isbn.length > 0 && <span>ISBN {book.isbn[0]}</span>}
            </div>

            {key && (
              <a
                class="modal-link"
                href={`https://openlibrary.org/works/${key}`}
                target="_blank" rel="noopener noreferrer"
              >
                Ver na OpenLibrary →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LibraryContent() {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Busca de livros
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([])
  const [exploreBooks, setExploreBooks] = useState<OpenLibraryBook[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [totalFound, setTotalFound] = useState(0)
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBook | null>(null)
  const [activeTab, setActiveTab] = useState<'explore' | 'search' | 'saved'>('explore')
  const debounceRef = useRef<number | null>(null)

  useEffect(() => { loadCollections() }, [user])

  const loadCollections = async () => {
    try { setCollections((await api.get<{ collections: Collection[] }>('/user/collections')).collections) } catch {}
  }

  const create = async () => {
    if (!newName.trim()) return
    try {
      await api.post('/user/collections', { name: newName })
      setNewName(''); setShowForm(false); loadCollections()
    } catch {}
  }

  const remove = async (id: number) => {
    try { await api.delete(`/user/collections/${id}`); loadCollections() } catch {}
  }

  // Curadoria inicial
  const loadExplore = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<{ data: ExploreData }>('/integrations/library/explore?limit=12')
      setExploreBooks(d.data.books || [])
    } catch { setExploreBooks([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadExplore() }, [loadExplore])

  // Busca com debounce
  const runSearch = useCallback(async (term: string, page = 1) => {
    if (term.trim().length < 2) { setSearchResults([]); setTotalFound(0); return }
    setSearching(true); setSearchError('')
    try {
      const d = await api.get<{ data: SearchData }>(`/integrations/library/search?q=${encodeURIComponent(term)}&page=${page}&limit=20`)
      setSearchResults(d.data.books || [])
      setTotalFound(d.data.total || 0)
    } catch {
      setSearchError('Busca indisponível no momento. Tente novamente em instantes.')
      setSearchResults([])
    } finally { setSearching(false) }
  }, [])

  const onQueryChange = (v: string) => {
    setQuery(v)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      runSearch(v)
    }, 500)
  }

  useEffect(() => () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }, [])

  const showSearchResults = query.trim().length >= 2

  return (
    <div class="library-page space-y-8">
      {/* Hero */}
      <div class="library-hero">
        <span class="hero-kicker">📚 Biblioteca Digital</span>
        <h1 class="hero-title">Sua Biblioteca</h1>
        <p class="hero-subtitle">
          Descubra livros sobre café, conhecimento e literatura — organize sua coleção e acompanhe sua jornada de leitura.
        </p>
        <div class="hero-stats">
          <span><strong>{collections.length}</strong> coleções</span>
          <span><strong>{exploreBooks.length}</strong> livros em destaque</span>
          <span><strong>∞</strong> títulos via OpenLibrary</span>
        </div>
      </div>

      {/* Tabs */}
      <div class="lib-tabs" role="tablist" aria-label="Seções da biblioteca">
        <button
          type="button" role="tab" aria-selected={activeTab === 'explore'}
          onClick={() => setActiveTab('explore')}
          class={`lib-tab ${activeTab === 'explore' ? 'active' : ''}`}
        >
          ✨ Explorar
        </button>
        <button
          type="button" role="tab" aria-selected={activeTab === 'search'}
          onClick={() => setActiveTab('search')}
          class={`lib-tab ${activeTab === 'search' ? 'active' : ''}`}
        >
          🔍 Buscar livros
        </button>
        <button
          type="button" role="tab" aria-selected={activeTab === 'saved'}
          onClick={() => setActiveTab('saved')}
          class={`lib-tab ${activeTab === 'saved' ? 'active' : ''}`}
        >
          🗂️ Minhas coleções
        </button>
      </div>

      {/* Search panel */}
      {activeTab === 'search' && (
        <div class="search-panel">
          <div class="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder="Buscar por título, autor ou tema (ex.: café, barista, história)..."
              aria-label="Buscar livros"
              class="search-input"
            />
            {searching && <span class="search-spinner" aria-hidden="true" />}
          </div>

          {searchError && <p class="search-error" role="alert">{searchError}</p>}

          {showSearchResults && !searchError && (
            <p class="results-count">
              {searching ? 'Buscando…' : `${totalFound} ${totalFound === 1 ? 'livro encontrado' : 'livros encontrados'}`}
            </p>
          )}

          {showSearchResults && !searching && searchResults.length > 0 && (
            <div class="books-grid">
              {searchResults.map(b => (
                <BookCard key={b.key || b.title} book={b} onOpen={setSelectedBook} />
              ))}
            </div>
          )}

          {showSearchResults && !searching && !searchError && searchResults.length === 0 && (
            <div class="empty-panel">
              <span class="empty-emoji" aria-hidden="true">🔍</span>
              <p>Nenhum livro encontrado para "{query}".</p>
              <p class="empty-hint">Tente outros termos — autores, assuntos ou palavras-chave.</p>
            </div>
          )}
        </div>
      )}

      {/* Explore panel */}
      {activeTab === 'explore' && (
        <div class="explore-panel">
          <div class="panel-head">
            <h2 class="panel-title">Em destaque agora</h2>
            <p class="panel-desc">Curadoria automática sobre café, conhecimento e cultura.</p>
          </div>
          {loading ? (
            <div class="books-grid">
              {[...Array(6)].map((_, i) => <div key={i} class="book-skeleton" aria-hidden="true" />)}
            </div>
          ) : exploreBooks.length > 0 ? (
            <div class="books-grid">
              {exploreBooks.map(b => (
                <BookCard key={b.key || b.title} book={b} onOpen={setSelectedBook} />
              ))}
            </div>
          ) : (
            <div class="empty-panel">
              <span class="empty-emoji" aria-hidden="true">📚</span>
              <p>Curadoria indisponível no momento.</p>
            </div>
          )}
        </div>
      )}

      {/* Saved collections panel */}
      {activeTab === 'saved' && (
        <div class="saved-panel">
          <div class="flex items-center justify-between mb-4">
            <h2 class="panel-title">Minhas Coleções</h2>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              class="add-collection-btn"
            >
              {showForm ? 'Cancelar' : '+ Nova Coleção'}
            </button>
          </div>

          {showForm && (
            <div class="collection-form">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && create()}
                placeholder="Nome da coleção (ex.: Livros de café)..."
                aria-label="Nome da nova coleção"
              />
              <button type="button" onClick={create} class="primary-btn">Criar</button>
            </div>
          )}

          {collections.length === 0 ? (
            <div class="empty-panel">
              <span class="empty-emoji" aria-hidden="true">🗂️</span>
              <p>Você ainda não tem coleções.</p>
              <p class="empty-hint">Crie uma coleção para organizar seus conteúdos favoritos.</p>
            </div>
          ) : (
            <div class="collections-grid">
              {collections.map(col => (
                <div key={col.id} class="collection-card glass-card">
                  <div class="collection-head">
                    <span class="collection-icon">{col.icon || '📁'}</span>
                    <button
                      type="button"
                      onClick={() => remove(col.id)}
                      class="collection-remove"
                      aria-label={`Remover coleção ${col.name}`}
                    >✕</button>
                  </div>
                  <h3 class="collection-name">{col.name}</h3>
                  {col.description && <p class="collection-desc">{col.description}</p>}
                  <p class="collection-count">{col.articles_count} {col.articles_count === 1 ? 'item' : 'itens'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  )
}

export default function LibraryPage() {
  return (
    <AuthPage fallback={<PublicLibrary />}>
      <LibraryContent />
    </AuthPage>
  )
}

function PublicLibrary() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OpenLibraryBook[]>([])
  const [exploreBooks, setExploreBooks] = useState<OpenLibraryBook[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBook | null>(null)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    api.get<{ data: ExploreData }>('/integrations/library/explore?limit=12')
      .then(d => setExploreBooks(d.data.books || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const runSearch = (term: string) => {
    if (term.trim().length < 2) { setResults([]); return }
    setSearching(true)
    api.get<{ data: SearchData }>(`/integrations/library/search?q=${encodeURIComponent(term)}&limit=20`)
      .then(d => setResults(d.data.books || []))
      .catch(() => setResults([]))
      .finally(() => setSearching(false))
  }

  const onQueryChange = (v: string) => {
    setQuery(v)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => runSearch(v), 500)
  }

  useEffect(() => () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }, [])

  const showResults = query.trim().length >= 2

  return (
    <div class="library-page space-y-8">
      <div class="library-hero">
        <span class="hero-kicker">📚 Biblioteca Digital</span>
        <h1 class="hero-title">Descubra Livros</h1>
        <p class="hero-subtitle">
          Busque milhões de títulos gratuitamente pela OpenLibrary — café, conhecimento e literatura.
        </p>
        <div class="search-box large">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Buscar por título, autor ou tema..."
            aria-label="Buscar livros"
            class="search-input"
          />
          {searching && <span class="search-spinner" aria-hidden="true" />}
        </div>
        <p class="hero-login-hint">
          <a href="/entrar">Entre na sua conta</a> para criar coleções e salvar livros favoritos.
        </p>
      </div>

      {showResults ? (
        <>
          <p class="results-count">{searching ? 'Buscando…' : `${results.length} livros`}</p>
          {!searching && results.length > 0 && (
            <div class="books-grid">
              {results.map(b => <BookCard key={b.key || b.title} book={b} onOpen={setSelectedBook} />)}
            </div>
          )}
          {!searching && results.length === 0 && (
            <div class="empty-panel">
              <span class="empty-emoji" aria-hidden="true">🔍</span>
              <p>Nenhum livro encontrado para "{query}".</p>
            </div>
          )}
        </>
      ) : (
        <div class="explore-panel">
          <div class="panel-head">
            <h2 class="panel-title">Em destaque agora</h2>
            <p class="panel-desc">Curadoria automática sobre café, conhecimento e cultura.</p>
          </div>
          {loading ? (
            <div class="books-grid">
              {[...Array(6)].map((_, i) => <div key={i} class="book-skeleton" aria-hidden="true" />)}
            </div>
          ) : exploreBooks.length > 0 ? (
            <div class="books-grid">
              {exploreBooks.map(b => <BookCard key={b.key || b.title} book={b} onOpen={setSelectedBook} />)}
            </div>
          ) : (
            <div class="empty-panel">
              <span class="empty-emoji" aria-hidden="true">📚</span>
              <p>Curadoria indisponível no momento.</p>
            </div>
          )}
        </div>
      )}

      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  )
}
