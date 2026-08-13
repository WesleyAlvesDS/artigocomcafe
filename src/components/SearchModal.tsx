import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react'

const API_URL = '/api-proxy.php'

interface SearchResult {
  id: number
  title: string
  slug: string
  date: string
  type: 'artigo' | 'receita'
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '15vh',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)'
}

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '560px',
  background: 'var(--color-bg-primary)',
  border: '1px solid var(--color-bg-card-border)',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem 1.25rem',
  borderBottom: '1px solid var(--color-bg-card-border)',
  color: 'var(--color-text-muted)'
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  fontSize: '1rem',
  fontFamily: 'var(--font-sans)',
  outline: 'none'
}

const resultsStyle: React.CSSProperties = {
  maxHeight: '320px',
  overflowY: 'auto'
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  padding: '0.75rem 1.25rem',
  borderTop: '1px solid var(--color-bg-card-border)',
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)'
}

export default function SearchModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    function handleOpenEvent() {
      setOpen(true)
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('search:open', handleOpenEvent)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('search:open', handleOpenEvent)
    }
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedIndex(-1)
    }
  }, [open])

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      // Busca unificada: artigos + receitas em paralelo.
      const [articlesRes, recipesRes] = await Promise.all([
        fetch(`${API_URL}/articles?search=${encodeURIComponent(q)}&per_page=5`),
        fetch(`${API_URL}/recipes?search=${encodeURIComponent(q)}&per_page=5`),
      ])
      const articles = articlesRes.ok ? await articlesRes.json() : null
      const recipes = recipesRes.ok ? await recipesRes.json() : null

      const articleResults: SearchResult[] = (articles?.data || []).map((p: { id: number; title: string; slug: string; published_at: string }) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        date: p.published_at,
        type: 'artigo',
      }))
      const recipeResults: SearchResult[] = (recipes?.data || []).map((p: { id: number; title: string; slug: string; published_at: string }) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        date: p.published_at,
        type: 'receita',
      }))
      setResults([...articleResults, ...recipeResults].slice(0, 10))
      setSelectedIndex(-1)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      const r = results[selectedIndex]
      window.location.href = r.type === 'receita' ? `/receitas/${r.slug}` : `/blog/${r.slug}`
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div style={overlayStyle} onClick={() => setOpen(false)}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar artigos…"
            style={inputStyle}
            aria-label="Buscar artigos"
          />
          <kbd style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--color-bg-card)', border: '1px solid var(--color-bg-card-border)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>ESC</kbd>
        </div>

        <div style={resultsStyle}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Buscando…</div>
          )}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Nenhum resultado encontrado.</div>
          )}
          {!loading && query.trim().length < 2 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Digite pelo menos 2 caracteres para buscar.</div>
          )}
          {results.map((result, index) => (
            <a
              key={`${result.type}-${result.id}`}
              href={result.type === 'receita' ? `/receitas/${result.slug}` : `/blog/${result.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.75rem 1.25rem',
                textDecoration: 'none',
                color: 'var(--color-text-primary)',
                background: index === selectedIndex ? 'var(--color-bg-card)' : 'transparent',
                transition: 'background 0.15s'
              }}
              onClick={() => setOpen(false)}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-card)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '100px',
                    background: result.type === 'receita'
                      ? 'color-mix(in srgb, var(--color-accent) 16%, transparent)'
                      : 'var(--color-bg-card)',
                    border: '1px solid var(--color-bg-card-border)',
                    color: 'var(--color-accent)',
                  }}
                >
                  {result.type}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.title}
                </span>
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(result.date).toLocaleDateString('pt-BR')}
              </span>
            </a>
          ))}
        </div>

        <div style={footerStyle}>
          <span><kbd style={kbdStyle}>↑</kbd><kbd style={kbdStyle}>↓</kbd> Navegar</span>
          <span><kbd style={kbdStyle}>↵</kbd> Abrir</span>
          <span><kbd style={kbdStyle}>ESC</kbd> Fechar</span>
        </div>
      </div>
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  padding: '1px 5px',
  borderRadius: '3px',
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-bg-card-border)',
  fontFamily: 'var(--font-mono)',
  marginRight: '3px'
}
