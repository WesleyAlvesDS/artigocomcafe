import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { showToast } from './Toast'

interface PostItem {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  status: 'draft' | 'pending_review' | 'review' | 'scheduled' | 'published' | 'archived'
  featured_image: string | null
  reading_time: number | null
  category: { name: string; slug: string } | null
  tags: { name: string; slug: string }[]
  meta_description?: string | null
  date: string
  created_at: string
  updated_at: string
  user?: { id: number; name: string; email: string }
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

const statusLabels: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  pending_review: 'Pendente de Revis\u00e3o',
  review: 'Em Revis\u00e3o',
  scheduled: 'Agendado',
  archived: 'Arquivado',
}

const statusColors: Record<string, string> = {
  published: 'var(--color-accent)',
  draft: 'var(--color-text-muted)',
  pending_review: '#f59e0b',
  review: '#3b82f6',
  scheduled: '#8b5cf6',
  archived: '#6b7280',
}

function PostListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-28 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ReviewPage() {
  const { user } = useAuth()
  const isSupervisor = user?.role === 'admin' || user?.role === 'editor' || user?.role === 'supervisor'
  
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'review' | 'all'>('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchPosts = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const statusFilter = activeTab === 'pending' ? 'pending_review' : activeTab === 'review' ? 'review' : ''
      const url = '/user/posts?page=' + p + '&per_page=10' + (statusFilter ? '&status=' + statusFilter : '')
      const res = await api.get<PostsResponse>(url)
      setPosts(res.data.data)
      setTotalPages(res.data.meta.last_page)
      setPage(res.data.meta.current_page)
    } catch (err: unknown) {
      setError(err?.message || 'Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchPosts() }, [fetchPosts, activeTab])

  const handleAction = async (postId: number, action: 'approve' | 'reject' | 'request_changes') => {
    setActionLoading(postId)
    try {
      const res = await api.post<{ post: PostItem }>('/user/posts/' + postId + '/review', { action })
      showToast(
        action === 'approve' ? 'Artigo aprovado e publicado! \uD83C\uDFA9' :
        action === 'reject' ? 'Artigo rejeitado.' :
        'Altera\u00e7\u00f5es solicitadas ao autor.',
        action === 'approve' ? 'success' : 'warning'
      )
      fetchPosts(page)
      if (selectedPost?.id === postId) setSelectedPost(null)
    } catch (err: unknown) {
      showToast(err?.message || 'Erro ao processar a\u00e7\u00e3o.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const viewPost = (post: PostItem) => {
    setSelectedPost(post)
  }

  const closeModal = () => {
    setSelectedPost(null)
  }

  if (!isSupervisor) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-5xl mb-4">\uD83D\uDD12</div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Acesso Restrito</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          Esta \u00e1rea \u00e9 destinada a supervisores e administradores para revis\u00e3o de artigos pendentes.
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Seu papel atual: <strong>{user?.role || 'usu\u00e1rio'}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">\uD83D\uDCCB Painel de Revis\u00e3o</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Gerencie artigos enviados para revis\u00e3o. Aprove, rejeite ou solicite altera\u00e7\u00f5es.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchPosts(page)} disabled={loading} className="btn-ghost btn-sm">
            \uD83D\uDD04 Atualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist">
        {(['pending', 'review', 'all'] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (
              activeTab === tab
                ? 'bg-[var(--color-accent)] text-[var(--color-btn-text)]'
                : 'text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] hover:bg-[var(--color-bg-card-hover)]'
            )}
          >
            {tab === 'pending' && '\uD83D\uDCE5 Pendentes'}
            {tab === 'review' && '\uD83D\uDD0D Em Revis\u00e3o'}
            {tab === 'all' && '\uD83D\uDCDA Todos'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 flex items-center gap-3 text-sm text-red-400 bg-red-500/8 rounded-xl border border-red-500/20">
          <span className="text-lg">\u26A0\uFE0F</span>
          <span className="flex-1">{error}</span>
          <button onClick={() => fetchPosts(page)} className="text-xs font-medium text-red-400 hover:text-red-300 underline">Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <PostListSkeleton />
      ) : posts.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <div className="text-4xl mb-3">{activeTab === 'pending' ? '\uD83D\uDCEC' : '\uD83D\uDCDA'}</div>
          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
            {activeTab === 'pending' ? 'Nenhum artigo pendente de revis\u00e3o' : 'Nenhum artigo encontrado'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {activeTab === 'pending' ? 'Quando usu\u00e1rios enviarem artigos para publica\u00e7\u00e3o, eles aparecer\u00e3o aqui.' : 'Tente outro filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="glass-card p-4 hover:border-[var(--color-accent)]/20 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-medium text-[var(--color-text-primary)] line-clamp-1">{post.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: (statusColors[post.status] || 'var(--color-text-muted)') + '15',
                        color: statusColors[post.status] || 'var(--color-text-muted)',
                        border: '1px solid ' + (statusColors[post.status] || 'var(--color-text-muted)') + '25'
                      }}>
                      {statusLabels[post.status] || post.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted-dark)] mb-2">
                    <span>\uD83D\uDC64 {post.user?.name || 'Autor desconhecido'}</span>
                    <span>\uD83D\uDCC5 {formatDate(post.created_at)}</span>
                    {post.category && <span>\uD83D\uDCC2 {post.category.name}</span>}
                    {post.reading_time && <span>\u23F1\uFE0F {post.reading_time} min</span>}
                  </div>
                  {post.excerpt && (
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mt-2">{post.excerpt}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => viewPost(post)}
                    className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    \uD83D\uDC41\uFE0F Ver
                  </button>
                  {post.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => handleAction(post.id, 'approve')}
                        disabled={actionLoading === post.id}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === post.id ? '\u23F3' : '\u2705 Aprovar'}
                      </button>
                      <button
                        onClick={() => handleAction(post.id, 'request_changes')}
                        disabled={actionLoading === post.id}
                        className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-500/30 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === post.id ? '\u23F3' : '\u270F\uFE0F Altera\u00e7\u00f5es'}
                      </button>
                      <button
                        onClick={() => handleAction(post.id, 'reject')}
                        disabled={actionLoading === post.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === post.id ? '\u23F3' : '\u274C Rejeitar'}
                      </button>
                    </>
                  )}
                  {post.status === 'review' && (
                    <button
                      onClick={() => handleAction(post.id, 'approve')}
                      disabled={actionLoading === post.id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === post.id ? '\u23F3' : '\u2705 Publicar Agora'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchPosts(page - 1)} disabled={page === 1 || loading} className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] disabled:opacity-50">Anterior</button>
          <span className="text-sm text-[var(--color-text-muted)]">P\u00e1gina {page} de {totalPages}</span>
          <button onClick={() => fetchPosts(page + 1)} disabled={page === totalPages || loading} className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] disabled:opacity-50">Pr\u00f3xima</button>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-bg-card-border)]">
              <h2 className="font-bold text-[var(--color-text-primary)]">Pr\u00e9-visualiza\u00e7\u00e3o do Artigo</h2>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-[var(--color-bg-card-hover)] transition-colors text-[var(--color-text-muted)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: (statusColors[selectedPost.status] || 'var(--color-text-muted)') + '15',
                    color: statusColors[selectedPost.status] || 'var(--color-text-muted)'
                  }}>
                  {statusLabels[selectedPost.status] || selectedPost.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{selectedPost.title}</h3>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted-dark)] mb-4">
                <span>\uD83D\uDC64 {selectedPost.user?.name || 'Autor desconhecido'}</span>
                <span>\uD83D\uDCC5 {formatDate(selectedPost.created_at)}</span>
                {selectedPost.category && <span>\uD83D\uDCC2 {selectedPost.category.name}</span>}
                {selectedPost.reading_time && <span>\u23F1\uFE0F {selectedPost.reading_time} min</span>}
              </div>
              <div className="prose prose-sm max-w-none text-[var(--color-text-primary)]" dangerouslySetInnerHTML={{ __html: selectedPost.content ? renderMarkdown(selectedPost.content) : selectedPost.excerpt || 'Sem conte\u00fado' }} />
            </div>
            <div className="p-4 border-t border-[var(--color-bg-card-border)] flex gap-2 justify-end">
              {selectedPost.status === 'pending_review' && (
                <>
                  <button onClick={() => { handleAction(selectedPost.id, 'approve'); closeModal(); }} className="btn-primary btn-sm">\u2705 Aprovar</button>
                  <button onClick={() => { handleAction(selectedPost.id, 'request_changes'); closeModal(); }} className="btn-ghost btn-sm border-amber-500/30 text-amber-600 hover:bg-amber-500/10">\u270F\uFE0F Solicitar Altera\u00e7\u00f5es</button>
                  <button onClick={() => { handleAction(selectedPost.id, 'reject'); closeModal(); }} className="btn-ghost btn-sm border-red-500/30 text-red-600 hover:bg-red-500/10">\u274C Rejeitar</button>
                </>
              )}
              {selectedPost.status === 'review' && (
                <button onClick={() => { handleAction(selectedPost.id, 'approve'); closeModal(); }} className="btn-primary btn-sm">\u2705 Publicar Agora</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  let html = text
    .replace(/&/g, '\u0026')
    .replace(/</g, '\u003C')
    .replace(/>/g, '\u003E')
    .replace(/"/g, '\u0022')
    .replace(/'/g, '\u0027')
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => '<pre><code class="language-' + (lang || '') + '">' + code + '</code></pre>')
  html = html.replace(/`([^`\n]+)`/g, (_, code) => '<code>' + code + '</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/^---$/gm, '<hr>')
  html = html.replace(/\[([^\]]+)\]\(((?:https?:)?\/\/[^)\s]+|mailto:[^)\s]+|#[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  html = html.replace(/!\[([^\]]*)\]\(((?:https?:)?\/\/[^)\s]+|data:image\/[a-z]+;base64,[^)\s]+)\)/g, '<figure><img src="$2" alt="$1" loading="lazy"/><figcaption>$1</figcaption></figure>')
  html = html.replace(/^- \[ \] (.*$)/gm, '<li class="task-item"><input type="checkbox" disabled> $1</li>')
  html = html.replace(/^- \[x\] (.*$)/gm, '<li class="task-item"><input type="checkbox" checked disabled> $1</li>')
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>')
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  html = html.replace(/<\/ul>\n<ul>/g, '')
  html = html.replace(/^(?!<[hbuol]|<pre|<blockquote|<hr|<figure|<ul|<ol)(.+$)/gm, '<p>$1</p>')
  html = html.replace(/<\/p>\n<p>/g, '</p><p>')
  html = html.replace(/\n{3,}/g, '\n\n')
  return html
}