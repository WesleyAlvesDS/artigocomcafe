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

export interface RecipeIngredient {
  name: string
  amount: string | null
  unit: string | null
  optional: boolean
}

export type RecipeStep = string | { description: string }

export interface Recipe {
  id: number
  title: string
  slug: string
  excerpt: string | null
  description: string | null
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  difficulty: 'facil' | 'media' | 'dificil' | string
  cover_image: string | null
  category: { id: number; name: string; slug: string; icon: string | null; color: string | null } | null
  tags: Array<{ id: number; name: string; slug: string }>
  meta?: {
    cuisine?: string | null
    source?: string | null
    source_url?: string | null
  } | null
  views_count: number
  published_at: string
}

export interface RecipeListResponse {
  data: Recipe[]
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface RecipeCategory {
  id: number
  name: string
  slug: string
  icon: string | null
  color: string | null
  recipes_count: number
}

/** Livro vindo da busca da OpenLibrary (via backend). */
export interface OpenLibraryBook {
  key: string | null
  title: string
  /** Título traduzido para pt-BR (auto-tradução no backend; null se já era pt). */
  title_pt?: string | null
  subtitle?: string | null
  subtitle_pt?: string | null
  authors: string[]
  first_publish_year?: number | null
  subjects: string[]
  isbn?: string[]
  cover_id?: number | null
  covers?: { S?: string; M?: string; L?: string } | null
  rating_avg?: number | null
  rating_count?: number | null
  edition_count?: number | null
  languages?: string[]
}

/** Uma edição/versão de uma work da OpenLibrary (via backend). */
export interface OpenLibraryEdition {
  key: string | null
  edition_name?: string | null
  publish_date?: string | null
  year?: number | null
  publishers?: string[]
  physical_format?: string | null
  number_of_pages?: number | null
  languages?: string[]
  isbn?: string[]
  cover_id?: number | null
}

/** Detalhes completos de uma work da OpenLibrary (via backend). */
export interface OpenLibraryWork {
  key: string | null
  title: string
  title_pt?: string | null
  subtitle?: string | null
  subtitle_pt?: string | null
  description?: string | null
  description_pt?: string | null
  first_publish_year?: number | string | null
  authors: string[]
  subjects: string[]
  subject_places?: string[]
  subject_people?: string[]
  excerpts?: unknown[]
  links?: Array<{ title?: string; url?: string }>
  cover_id?: number | null
  covers?: { S?: string; M?: string; L?: string } | null
  editions_count?: number | null
  editions?: OpenLibraryEdition[]
}
