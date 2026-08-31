import { useState, useEffect, useRef, useCallback } from 'react'
import { api, isAuthenticated } from '../lib/api'
import LazyImage from './LazyImage'
import '../styles/feed-center.css'

interface Article {
  id: number
  title: string
  slug: string
  excerpt?: string
  content?: string
  featured_image?: string
  cover_image?: string
  category?: { name: string; slug: string }
  reading_time?: string
  published_at?: string
  author?: { name: string }
  likes_count?: number
  comments_count?: number
}

interface FeedData {
  posts: Article[]
  has_more: boolean
}

export default function FeedCenter() {
  const [posts, setPosts] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const retry = useCallback(() => {
    setError(null)
    setHasMore(true)
    fetchFeed(1)
  }, [])

  useEffect(() => {
    fetchFeed(1)
  }, [])

  const fetchFeed = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true)
    setError(null)
    try {
      const data = await api.get<FeedData>(`/feed?page=${pageNum}&per_page=10`)
      if (pageNum === 1) {
        setPosts(data.posts || [])
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
      }
      setHasMore(data.has_more)
    } catch {
      try {
        const fallback = await fetch('/api-proxy.php/articles?per_page=10&page=' + pageNum)
        if (fallback.ok) {
          const json = await fallback.json()
          const articles = (json.data || []).map((a: Article) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt,
            featured_image: a.featured_image || a.cover_image,
            category: a.category,
            reading_time: a.reading_time,
            published_at: a.published_at,
          }))
          if (pageNum === 1) {
            setPosts(articles)
          } else {
            setPosts(prev => [...prev, ...articles])
          }
          setHasMore(json.data?.length >= 10)
        } else {
          throw new Error('Fallback returned ' + fallback.status)
        }
      } catch (fallbackErr) {
        if (pageNum === 1) {
          setError('Não foi possível carregar o feed. Verifique sua conexão e tente novamente.')
        }
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setPage(prev => prev + 1)
  }, [loadingMore, hasMore])

  useEffect(() => {
    if (page > 1) {
      fetchFeed(page)
    }
  }, [page])

  const hasMoreRef = useRef(hasMore)
  const loadingMoreRef = useRef(loadingMore)

  useEffect(() => { hasMoreRef.current = hasMore })
  useEffect(() => { loadingMoreRef.current = loadingMore })

  // Infinite scroll com IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          loadMore()
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(sentinelRef.current)
    observerRef.current = observer

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [loadMore])

  const formatDate = (date?: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (error) {
    return (
      <div className="feed-center">
        <div className="feed-error glass-card">
          <span className="feed-error-icon">⚠️</span>
          <h3 className="feed-error-title">Erro ao carregar feed</h3>
          <p className="feed-error-message">{error}</p>
          <button onClick={retry} className="feed-error-retry">
            Tentar novamente
          </button>
        </div>

      </div>
    )
  }

  if (loading) {
    return (
      <div className="feed-center">
        <div className="feed-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-post glass-card">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-line tiny"></div>
              </div>
            </div>
          ))}
        </div>


      </div>
    )
  }

  return (
    <div className="feed-center" id="feed">
      {/* Create Post Prompt */}
      {isAuthenticated() && (
        <div className="feed-create glass-card">
          <div className="feed-create-avatar">
            <span>☕</span>
          </div>
          <div className="feed-create-input">
            <span className="feed-create-placeholder">O que você está lendo hoje?</span>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 ? (
        posts.map(post => (
          <article key={post.id} className="feed-post glass-card">
            {/* Post Header */}
            <div className="post-header">
              <div className="post-author">
                <span className="post-author-avatar">
                  {post.author?.name?.charAt(0)?.toUpperCase() || '☕'}
                </span>
                <div className="post-author-info">
                  <span className="post-author-name">{post.author?.name || 'Artigo com Café'}</span>
                  <span className="post-date">{formatDate(post.published_at)}</span>
                </div>
              </div>
              <button className="post-more" aria-label="Mais opções">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>

            {/* Post Category */}
            {post.category && (
              <a href={`/blog?categoria=${post.category.slug}`} className="post-category">
                {post.category.name}
              </a>
            )}

            {/* Post Title */}
            <h2 className="post-title">
              <a href={`/blog/${post.slug}`}>{post.title}</a>
            </h2>

            {/* Post Excerpt */}
            {post.excerpt && (
              <p className="post-excerpt">{post.excerpt}</p>
            )}

            {/* Post Image */}
            {(post.featured_image || post.cover_image) && (
              <a href={`/blog/${post.slug}`} className="post-image-link">
                <LazyImage
                  src={post.featured_image || post.cover_image}
                  alt={post.title}
                  className="post-image"
                  width={1200}
                  height={675}
                  rootMargin="200px"
                />
              </a>
            )}

            {/* Post Meta */}
            <div className="post-meta">
              {post.reading_time && (
                <span className="post-reading-time">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {post.reading_time} min de leitura
                </span>
              )}
            </div>

            {/* Post Actions */}
            <div className="post-actions">
              <button className="post-action">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                <span>Curtir{post.likes_count ? ` (${post.likes_count})` : ''}</span>
              </button>
              <button className="post-action">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Comentar{post.comments_count ? ` (${post.comments_count})` : ''}</span>
              </button>
              <a href={`/blog/${post.slug}`} className="post-action">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Compartilhar</span>
              </a>
            </div>
          </article>
        ))
      ) : (
        <div className="feed-empty glass-card">
          <span className="feed-empty-icon">📰</span>
          <h3>Nenhum artigo no feed</h3>
          <p>Explore o blog para descobrir conteúdos incríveis</p>
          <a href="/blog" className="btn-primary">Explorar Blog</a>
        </div>
      )}

      {/* Sentinel para infinite scroll + loading indicator */}
      {hasMore && posts.length > 0 && (
        <div ref={sentinelRef} className="feed-sentinel">
          {loadingMore && (
            <div className="feed-loading-more">
              <div className="loading-spinner"></div>
              <span>Carregando mais...</span>
            </div>
          )}
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <div className="feed-end">
          <span>Fim do feed</span>
        </div>
      )}

    </div>
  )
}
