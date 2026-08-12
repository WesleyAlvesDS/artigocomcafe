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

/**
 * Fetch com retry — o backend de produção às vezes responde 503
 * (proxy/hosting), o que vazava páginas vazias no build SSG.
 */
async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (res.ok) return res
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}`)
        // backoff simples: 800ms, 1600ms
        await new Promise(r => setTimeout(r, 800 * 2 ** i))
        continue
      }
      return res
    } catch (e) {
      lastError = e
      await new Promise(r => setTimeout(r, 800 * 2 ** i))
    }
  }
  throw lastError ?? new Error(`Falha ao buscar ${url}`)
}

export async function getPosts(page = 1, perPage = 9, category?: string, search?: string, tag?: string): Promise<BlogListResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  if (tag) params.set('tag', tag)

  try {
    const res = await fetchWithRetry(`${API_BASE}/articles?${params}`)
    const json: LaravelPaginatedResponse = await res.json()
    return {
      posts: json.data.map(mapArticle),
      pagination: { total: json.total, totalPages: json.last_page, page: json.current_page },
    }
  } catch {
    return { posts: [], pagination: { total: 0, totalPages: 0, page } }
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/articles?per_page=100`)
    const json: LaravelPaginatedResponse = await res.json()
    return json.data.map(a => a.slug)
  } catch {
    return []
  }
}

export async function getPost(slug: string): Promise<{ post: BlogPost; related: BlogPost[] } | null> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/articles/${encodeURIComponent(slug)}`)
    const json = await res.json()
    return {
      post: mapArticle(json.article),
      related: (json.related || []).map(mapArticle),
    }
  } catch {
    return null
  }
}

export async function searchArticles(query: string): Promise<{ id: number; title: string; slug: string; date: string }[]> {
  if (query.trim().length < 2) return []
  try {
    const res = await fetchWithRetry(`${API_BASE}/articles?search=${encodeURIComponent(query)}&per_page=5`)
    const json: LaravelPaginatedResponse = await res.json()
    return json.data.map(a => ({ id: a.id, title: a.title, slug: a.slug, date: a.published_at }))
  } catch {
    return []
  }
}

export async function getCategories(): Promise<LaravelCategory[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/categories`)
    const json = await res.json()
    return json.categories || []
  } catch {
    return []
  }
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

  try {
    const res = await fetchWithRetry(`${API_BASE}/recipes?${params}`)
    const json: RecipeListResponse = await res.json()
    return {
      recipes: json.data.map(mapRecipe),
      pagination: { total: json.total, totalPages: json.last_page, page: json.current_page },
    }
  } catch {
    return { recipes: [], pagination: { total: 0, totalPages: 0, page } }
  }
}

export async function getAllRecipeSlugs(): Promise<string[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/recipes?per_page=1000`)
    const json: RecipeListResponse = await res.json()
    return json.data.map(r => r.slug)
  } catch {
    return []
  }
}

export async function getRecipe(slug: string): Promise<{ recipe: Recipe; related: Recipe[] } | null> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/recipes/${encodeURIComponent(slug)}`)
    const json = await res.json()
    return {
      recipe: mapRecipe(json.recipe),
      related: (json.related || []).map(mapRecipe),
    }
  } catch {
    return null
  }
}

export async function getRecipeCategories(): Promise<RecipeCategory[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/recipe-categories`)
    const json = await res.json()
    return json.categories || []
  } catch {
    return []
  }
}
