import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import { api, getCached, isAuthenticated } from '../lib/api'

export default function AIFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [reply, setReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ available: boolean; providers: Record<string, boolean> } | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    getCached<{ data: { available: boolean; providers: Record<string, boolean> } }>('/ai/status')
      .then(d => setStatus(d.data))
      .catch(() => setStatus({ available: false, providers: {} }))
  }, [])

  useEffect(() => {
    if (localStorage.getItem('ai_widget_welcomed')) return
    const t = window.setTimeout(() => setShowWelcome(true), 1400)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!showWelcome) return
    const t = window.setTimeout(() => {
      localStorage.setItem('ai_widget_welcomed', '1')
      setShowWelcome(false)
    }, 12000)
    return () => window.clearTimeout(t)
  }, [showWelcome])

  const startWelcome = () => {
    localStorage.setItem('ai_widget_welcomed', '1')
    setShowWelcome(false)
    setIsOpen(true)
  }

  const dismissWelcome = () => {
    localStorage.setItem('ai_widget_welcomed', '1')
    setShowWelcome(false)
  }

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

  return (
    <>
      {showWelcome && !isOpen && (
        <div className="ai-welcome-bubble" role="status">
          <button className="ai-welcome-close" onClick={dismissWelcome} aria-label="Dispensar">×</button>
          <div className="ai-welcome-body">
            <div className="ai-welcome-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10c0-.9-.3-1.4-.8-1.7a2 2 0 0 1-2.4-.4 2 2 0 0 1-.6-1.6 2 2 0 0 1-2.9-2.9 2 2 0 0 1-1.7-.9A3 3 0 0 1 12 2z" />
                <circle cx="8.5" cy="9.5" r="0.5" fill="currentColor" />
                <circle cx="12" cy="13" r="0.5" fill="currentColor" />
                <circle cx="15.5" cy="8.5" r="0.5" fill="currentColor" />
                <circle cx="13" cy="16.5" r="0.5" fill="currentColor" />
              </svg>
            </div>
            <p className="ai-welcome-text">
              Olá! Eu sou o <strong>assistente</strong> do Artigo com Café ☕<br />
              Posso te ajudar com dúvidas sobre café e conteúdo.
            </p>
          </div>
          <button className="ai-welcome-start" onClick={startWelcome}>
            Conversar com a IA
          </button>
        </div>
      )}

      {isOpen ? (
        <div className="ai-floating-widget open" role="dialog" aria-label="Assistente de IA">
          <div className="ai-floating-header">
            <div className="ai-floating-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10c0-.9-.3-1.4-.8-1.7a2 2 0 0 1-2.4-.4 2 2 0 0 1-.6-1.6 2 2 0 0 1-2.9-2.9 2 2 0 0 1-1.7-.9A3 3 0 0 1 12 2z" />
                <circle cx="8.5" cy="9.5" r="0.5" fill="currentColor" />
                <circle cx="12" cy="13" r="0.5" fill="currentColor" />
                <circle cx="15.5" cy="8.5" r="0.5" fill="currentColor" />
                <circle cx="13" cy="16.5" r="0.5" fill="currentColor" />
              </svg>
              <span>Assistente IA</span>
              {status?.available && <span className="ai-status-dot" role="img" aria-label="IA disponível" />}
            </div>
            <div className="ai-floating-actions">
              <button onClick={() => setIsOpen(false)} className="ai-floating-btn-icon" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div className="ai-floating-content">
            <div className="ai-floating-panel">
              <div className="ai-chat-panel">
                <div className="ai-chat-messages">
                  {!reply && !loading && !error && (
                    <div className="ai-message ai-message-bot ai-message-greeting">
                      <div className="ai-message-content">
                        Olá! 👋 Sou o assistente do Artigo com Café.
                        Pergunte sobre café, peça dicas de preparo ou ajuda com conteúdo.
                        Estou aqui para ajudar!
                      </div>
                    </div>
                  )}
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button className="ai-launcher" onClick={() => setIsOpen(true)} aria-label="Abrir Assistente IA">
          <span className="ai-launcher-ring" aria-hidden="true" />
          <span className="ai-launcher-inner">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10c0-.9-.3-1.4-.8-1.7a2 2 0 0 1-2.4-.4 2 2 0 0 1-.6-1.6 2 2 0 0 1-2.9-2.9 2 2 0 0 1-1.7-.9A3 3 0 0 1 12 2z" />
              <circle cx="8.5" cy="9.5" r="0.5" fill="currentColor" />
              <circle cx="12" cy="13" r="0.5" fill="currentColor" />
              <circle cx="15.5" cy="8.5" r="0.5" fill="currentColor" />
              <circle cx="13" cy="16.5" r="0.5" fill="currentColor" />
            </svg>
            <span className="ai-badge">IA</span>
          </span>
        </button>
      )}
    </>
  )
}
