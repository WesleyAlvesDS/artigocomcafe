import type { WPPost, WPPageInfo, WPCategory, BlogListResponse, BlogPost } from './types'
import { mapWpPost } from './utils'

const WP_API = 'https://artigocomcafe.com/wp-json/wp/v2'
const TIMEOUT_MS = 10000

class WordPressError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message)
    this.name = 'WordPressError'
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchWP<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams(params).toString()
  const url = `${WP_API}${endpoint}${searchParams ? `?${searchParams}` : ''}`

  let response: Response
  try {
    response = await fetchWithTimeout(url)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new WordPressError('Timeout ao conectar com o WordPress', 408)
    }
    throw new WordPressError(
      'Erro de conexão com o WordPress',
      0,
      err instanceof Error ? err.message : 'Unknown error'
    )
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new WordPressError(
      `WordPress API: ${response.status} ${response.statusText}`,
      response.status,
      text.slice(0, 500)
    )
  }

  return response.json()
}

export async function getPosts(page = 1, perPage = 9, category?: string, search?: string): Promise<BlogListResponse> {
  const params: Record<string, string> = {
    _embed: 'wp:featuredmedia,wp:term',
    page: String(page),
    per_page: String(perPage),
    orderby: 'date',
    order: 'desc',
    status: 'publish'
  }

  if (category) params.categories = category
  if (search) params.search = search

  const response = await fetchWithTimeout(
    `${WP_API}/posts?${new URLSearchParams(params)}`
  )

  if (!response.ok) {
    if (response.status === 400) {
      return { posts: [], pagination: { total: 0, totalPages: 0, page } }
    }
    throw new WordPressError('Erro ao buscar posts', response.status)
  }

  const posts: WPPost[] = await response.json()
  const total = Number(response.headers.get('X-WP-Total') || '0')
  const totalPages = Number(response.headers.get('X-WP-TotalPages') || '0')

  return {
    posts: posts.map(mapWpPost),
    pagination: { total, totalPages, page }
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const posts: WPPost[] = await fetchWP('/posts', {
      slug,
      _embed: 'wp:featuredmedia,wp:term',
      status: 'publish'
    })

    if (!posts.length) return null
    return mapWpPost(posts[0])
  } catch {
    return null
  }
}

export async function getPostById(id: number): Promise<BlogPost | null> {
  try {
    const post: WPPost = await fetchWP(`/posts/${id}`, {
      _embed: 'wp:featuredmedia,wp:term'
    })
    return mapWpPost(post)
  } catch {
    return null
  }
}

export async function getCategories(): Promise<WPCategory[]> {
  try {
    return await fetchWP<WPCategory[]>('/categories', {
      per_page: '50',
      orderby: 'count',
      order: 'desc',
      hide_empty: 'true'
    })
  } catch {
    return []
  }
}

export async function getPageInfo(): Promise<WPPageInfo> {
  try {
    const response = await fetchWithTimeout(`${WP_API}/posts?per_page=1&status=publish`)
    return {
      total: Number(response.headers.get('X-WP-Total') || '0'),
      totalPages: Number(response.headers.get('X-WP-TotalPages') || '0'),
      page: 1
    }
  } catch {
    return { total: 0, totalPages: 0, page: 1 }
  }
}

function sanitizeSlug(slug: string): string {
  return slug
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

let slugMapCache: Record<string, string> | null = null

export async function getAllSlugs(): Promise<string[]> {
  const { totalPages } = await getPageInfo()
  const perPage = 100
  const slugs: string[] = []
  slugMapCache = {}

  for (let page = 1; page <= Math.min(totalPages, 10); page++) {
    try {
      const posts: WPPost[] = await fetchWP<WPPost[]>('/posts', {
        _fields: 'slug,id',
        per_page: String(perPage),
        page: String(page),
        status: 'publish'
      })
      for (const post of posts) {
        const safe = sanitizeSlug(post.slug)
        slugMapCache[safe] = post.slug
        slugs.push(safe)
      }
    } catch {
      continue
    }
  }

  return slugs
}

export function getOriginalSlug(sanitized: string): string {
  return slugMapCache?.[sanitized] ?? sanitized
}
