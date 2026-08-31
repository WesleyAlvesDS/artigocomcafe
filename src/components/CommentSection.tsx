import { useState, useEffect } from 'react'
import { api, isAuthenticated } from '../lib/api'
import { showToast } from './Toast'
import '../styles/comment-section.css'

interface Comment {
  id: number
  content: string
  user: { id: number; name: string }
  created_at: string
  likes_count: number
  replies?: Comment[]
}

interface Props {
  articleId: number
  articleSlug: string
}

export default function CommentSection({ articleId, articleSlug }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    loadComments()
  }, [articleId])

  const loadComments = async () => {
    try {
      const res = await fetch(`/api-proxy.php/articles/${articleId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (e) {
      console.error('Failed to load comments:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated()) {
      window.location.href = `/entrar?next=${encodeURIComponent(window.location.pathname)}`
      return
    }
    if (!content.trim()) return

    setSubmitting(true)
    try {
      const res = await api.post<{ comment: Comment }>(`/articles/${articleId}/comments`, {
        content: content.trim(),
      })
      setComments(prev => [res.comment, ...prev])
      setContent('')
      showToast('Comentário enviado! 💬', 'success')
    } catch (err: unknown) {
      showToast('Erro ao enviar comentário', 'error', { message: err.message || 'Tente novamente' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: number) => {
    if (!isAuthenticated()) {
      window.location.href = `/entrar?next=${encodeURIComponent(window.location.pathname)}`
      return
    }
    if (!replyContent.trim()) return

    try {
      const res = await api.post<{ comment: Comment }>(`/articles/${articleId}/comments`, {
        content: replyContent.trim(),
        parent_id: parentId,
      })
      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), res.comment]
          }
        }
        return c
      }))
      setReplyTo(null)
      setReplyContent('')
      showToast('Resposta enviada! 💬', 'success')
    } catch (err: unknown) {
      showToast('Erro ao responder', 'error')
    }
  }

  const handleLike = async (commentId: number) => {
    if (!isAuthenticated()) {
      window.location.href = `/entrar?next=${encodeURIComponent(window.location.pathname)}`
      return
    }
    try {
      const res = await api.post<{ likes_count: number }>(`/comments/${commentId}/like`)
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, likes_count: res.likes_count }
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => r.id === commentId ? { ...r, likes_count: res.likes_count } : r)
          }
        }
        return c
      }))
    } catch (err) {
      showToast('Erro ao curtir', 'error')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div class="comment-section">
      <h3 class="comment-title">
        Comentários ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      {/* Comment Form */}
      {isAuthenticated() && (
        <form onSubmit={handleSubmit} class="comment-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva seu comentário..."
            class="comment-textarea"
            rows={3}
          />
          <button type="submit" disabled={submitting || !content.trim()} class="comment-submit">
            {submitting ? 'Enviando...' : 'Comentar'}
          </button>
        </form>
      )}

      {!isAuthenticated() && (
        <div class="comment-login-hint">
          <a href="/entrar">Entrar para comentar</a>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div class="comment-loading">Carregando comentários...</div>
      ) : comments.length === 0 ? (
        <div class="comment-empty">
          <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
        </div>
      ) : (
        <div class="comment-list">
          {comments.map(comment => (
            <div key={comment.id} class="comment-item">
              <div class="comment-header">
                <span class="comment-author">{comment.user.name}</span>
                <span class="comment-date">{formatDate(comment.created_at)}</span>
              </div>
              <p class="comment-content">{comment.content}</p>
              <div class="comment-actions">
                <button onClick={() => handleLike(comment.id)} class="comment-like">
                  👍 {comment.likes_count}
                </button>
                <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} class="comment-reply">
                  Responder
                </button>
              </div>

              {/* Reply Form */}
              {replyTo === comment.id && (
                <form onSubmit={(e) => { e.preventDefault(); handleReply(comment.id) }} class="comment-reply-form">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    class="comment-textarea"
                    rows={2}
                  />
                  <div class="comment-reply-actions">
                    <button type="submit" disabled={!replyContent.trim()} class="comment-submit">
                      Responder
                    </button>
                    <button type="button" onClick={() => { setReplyTo(null); setReplyContent('') }} class="comment-cancel">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div class="comment-replies">
                  {comment.replies.map(reply => (
                    <div key={reply.id} class="comment-item comment-reply-item">
                      <div class="comment-header">
                        <span class="comment-author">{reply.user.name}</span>
                        <span class="comment-date">{formatDate(reply.created_at)}</span>
                      </div>
                      <p class="comment-content">{reply.content}</p>
                      <div class="comment-actions">
                        <button onClick={() => handleLike(reply.id)} class="comment-like">
                          👍 {reply.likes_count}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
