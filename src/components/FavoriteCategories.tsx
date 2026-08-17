import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

interface CategoryItem {
  id: number
  name: string
  slug: string
  icon?: string
  color?: string
}

interface FavoritesResponse {
  favorites: CategoryItem[]
  categories: CategoryItem[]
}

export default function FavoriteCategories() {
  const [favorites, setFavorites] = useState<CategoryItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api
      .get<FavoritesResponse>('/user/favorites')
      .then((res) => {
        setFavorites(res.favorites || [])
        setCategories(res.categories || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (next: CategoryItem[]) => {
    setSaving(true)
    try {
      const res = await api.put<{ favorites: CategoryItem[] }>('/user/favorites/categories', {
        slugs: next.map((c) => c.slug),
      })
      setFavorites(res.favorites || [])
    } catch {
      // mantém o estado atual em caso de falha
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggle = (cat: CategoryItem) => {
    const exists = favorites.some((f) => f.slug === cat.slug)
    const next = exists ? favorites.filter((f) => f.slug !== cat.slug) : [...favorites, cat]
    setFavorites(next) // otimista
    save(next)
  }

  const favoriteSlugs = new Set(favorites.map((f) => f.slug))

  if (loading) {
    return (
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-6">
        <div class="h-4 w-40 bg-[var(--color-bg-card-hover)] rounded animate-pulse mb-4" />
        <div class="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} class="h-8 w-24 bg-[var(--color-bg-card-hover)] rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-6">
      <div class="flex items-center justify-between mb-1">
        <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">⭐ Categorias favoritas</h2>
        {saving && <span class="text-xs text-[var(--color-text-muted)]">Salvando…</span>}
      </div>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">
        Toque para marcar suas categorias preferidas — elas ajudam a personalizar sua experiência no site.
      </p>

      {favorites.length > 0 ? (
        <div class="flex flex-wrap gap-2 mb-5">
          {favorites.map((cat) => (
            <a
              key={cat.slug}
              href={`/blog?categoria=${cat.slug}`}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-accent)]/12 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:opacity-85 transition-opacity"
            >
              <span aria-hidden="true">{cat.icon || '⭐'}</span>
              {cat.name}
            </a>
          ))}
        </div>
      ) : (
        <p class="text-sm text-[var(--color-text-muted)] mb-5">
          Você ainda não marcou nenhuma categoria favorita.
        </p>
      )}

      <div class="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = favoriteSlugs.has(cat.slug)
          return (
            <button
              key={cat.slug}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(cat)}
              class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? 'bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-bg-card-hover)] border-[var(--color-bg-card-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40'
              }`}
            >
              <span aria-hidden="true">{cat.icon || '📁'}</span>
              {cat.name}
              <span aria-hidden="true" class="text-xs opacity-70">{active ? '★' : '☆'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
