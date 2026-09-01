import type { BlogPost, BlogListResponse, Recipe, RecipeCategory, RecipeListResponse } from './types'
import { safeFetchJson } from './safe-fetch'

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

/**
 * Fetch com retry — o backend de produção às vezes responde 503
 * (proxy/hosting), o que vazava páginas vazias no build SSG.
 */
// fetchWithRetry replaced by safeFetchJson from safe-fetch.ts

export async function getPosts(page = 1, perPage = 9, category?: string, search?: string, tag?: string): Promise<BlogListResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  if (tag) params.set('tag', tag)

  const json = await safeFetchJson<LaravelPaginatedResponse>(`${API_BASE}/articles?${params}`)
  if (!json) return { posts: [], pagination: { total: 0, totalPages: 0, page } }
  return {
    posts: json.data.map(mapArticle),
    pagination: { total: json.total, totalPages: json.last_page, page: json.current_page },
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const json = await safeFetchJson<LaravelPaginatedResponse>(`${API_BASE}/articles?per_page=100`)
  return json?.data?.map(a => a.slug) || []
}

export async function getPost(slug: string): Promise<{ post: BlogPost; related: BlogPost[] } | null> {
  const json = await safeFetchJson<{ article: LaravelArticle; related: LaravelArticle[] }>(`${API_BASE}/articles/${encodeURIComponent(slug)}`)
  if (!json?.article) return null
  return {
    post: mapArticle(json.article),
    related: (json.related || []).map(mapArticle),
  }
}

export async function searchArticles(query: string): Promise<{ id: number; title: string; slug: string; date: string }[]> {
  if (query.trim().length < 2) return []
  const json = await safeFetchJson<LaravelPaginatedResponse>(`${API_BASE}/articles?search=${encodeURIComponent(query)}&per_page=5`)
  return json?.data?.map(a => ({ id: a.id, title: a.title, slug: a.slug, date: a.published_at })) || []
}

export async function getCategories(): Promise<LaravelCategory[]> {
  const json = await safeFetchJson<{ categories: LaravelCategory[] }>(`${API_BASE}/categories`)
  return json?.categories || []
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

export interface RecipeListResult {
  recipes: Recipe[]
  pagination: { total: number; totalPages: number; page: number }
}

export async function getRecipes(
  page = 1,
  perPage = 9,
  filters: { category?: string; search?: string; tag?: string; difficulty?: string; timeMax?: string } = {}
): Promise<RecipeListResult> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (filters.category) params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  if (filters.tag) params.set('tag', filters.tag)
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.timeMax) params.set('time_max', filters.timeMax)

  const json = await safeFetchJson<RecipeListResponse>(`${API_BASE}/recipes?${params}`)
  if (!json) return { recipes: [], pagination: { total: 0, totalPages: 0, page } }
  return {
    recipes: json.data.map(mapRecipe),
    pagination: { total: json.total, totalPages: json.last_page, page: json.current_page },
  }
}

export async function getAllRecipeSlugs(): Promise<string[]> {
  const json = await safeFetchJson<RecipeListResponse>(`${API_BASE}/recipes?per_page=1000`)
  return json?.data?.map(r => r.slug) || []
}

export async function getRecipe(slug: string): Promise<{ recipe: Recipe; related: Recipe[] } | null> {
  const json = await safeFetchJson<{ recipe: Recipe; related: Recipe[] }>(`${API_BASE}/recipes/${encodeURIComponent(slug)}`)
  if (!json?.recipe) return null
  return {
    recipe: mapRecipe(json.recipe),
    related: (json.related || []).map(mapRecipe),
  }
}

export async function getRecipeCategories(): Promise<RecipeCategory[]> {
  const json = await safeFetchJson<{ categories: RecipeCategory[] }>(`${API_BASE}/recipe-categories`)
  return json?.categories || []
}
