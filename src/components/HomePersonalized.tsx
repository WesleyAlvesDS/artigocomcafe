import { useEffect, useState } from 'react'
import { api, isAuthenticated } from '../lib/api'

interface ArticleLite {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  reading_time?: string
  category?: { name: string; slug: string } | null
}

interface ContinueItem {
  id: number
  progress_percent: number
  article?: ArticleLite
}

function card(item: ArticleLite) {
  return (
    <a href={`/blog/${item.slug}`} class="homep-card glass-card tilt-card">
      <div class="homep-card-body">
        <span class="homep-card-cat">{item.category?.name || 'Artigo'}</span>
        <h3 class="homep-card-title">{item.title}</h3>
        {item.excerpt && <p class="homep-card-excerpt">{item.excerpt}</p>}
        <span class="homep-card-meta">
          {item.reading_time ? `${item.reading_time} de leitura` : 'Ler artigo'} →
        </span>
      </div>
    </a>
  )
}

export default function HomePersonalized() {
  const [continueItems, setContinueItems] = useState<ContinueItem[]>([])
  const [recommendations, setRecommendations] = useState<ArticleLite[]>([])
  const [ready, setReady] = useState(false)
  const authed = isAuthenticated()

  useEffect(() => {
    if (!authed) {
      setReady(true)
      return
    }
    Promise.all([
      api.get<{ continue_reading?: ContinueItem[] }>('/user/continue-reading').catch(() => null),
      api.get<{ recommendations?: ArticleLite[] }>('/user/recommendations').catch(() => null),
    ])
      .then(([cr, rec]) => {
        setContinueItems(cr?.continue_reading || [])
        setRecommendations(rec?.recommendations || [])
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [authed])

  if (!authed || !ready) return null
  if (continueItems.length === 0 && recommendations.length === 0) return null

  return (
    <section class="section home-personalized" data-scroll-reveal="fade">
      <div class="container">
        <div class="section-header" data-scroll-reveal="fade">
          <span class="section-label">Feito para você</span>
          <h2 class="section-title">Continue sua jornada</h2>
          <p class="section-subtitle">
            Recomendações personalizadas com base no que você já leu.
          </p>
        </div>

        {continueItems.length > 0 && (
          <div class="homep-block">
            <h3 class="homep-block-title">📖 Continue lendo</h3>
            <div class="homep-grid">
              {continueItems.map((item) => {
                const article = item.article
                if (!article) return null
                return (
                  <div key={item.id} class="homep-continue glass-card">
                    <div class="homep-continue-top">
                      <span class="homep-card-cat">{article.category?.name || 'Artigo'}</span>
                      <span class="homep-progress-pct">{Math.min(100, item.progress_percent)}%</span>
                    </div>
                    <a href={`/blog/${article.slug}`} class="homep-card-title-link">{article.title}</a>
                    <div class="homep-progress-track" aria-hidden="true">
                      <div class="homep-progress-fill" style={{ width: `${Math.min(100, item.progress_percent)}%` }} />
                    </div>
                    <a href={`/blog/${article.slug}`} class="homep-card-meta">Retomar leitura →</a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div class="homep-block">
            <h3 class="homep-block-title">✨ Recomendados para você</h3>
            <div class="homep-grid">
              {recommendations.map((item) => (
                <div key={item.id}>{card(item)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
