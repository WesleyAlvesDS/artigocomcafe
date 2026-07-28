export interface WPPost {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  modified: string
  featured_media: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
      media_details?: {
        sizes?: Record<string, { source_url: string; width: number; height: number }>
      }
    }>
    'wp:term'?: Array<Array<{
      id: number
      name: string
      slug: string
      taxonomy: string
    }>>
  }
  categories?: number[]
  tags?: number[]
  meta?: {
    _yoast_wpseo_title?: string
    _yoast_wpseo_metadesc?: string
  }
}

export interface WPCategory {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  parent: number
}

export interface WPTag {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
}

export interface WPPageInfo {
  total: number
  totalPages: number
  page: number
}

export interface BlogPost {
  id: number
  slug: string
  title: string
  content: string
  excerpt: string
  date: string
  modified: string
  featuredImage: string | null
  featuredImageAlt: string
  categories: Array<{ id: number; name: string; slug: string }>
  tags: Array<{ id: number; name: string; slug: string }>
  readingTime: number
}

export interface BlogListResponse {
  posts: BlogPost[]
  pagination: WPPageInfo
}
