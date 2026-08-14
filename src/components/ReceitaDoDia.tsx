import { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface Recipe {
  id: number
  title: string
  slug: string
  excerpt: string
  cover_image: string | null
  prep_time_minutes: number | null
  servings: number | null
  difficulty: string
  category: { name: string; slug: string; color: string; icon: string | null } | null
}

const difficultyLabel: Record<string, string> = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' }

const difficultyColors: Record<string, string> = {
  facil: 'from-emerald-500/15 to-emerald-600/10 text-emerald-400 ring-emerald-500/20',
  media: 'from-amber-500/15 to-amber-600/10 text-amber-400 ring-amber-500/20',
  dificil: 'from-red-500/15 to-red-600/10 text-red-400 ring-red-500/20',
}

export default function ReceitaDoDia() {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ recipe: Recipe }>('/recipes/cafe-do-dia')
      .then(d => setRecipe(d.recipe))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div class="glass-card p-6 animate-scale-in" style={{ minHeight: '120px' }}>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-[var(--color-bg-card-border)] skeleton flex-shrink-0" />
          <div class="flex-1 space-y-3">
            <div class="h-4 bg-[var(--color-accent)]/30 rounded w-1/3 skeleton" />
            <div class="h-3 bg-[var(--color-bg-card-border)] rounded w-2/3 skeleton" />
          </div>
        </div>
        <span class="sr-only">Receita do Dia</span>
      </div>
    )
  }

  if (!recipe) {
    return (
      <a href="/receitas/" class="glass-card p-6 group block relative overflow-hidden animate-scale-in">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300" />
        <div class="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/8 rounded-full blur-3xl group-hover:bg-amber-500/12 transition-colors duration-500" />
        <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/8 transition-colors duration-500" />
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 flex items-center justify-center text-2xl flex-shrink-0 ring-1 ring-amber-500/20 group-hover:ring-amber-500/30 transition-all">
            🍳
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                Receita do Dia
              </span>
              <span class="text-[var(--color-text-muted)]">·</span>
              <span class="text-[11px] text-[var(--color-text-muted)]">Em destaque</span>
            </div>
            <h2 class="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors mb-1">
              Experimente uma receita nova hoje
            </h2>
            <p class="text-sm text-[var(--color-text-secondary)] mb-3">
              Do coado perfeito às sobremesas de acompanhamento
            </p>
            <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span>Receitas práticas e saborosas para o dia a dia</span>
              <span class="flex items-center gap-1 group-hover:gap-2 transition-all text-[var(--color-accent)] font-medium ml-auto">
                Ver receitas
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

  const diffColor = difficultyColors[recipe.difficulty] || difficultyColors.media

  return (
    <a href={`/receitas/${recipe.slug}/`} class="glass-card p-6 group block relative overflow-hidden animate-scale-in transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-amber-500/5">
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300" />
      <div class="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/8 rounded-full blur-3xl group-hover:bg-amber-500/12 transition-colors duration-500" />
      <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/8 transition-colors duration-500" />

      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 flex items-center justify-center text-2xl flex-shrink-0 ring-1 ring-amber-500/20 group-hover:ring-amber-500/30 group-hover:scale-105 transition-all">
          🍳
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              Receita do Dia
            </span>
            {recipe.category && (
              <>
                <span class="text-[var(--color-text-muted)]">·</span>
                <span class="text-[11px] text-[var(--color-text-muted)]">
                  {recipe.category.icon && <span aria-hidden="true">{recipe.category.icon}</span>} {recipe.category.name}
                </span>
              </>
            )}
          </div>

          <h2 class="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 mb-1">
            {recipe.title}
          </h2>

          {recipe.excerpt && (
            <p class="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
              {recipe.excerpt.replace(/<[^>]+>/g, '').substring(0, 120)}...
            </p>
          )}

          <div class="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-3">
            {recipe.prep_time_minutes != null && (
              <span class="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-70">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {recipe.prep_time_minutes} min
              </span>
            )}
            {recipe.servings != null && (
              <span class="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-70">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {recipe.servings} porções
              </span>
            )}
            <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r ${diffColor} ring-1`}>
              {difficultyLabel[recipe.difficulty] || recipe.difficulty}
            </span>
          </div>

          <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span class="flex items-center gap-1 group-hover:gap-2 transition-all font-medium text-[var(--color-accent)] ml-auto">
              Ver receita
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
