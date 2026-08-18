import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { api } from '../lib/api'
import { showToast } from './Toast'
import PostEditor from './PostEditor'

interface PostItem {
  id: number
  title: string
  slug: string
  excerpt: string | null
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived'
  featured_image: string | null
  reading_time: number | null
  category: { name: string; slug: string } | null
  tags: { name: string; slug: string }[]
  date: string
  created_at: string
  updated_at: string
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
  review: 'Em Revisão',
  scheduled: 'Agendado',
  archived: 'Arquivado',
}

const statusColors: Record<string, string> = {
  published: 'var(--color-accent)',
  draft: 'var(--color-text-muted)',
  review: '#f59e0b',
  scheduled: '#3b82f6',
  archived: '#6b7280',
}

function PostListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
      ))}
    </div>
  )
}

export default function PostManagementWidget() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState<PostItem | null>(null)
  const [editorKey, setEditorKey] = useState(0)

  const fetchPosts = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<PostsResponse>(`/user/posts?page=${p}&per_page=10`)
      setPosts(res.data.data)
      setTotalPages(res.data.meta.last_page)
      setPage(res.data.meta.current_page)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const startEdit = (post: PostItem) => {
    setEditingPost(post)
    setEditorKey(k => k + 1)
    setShowEditor(true)
  }

  const startCreate = () => {
    setEditingPost(null)
    setEditorKey(k => k + 1)
    setShowEditor(true)
  }

  const handleSave = (post: PostItem) => {
    setShowEditor(false)
    setEditingPost(null)
    fetchPosts(page)
    showToast(post.id ? 'Artigo atualizado!' : 'Artigo criado!', 'success')
  }

  const handleClose = () => {
    setShowEditor(false)
    setEditingPost(null)
  }

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-28 h-28 rounded-full bg-amber-500/8 blur-2xl pointer-events-none" />
      
      <div className="relative flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          Meus Artigos
        </span>
        <span className="text-2xl" aria-hidden="true">📝</span>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-500/30">
          {error}
          <button onClick={() => fetchPosts(page)} className="ml-2 text-xs underline">Tentar novamente</button>
        </div>
      )}

      {showEditor ? (
        <PostEditor
          key={editorKey}
          initialPost={editingPost}
          onClose={handleClose}
          onSave={handleSave}
        />
      ) : (
        <>
          {loading ? (
            <PostListSkeleton />
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl mb-3 block" aria-hidden="true">📄</span>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Nenhum artigo ainda</p>
              <button onClick={startCreate} className="btn-primary form-submit">
                Criar Primeiro Artigo
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[var(--color-bg-card-border)]">
                {posts.map(post => (
                  <div key={post.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-[var(--color-text-primary)] line-clamp-1">{post.title}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${statusColors[post.status] || 'var(--color-text-muted)'}22`, color: statusColors[post.status] || 'var(--color-text-muted)' }}>
                          {statusLabels[post.status] || post.status}
                        </span>
                        {post.featured_image && <span className="text-[10px] text-[var(--color-text-muted)]" aria-hidden="true">🖼️</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted-dark)]">
                        <span>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                        {post.category && <span>· {post.category.name}</span>}
                        {post.reading_time && <span>⏱️ {post.reading_time} min</span>}
                        {post.tags.length > 0 && <span>🏷️ {post.tags.slice(0, 3).map(t => t.name).join(', ')}{post.tags.length > 3 ? '…' : ''}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                        title="Ver no site"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                      <button
                        onClick={() => startEdit(post)}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                        title="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este post?')) {
                            api.delete(`/user/posts/${post.id}`).then(() => fetchPosts(page)).catch(() => showToast('Erro ao excluir', 'error'))
                          }
                        }}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Excluir"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => fetchPosts(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => fetchPosts(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              )}

              <button onClick={startCreate} className="w-full mt-4 btn-primary form-submit">
                + Novo Artigo
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}