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
      <div class="glass-card p-6" style={{ minHeight: '100px' }}>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 animate-pulse" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-[var(--color-bg-card-border)] rounded w-1/3 animate-pulse" />
            <div class="h-3 bg-[var(--color-bg-card-border)] rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!recipe) return null

  return (
    <a href={`/receitas/${recipe.slug}/`} class="glass-card p-6 group block relative overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-amber-500/5">
      {/* Gradient accent top */}
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300" />

      <div class="flex items-start gap-4">
        {/* Icon */}
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl flex-shrink-0">
          🍳
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
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
            <p class="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-2">
              {recipe.excerpt.replace(/<[^>]+>/g, '').substring(0, 120)}...
            </p>
          )}

          <div class="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            {recipe.prep_time_minutes != null && <span>⏱ {recipe.prep_time_minutes} min</span>}
            {recipe.servings != null && <span>👥 {recipe.servings} porções</span>}
            <span>📊 {difficultyLabel[recipe.difficulty] || recipe.difficulty}</span>
            <span class="flex items-center gap-1 group-hover:gap-2 transition-all ml-auto">
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
