import { useCallback, useEffect, useRef, useState } from 'react'
import './ReaderAssistant.css'

type Theme = 'light' | 'sepia' | 'dark' | 'contrast'

interface Settings {
  fontSize: number
  lineHeight: number
  serif: boolean
  theme: Theme
}

const STORAGE_KEY = 'ra-settings-v1'
const DEFAULTS: Settings = {
  fontSize: 18,
  lineHeight: 1.75,
  serif: false,
  theme: 'light'
}

interface Heading {
  tag: 'H2' | 'H3'
  text: string
  el: HTMLElement
}

interface Props {
  title?: string
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULTS
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

export default function ReaderAssistant({ title }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'read' | 'toc' | 'search'>('read')
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [progress, setProgress] = useState(0)
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<number>(-1)
  const [query, setQuery] = useState('')
  const [marks, setMarks] = useState<HTMLElement[]>([])
  const [activeMark, setActiveMark] = useState(-1)
  const [explain, setExplain] = useState<string[]>([])
  const [noArticle, setNoArticle] = useState(false)
  const proseRef = useRef<HTMLElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const getArticle = useCallback(() => {
    if (!proseRef.current) {
      proseRef.current = document.querySelector<HTMLElement>('.prose')
      if (!proseRef.current) setNoArticle(true)
    }
    return proseRef.current
  }, [])

  useEffect(() => {
    setSettings(loadSettings())
    const article = getArticle()
    if (article) {
      const hs = Array.from(article.querySelectorAll<HTMLElement>('h2, h3'))
        .filter(h => h.textContent && h.textContent.trim().length > 0)
        .map(h => ({ tag: h.tagName as 'H2' | 'H3', text: h.textContent!.trim(), el: h }))
      setHeadings(hs)
      if (hs.length > 0) setNoArticle(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      setProgress(clamp((window.scrollY / max) * 100, 0, 100))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!headings.length || tab !== 'toc') return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = headings.findIndex(h => h.el === entry.target)
            if (idx !== -1) setActiveId(idx)
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    headings.forEach(h => observer.observe(h.el))
    return () => observer.disconnect()
  }, [headings, tab])

  useEffect(() => {
    const article = getArticle()
    if (!article) return
    article.style.fontSize = `${settings.fontSize}px`
    article.style.lineHeight = String(settings.lineHeight)
    article.style.fontFamily = settings.serif
      ? "Georgia, 'Times New Roman', serif"
      : 'inherit'
  }, [settings, getArticle])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('ra-theme-sepia', 'ra-theme-dark', 'ra-theme-contrast')
    if (settings.theme !== 'light') root.classList.add(`ra-theme-${settings.theme}`)
  }, [settings.theme])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>('button, input')
      first?.focus()
    } else {
      setTab('read')
      clearMarks()
      setExplain([])
      setQuery('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const save = (next: Settings) => {
    setSettings(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  const adjustFont = (delta: number) =>
    save({ ...settings, fontSize: clamp(settings.fontSize + delta, 14, 26) })
  const adjustLine = (delta: number) =>
    save({ ...settings, lineHeight: Math.round((settings.lineHeight + delta) * 100) / 100 })

  const clearMarks = useCallback(() => {
    document.querySelectorAll('mark.ra-mark').forEach(m => {
      const parent = m.parentNode
      if (!parent) return
      const text = document.createTextNode(m.textContent || '')
      parent.replaceChild(text, m)
      parent.normalize()
    })
    setMarks([])
    setActiveMark(-1)
  }, [])

  useEffect(() => {
    if (tab !== 'search') return
    searchInputRef.current?.focus()
  }, [tab])

  useEffect(() => {
    if (!query.trim()) {
      clearMarks()
      setExplain([])
      return
    }
    const article = getArticle()
    if (!article) return
    clearMarks()
    const term = query.trim().toLowerCase()
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT)
    const found: HTMLElement[] = []
    const textNodes: Text[] = []
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (node.textContent && node.textContent.toLowerCase().includes(term)) textNodes.push(node)
    }
    textNodes.forEach(node => {
      const text = node.textContent || ''
      const frag = document.createDocumentFragment()
      const lower = text.toLowerCase()
      let idx = lower.indexOf(term)
      let last = 0
      while (idx !== -1) {
        frag.appendChild(document.createTextNode(text.slice(last, idx)))
        const mark = document.createElement('mark')
        mark.className = 'ra-mark'
        mark.textContent = text.slice(idx, idx + term.length)
        frag.appendChild(mark)
        found.push(mark)
        last = idx + term.length
        idx = lower.indexOf(term, last)
      }
      frag.appendChild(document.createTextNode(text.slice(last)))
      node.parentNode?.replaceChild(frag, node)
    })
    setMarks(found)
    if (found.length > 0) {
      found[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
      found[0].classList.add('ra-mark-active')
      setActiveMark(0)
    }
    buildExplain(term)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const buildExplain = (term: string) => {
    const article = getArticle()
    if (!article) return
    const blocks = Array.from(
      article.querySelectorAll<HTMLElement>('h2, h3, p, li')
    )
    const matches = blocks.filter(b => {
      const t = (b.textContent || '').toLowerCase()
      return t.includes(term) && b.textContent!.length > 60
    })
    const seen = new Set<string>()
    const picked: string[] = []
    for (const m of matches) {
      const t = m.textContent!.trim()
      if (t.length > 400) continue
      const key = t.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      picked.push(t)
      if (picked.length >= 2) break
    }
    if (picked.length === 0) {
      const head = headings.find(h => h.text.toLowerCase().includes(term))
      if (head) picked.push(head.text)
    }
    setExplain(picked)
  }

  const scrollToHeading = (idx: number) => {
    const h = headings[idx]
    if (!h) return
    h.el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(idx)
  }

  const focusMark = (idx: number) => {
    const mark = marks[idx]
    if (!mark) return
    marks.forEach(m => m.classList.remove('ra-mark-active'))
    mark.classList.add('ra-mark-active')
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setActiveMark(idx)
  }

  const goMark = (delta: number) => {
    if (marks.length === 0) return
    const next = (activeMark + delta + marks.length) % marks.length
    focusMark(next)
  }

  return (
    <>
      <button
        type="button"
        className="ra-fab"
        aria-expanded={open}
        aria-controls="ra-panel"
        aria-label={open ? 'Fechar assistente de leitura' : 'Abrir assistente de leitura'}
        onClick={() => setOpen(o => !o)}
      >
        <svg className="ra-fab-progress" viewBox="0 0 64 64" aria-hidden="true">
          <circle className="ra-progress-track" cx="32" cy="32" r="29" />
          <circle
            className="ra-progress-fill"
            cx="32"
            cy="32"
            r="29"
            strokeDasharray={2 * Math.PI * 29}
            strokeDashoffset={2 * Math.PI * 29 * (1 - progress / 100)}
          />
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </button>

      <div
        ref={panelRef}
        id="ra-panel"
        className="ra-panel"
        role="dialog"
        aria-label="Assistente de leitura"
        aria-hidden={!open}
        hidden={!open}
      >
        <div className="ra-panel-header">
          <span className="ra-panel-title">{title || 'Assistente de Leitura'}</span>
          <button type="button" className="ra-close-btn" aria-label="Fechar" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <div className="ra-tabs" role="tablist" aria-label="Funções do assistente">
          <button
            type="button"
            role="tab"
            id="ra-tab-read"
            className="ra-tab-btn"
            aria-selected={tab === 'read'}
            aria-controls="ra-panel-read"
            onClick={() => setTab('read')}
          >
            <span aria-hidden="true">☕</span> Leitura
          </button>
          <button
            type="button"
            role="tab"
            id="ra-tab-toc"
            className="ra-tab-btn"
            aria-selected={tab === 'toc'}
            aria-controls="ra-panel-toc"
            onClick={() => setTab('toc')}
          >
            <span aria-hidden="true">📑</span> Sumário
          </button>
          <button
            type="button"
            role="tab"
            id="ra-tab-search"
            className="ra-tab-btn"
            aria-selected={tab === 'search'}
            aria-controls="ra-panel-search"
            onClick={() => setTab('search')}
          >
            <span aria-hidden="true">🔍</span> Buscar
          </button>
        </div>

        <div className="ra-body">
          {noArticle && (
            <p className="ra-empty">Este conteúdo não possui texto de artigo para ajustar ou resumir.</p>
          )}

          <section className="ra-section" id="ra-panel-read" role="tabpanel" aria-labelledby="ra-tab-read" hidden={tab !== 'read'}>
            <div className="ra-group">
              <span className="ra-group-label">Progresso de leitura</span>
              <div className="ra-progress-bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso de leitura">
                <div className="ra-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="ra-progress-text">{Math.round(progress)}% do artigo lido</span>
            </div>

            <div className="ra-group">
              <span className="ra-group-label">Fonte</span>
              <div className="ra-control-row">
                <span>Tamanho do texto</span>
                <div className="ra-stepper">
                  <button type="button" className="ra-step-btn" aria-label="Diminuir fonte" onClick={() => adjustFont(-1)}>−</button>
                  <span className="ra-value">{settings.fontSize}px</span>
                  <button type="button" className="ra-step-btn" aria-label="Aumentar fonte" onClick={() => adjustFont(1)}>+</button>
                </div>
              </div>
              <div className="ra-control-row">
                <span>Espaçamento das linhas</span>
                <div className="ra-stepper">
                  <button type="button" className="ra-step-btn" aria-label="Diminuir espaçamento" onClick={() => adjustLine(-0.1)}>−</button>
                  <span className="ra-value">{settings.lineHeight.toFixed(1)}</span>
                  <button type="button" className="ra-step-btn" aria-label="Aumentar espaçamento" onClick={() => adjustLine(0.1)}>+</button>
                </div>
              </div>
              <div className="ra-toggle-row">
                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-text-primary, #ece5da)' }}>Fonte serifada</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.serif}
                  aria-label="Fonte serifada"
                  className="ra-switch"
                  onClick={() => save({ ...settings, serif: !settings.serif })}
                />
              </div>
            </div>

            <div className="ra-group">
              <span className="ra-group-label">Tema de leitura</span>
              <div className="ra-theme-row">
                <button type="button" className="ra-theme-btn" aria-pressed={settings.theme === 'light'} onClick={() => save({ ...settings, theme: 'light' })}>Claro</button>
                <button type="button" className="ra-theme-btn" aria-pressed={settings.theme === 'sepia'} onClick={() => save({ ...settings, theme: 'sepia' })}>Sépia</button>
                <button type="button" className="ra-theme-btn" aria-pressed={settings.theme === 'dark'} onClick={() => save({ ...settings, theme: 'dark' })}>Escuro</button>
                <button type="button" className="ra-theme-btn" aria-pressed={settings.theme === 'contrast'} onClick={() => save({ ...settings, theme: 'contrast' })}>Contraste</button>
              </div>
            </div>

            <button type="button" className="ra-reset-btn" onClick={() => save(DEFAULTS)}>
              Restaurar padrões
            </button>
          </section>

          <section className="ra-section" id="ra-panel-toc" role="tabpanel" aria-labelledby="ra-tab-toc" hidden={tab !== 'toc'}>
            {headings.length === 0 ? (
              <p className="ra-empty">Este conteúdo não possui seções organizadas.</p>
            ) : (
              <ul className="ra-toc">
                {headings.map((h, i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className={`ra-toc-h${h.tag === 'H3' ? '3' : '2'}${activeId === i ? ' ra-toc-active' : ''}`}
                      onClick={e => {
                        e.preventDefault()
                        scrollToHeading(i)
                      }}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ra-section" id="ra-panel-search" role="tabpanel" aria-labelledby="ra-tab-search" hidden={tab !== 'search'}>
            <input
              ref={searchInputRef}
              type="search"
              className="ra-search-input"
              placeholder="Buscar palavra ou termo no artigo…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Buscar no artigo"
            />
            {query.trim() && (
              <div className="ra-nav-row">
                <span className="ra-search-count">
                  {marks.length} ocorrência{marks.length === 1 ? '' : 's'}
                </span>
                <button type="button" className="ra-nav-btn" onClick={() => goMark(-1)} disabled={marks.length === 0}>Anterior</button>
                <button type="button" className="ra-nav-btn" onClick={() => goMark(1)} disabled={marks.length === 0}>Próxima</button>
              </div>
            )}
            {explain.length > 0 && (
              <div className="ra-explain">
                <h4>Explicação (do próprio artigo)</h4>
                {explain.map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
              </div>
            )}
            {!query.trim() && (
              <p className="ra-empty">
                Digite um termo para localizá-lo no texto e ver como ele é explicado neste artigo.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
