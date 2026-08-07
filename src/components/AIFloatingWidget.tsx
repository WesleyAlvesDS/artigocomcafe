import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import { api } from '../lib/api'

interface PostItem {
  id: number
  title: string
  slug: string
  status: string
  category: { name: string } | null
  reading_time: number | null
}

export default function AIFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [query, setQuery] = useState('')
  const [reply, setReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ available: boolean; providers: Record<string, boolean> } | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
  const [posts, setPosts] = useState<PostItem[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'posts'>('chat')
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<{ data: { available: boolean; providers: Record<string, boolean> } }>('/ai/status')
      .then(d => setStatus(d.data))
      .catch(() => setStatus({ available: false, providers: {} }))
  }, [])

  const fetchUserPosts = async () => {
    setPostsLoading(true)
    try {
      const res = await api.get<{ data: PostItem[] }>('/user/posts?per_page=50')
      setPosts(res.data.data)
    } catch {}
    finally { setPostsLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'posts' || activeTab === 'tools') fetchUserPosts()
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

  const aiAction = (action: string, prompt: string) => {
    if (!selectedPost && activeTab === 'tools') return
    const post = selectedPost || posts[0]
    if (!post) return
    const fullPrompt = `${action}\n\nTítulo: ${post.title}\n\nStatus: ${post.status}\nCategoria: ${post.category?.name || 'Sem categoria'}\nTempo de leitura: ${post.reading_time || '?'} min`
    ask(fullPrompt)
  }

  const actionPrompts = {
    translate: 'Traduza o artigo abaixo para inglês, mantendo o tom e a formatação em Markdown.',
    summarize: 'Crie um resumo executivo de 3-5 bullet points do artigo abaixo.',
    seo: 'Analise o artigo e sugira: 1) Meta title (até 60 chars), 2) Meta description (até 155 chars), 3) 5 palavras-chave SEO, 4) Headings H2/H3 sugeridos.',
    improve: 'Melhore o texto: corrija gramática, torne mais fluido, adicione exemplos práticos, mantenha o tom autoral.',
    titles: 'Sugira 5 títulos alternativos atrativos e otimizados para SEO.',
    outline: 'Crie um outline detalhado (H2, H3) para expandir este artigo em um guia completo.',
    social: 'Crie 3 posts para Twitter/X e 1 para LinkedIn promovendo este artigo.',
    faq: 'Gere 5 perguntas frequentes (FAQ) com respostas baseadas no artigo.',
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a')) return
    setDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging) return
      const maxX = window.innerWidth - 380
      const maxY = window.innerHeight - (isMinimized ? 60 : 500)
      const newX = Math.max(0, Math.min(maxX, e.clientX - dragOffset.current.x))
      const newY = Math.max(0, Math.min(maxY, e.clientY - dragOffset.current.y))
      setPosition({ x: newX, y: newY })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging])

  useEffect(() => {
    const saved = localStorage.getItem('ai_widget_position')
    if (saved) {
      try { setPosition(JSON.parse(saved)) } catch {}
    }
    const minimized = localStorage.getItem('ai_widget_minimized')
    if (minimized === 'true') setIsMinimized(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('ai_widget_position', JSON.stringify(position))
  }, [position])

  useEffect(() => {
    localStorage.setItem('ai_widget_minimized', String(isMinimized))
  }, [isMinimized])

  if (isMinimized) {
    return (
      <div
        ref={widgetRef}
        className="ai-floating-minimized"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={() => { setIsMinimized(false); setIsOpen(true) }}
          className="ai-floating-btn"
          aria-label="Expandir Assistente IA"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10c0-.9-.3-1.4-.8-1.7a2 2 0 0 1-2.4-.4 2 2 0 0 1-.6-1.6 2 2 0 0 1-2.9-2.9 2 2 0 0 1-1.7-.9A3 3 0 0 1 12 2z" />
            <circle cx="8.5" cy="9.5" r="0.5" fill="currentColor" />
            <circle cx="12" cy="13" r="0.5" fill="currentColor" />
            <circle cx="15.5" cy="8.5" r="0.5" fill="currentColor" />
            <circle cx="13" cy="16.5" r="0.5" fill="currentColor" />
          </svg>
          <span className="ai-badge">IA</span>
        </button>
      </div>
    )
  }

  return (
    <div
      ref={widgetRef}
      className={`ai-floating-widget ${isOpen ? 'open' : ''}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="ai-floating-header">
        <div className="ai-floating-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10c0-.9-.3-1.4-.8-1.7a2 2 0 0 1-2.4-.4 2 2 0 0 1-.6-1.6 2 2 0 0 1-2.9-2.9 2 2 0 0 1-1.7-.9A3 3 0 0 1 12 2z" />
            <circle cx="8.5" cy="9.5" r="0.5" fill="currentColor" />
            <circle cx="12" cy="13" r="0.5" fill="currentColor" />
            <circle cx="15.5" cy="8.5" r="0.5" fill="currentColor" />
            <circle cx="13" cy="16.5" r="0.5" fill="currentColor" />
          </svg>
          <span>Assistente IA</span>
          {status?.available && <span className="ai-status-dot" aria-label="IA disponível" />}
        </div>
        <div className="ai-floating-actions">
          <button
            onClick={() => { setIsOpen(false); setIsMinimized(true) }}
            className="ai-floating-btn-icon"
            aria-label="Minimizar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="ai-floating-btn-icon"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="ai-floating-content">
          <div className="ai-floating-tabs">
            <button
              onClick={() => setActiveTab('chat')}
              className={`ai-floating-tab ${activeTab === 'chat' ? 'active' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Chat
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`ai-floating-tab ${activeTab === 'tools' ? 'active' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/></svg>
              Ferramentas
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`ai-floating-tab ${activeTab === 'posts' ? 'active' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Posts
            </button>
          </div>

          <div className="ai-floating-panel">
            {activeTab === 'chat' && (
              <div className="ai-chat-panel">
                <div className="ai-chat-messages">
                  {reply && !loading && !error && (
                    <div className="ai-message ai-message-bot">
                      <div className="ai-message-content">{reply.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}</div>
                    </div>
                  )}
                  {loading && (
                    <div className="ai-message ai-message-bot loading">
                      <div className="ai-typing"><span></span><span></span><span></span></div>
                    </div>
                  )}
                  {error && (
                    <div className="ai-message ai-message-error">{error}</div>
                  )}
                </div>
                <div className="ai-chat-input">
                  <input
                    type="text"
                    value={query}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                    placeholder="Pergunte algo..."
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') ask() }}
                    className="ai-chat-input-field"
                    aria-label="Pergunte ao assistente"
                  />
                  <button onClick={ask} disabled={loading || !query.trim()} className="ai-chat-send">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="ai-tools-panel">
                <div className="ai-tools-post-selector">
                  <label>Artigo para trabalhar</label>
                  {postsLoading ? (
                    <div className="ai-loading">Carregando...</div>
                  ) : posts.length === 0 ? (
                    <div className="ai-empty">Nenhum post. Crie em "Posts".</div>
                  ) : (
                    <select
                      value={selectedPost?.id || ''}
                      onChange={e => {
                        const id = Number(e.target.value)
                        setSelectedPost(posts.find(p => p.id === id) || null)
                      }}
                      className="ai-select"
                    >
                      <option value="">Selecione um artigo...</option>
                      {posts.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
                      ))}
                    </select>
                  )}
                  {selectedPost && (
                    <div className="ai-selected-post">
                      <strong>{selectedPost.title}</strong>
                      <span>{selectedPost.status} · {selectedPost.category?.name || 'Sem cat.'} · {selectedPost.reading_time || '?'}min</span>
                    </div>
                  )}
                </div>

                <div className="ai-tools-grid">
                  {Object.entries(actionPrompts).map(([key, prompt]) => (
                    <button
                      key={key}
                      onClick={() => aiAction(prompt, prompt)}
                      disabled={loading || !selectedPost}
                      className="ai-tool-btn"
                    >
                      <span className="ai-tool-icon">{getToolIcon(key)}</span>
                      <span className="ai-tool-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </button>
                  ))}
                </div>

                {loading && <div className="ai-loading">Processando com IA...</div>}
                {error && <div className="ai-error">{error}</div>}
                {reply && !loading && !error && (
                  <div className="ai-result">
                    <div className="ai-result-header">
                      <strong>Resultado da IA</strong>
                      <button onClick={() => setReply(null)} className="ai-close-result">×</button>
                    </div>
                    <div className="ai-result-content">{reply.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="ai-posts-panel">
                <div className="ai-posts-header">
                  <strong>Meus Artigos</strong>
                  <span className="ai-posts-count">{posts.length} posts</span>
                </div>
                {postsLoading ? (
                  <div className="ai-loading">Carregando...</div>
                ) : posts.length === 0 ? (
                  <div className="ai-empty">Nenhum artigo ainda</div>
                ) : (
                  <div className="ai-posts-list">
                    {posts.map(post => (
                      <div key={post.id} className="ai-post-item" onClick={() => { setSelectedPost(post); setActiveTab('tools') }}>
                        <div className="ai-post-title">{post.title}</div>
                        <div className="ai-post-meta">
                          <span className={`ai-status ai-status-${post.status}`}>{post.status}</span>
                          {post.category && <span>{post.category.name}</span>}
                          {post.reading_time && <span>⏱️ {post.reading_time}min</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getToolIcon(key: string) {
  const icons: Record<string, string> = {
    translate: '🌐',
    summarize: '📋',
    seo: '🔍',
    improve: '✨',
    titles: '📝',
    outline: '📐',
    social: '📱',
    faq: '❓',
  }
  return icons[key] || '🤖'
}