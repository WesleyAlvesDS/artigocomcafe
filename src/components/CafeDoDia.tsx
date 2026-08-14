import { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string
  cover_image: string | null
  reading_time: number
  category: { name: string; slug: string; color: string } | null
  published_at: string
}

export default function CafeDoDia() {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ article: Article }>('/articles/cafe-do-dia')
      .then(d => setArticle(d.article))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div class="glass-card p-6 animate-scale-in" style={{ minHeight: '120px' }}>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-[var(--color-bg-card-border)] skeleton flex-shrink-0" />
          <div class="flex-1 space-y-3">
            <div class="h-4 bg-[var(--color-bg-card-border)] rounded w-1/3 skeleton" />
            <div class="h-3 bg-[var(--color-bg-card-border)] rounded w-2/3 skeleton" />
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <a href="/blog/" class="glass-card p-6 group block relative overflow-hidden animate-scale-in">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300" />
        <div class="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/8 rounded-full blur-3xl group-hover:bg-amber-500/12 transition-colors duration-500" />
        <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/8 transition-colors duration-500" />
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 flex items-center justify-center text-2xl flex-shrink-0 ring-1 ring-amber-500/20 group-hover:ring-amber-500/30 transition-all">
            ☕
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                Café do Dia
              </span>
              <span class="text-[var(--color-text-muted)]">·</span>
              <span class="text-[11px] text-[var(--color-text-muted)]">Em destaque</span>
            </div>
            <h2 class="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors mb-1">
              Explore o melhor do Artigo com Café
            </h2>
            <p class="text-sm text-[var(--color-text-secondary)] mb-3">
              Escolha entre artigos, receitas e trilhas de leitura curadas para você
            </p>
            <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span>Descubra conteúdos novos todos os dias</span>
              <span class="flex items-center gap-1 group-hover:gap-2 transition-all text-[var(--color-accent)] font-medium ml-auto">
                Ler agora
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={`/blog/${article.slug}/`} class="glass-card p-6 group block relative overflow-hidden animate-scale-in transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-amber-500/5">
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300" />
      <div class="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/8 rounded-full blur-3xl group-hover:bg-amber-500/12 transition-colors duration-500" />
      <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/8 transition-colors duration-500" />

      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 flex items-center justify-center text-2xl flex-shrink-0 ring-1 ring-amber-500/20 group-hover:ring-amber-500/30 group-hover:scale-105 transition-all">
          ☕
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              Café do Dia
            </span>
            {article.category && (
              <>
                <span class="text-[var(--color-text-muted)]">·</span>
                <span class="text-[11px] text-[var(--color-text-muted)]">{article.category.name}</span>
              </>
            )}
          </div>

          <h2 class="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 mb-1">
            {article.title}
          </h2>

          {article.excerpt && (
            <p class="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
              {article.excerpt.replace(/<[^>]+>/g, '').substring(0, 120)}...
            </p>
          )}

          <div class="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span class="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-70">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {article.reading_time} min de leitura
            </span>
            <span class="flex items-center gap-1 group-hover:gap-2 transition-all font-medium text-[var(--color-accent)] ml-auto">
              Ler agora
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
