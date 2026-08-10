import type { BlogPost, BlogListResponse, Recipe, RecipeCategory, RecipeListResponse } from './types'

const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://back.artigocomcafe.com/api'

export interface LaravelArticle {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  cover_image: string | null
  featured_image: string | null
  category: { id: number; name: string; slug: string; icon: string | null; color: string | null } | null
  tags: { id: number; name: string; slug: string }[]
  reading_time: string
  published_at: string
}

export interface LaravelCategory {
  id: number
  name: string
  slug: string
  icon: string | null
  color: string | null
  articles_count: number
}

export interface LaravelPaginatedResponse {
  data: LaravelArticle[]
  total: number
  per_page: number
  current_page: number
  last_page: number
}

function mapArticle(a: LaravelArticle): BlogPost {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    content: a.content,
    excerpt: a.excerpt ?? '',
    date: a.published_at,
    modified: a.published_at,
    featuredImage: a.featured_image 
      ? (a.featured_image.startsWith('http') || a.featured_image.startsWith('/') 
         ? a.featured_image : `/${a.featured_image}`)
      : a.cover_image
        ? (a.cover_image.startsWith('http') || a.cover_image.startsWith('/') 
           ? a.cover_image : `/${a.cover_image}`)
        : null,
    featuredImageAlt: a.title,
    categories: a.category ? [{ id: a.category.id, name: a.category.name, slug: a.category.slug }] : [],
    tags: (a.tags || []).map(t => ({ id: t.id, name: t.name, slug: t.slug })),
    readingTime: parseInt(a.reading_time) || 5,
  }
}

export async function getPosts(page = 1, perPage = 9, category?: string, search?: string, tag?: string): Promise<BlogListResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  if (tag) params.set('tag', tag)

  const res = await fetch(`${API_BASE}/articles?${params}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return { posts: [], pagination: { total: 0, totalPages: 0, page } }

  const json: LaravelPaginatedResponse = await res.json()
  return {
    posts: json.data.map(mapArticle),
    pagination: { total: json.total, totalPages: json.last_page, page: json.current_page },
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/articles?per_page=100`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json: LaravelPaginatedResponse = await res.json()
  return json.data.map(a => a.slug)
}

export async function getPost(slug: string): Promise<{ post: BlogPost; related: BlogPost[] } | null> {
  const res = await fetch(`${API_BASE}/articles/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const json = await res.json()
  return {
    post: mapArticle(json.article),
    related: (json.related || []).map(mapArticle),
  }
}

export async function searchArticles(query: string): Promise<{ id: number; title: string; slug: string; date: string }[]> {
  if (query.trim().length < 2) return []
  const res = await fetch(`${API_BASE}/articles?search=${encodeURIComponent(query)}&per_page=5`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json: LaravelPaginatedResponse = await res.json()
  return json.data.map(a => ({ id: a.id, title: a.title, slug: a.slug, date: a.published_at }))
}

export async function getCategories(): Promise<LaravelCategory[]> {
  const res = await fetch(`${API_BASE}/categories`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json = await res.json()
  return json.categories
}

function mapRecipe(r: Recipe): Recipe {
  return {
    ...r,
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    steps: Array.isArray(r.steps) ? r.steps : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    cover_image: r.cover_image
      ? (r.cover_image.startsWith('http') || r.cover_image.startsWith('/')
        ? r.cover_image : `/${r.cover_image}`)
      : null,
  }
}

export async function getRecipes(page = 1, perPage = 9, category?: string, search?: string, tag?: string): Promise<RecipeListResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  if (tag) params.set('tag', tag)

  const res = await fetch(`${API_BASE}/recipes?${params}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return { data: [], total: 0, per_page: perPage, current_page: page, last_page: 0 }

  const json: RecipeListResponse = await res.json()
  return { ...json, data: json.data.map(mapRecipe) }
}

export async function getAllRecipeSlugs(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/recipes?per_page=1000`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json: RecipeListResponse = await res.json()
  return json.data.map(r => r.slug)
}

export async function getRecipe(slug: string): Promise<{ recipe: Recipe; related: Recipe[] } | null> {
  const res = await fetch(`${API_BASE}/recipes/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const json = await res.json()
  return {
    recipe: mapRecipe(json.recipe),
    related: (json.related || []).map(mapRecipe),
  }
}

export async function getRecipeCategories(): Promise<RecipeCategory[]> {
  const res = await fetch(`${API_BASE}/recipe-categories`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json = await res.json()
  return json.categories || []
}
