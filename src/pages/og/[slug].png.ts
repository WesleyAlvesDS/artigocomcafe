import type { APIRoute } from 'astro'
import { generateOgImage } from '../../lib/og'

interface ArticleData {
  slug: string
  title: string
  category: string | null
  readingTime: number
}

let _articlesCache: ArticleData[] | null = null

async function getAllArticles(): Promise<ArticleData[]> {
  if (_articlesCache) return _articlesCache

  const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://back.artigocomcafe.com/api'
  const res = await fetch(`${API_BASE}/articles?per_page=100`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    console.error('[OG] API returned', res.status)
    return []
  }

  const json = await res.json()
  const articles: ArticleData[] = json.data.map((a: any) => ({
    slug: a.slug,
    title: a.title,
    category: a.category?.name || null,
    readingTime: parseInt(a.reading_time) || 5,
  }))

  _articlesCache = articles
  return articles
}

export async function getStaticPaths() {
  const articles = await getAllArticles()
  return articles.map((article: ArticleData) => ({
    params: { slug: article.slug },
    props: {
      title: article.title,
      category: article.category,
      readingTime: article.readingTime,
    },
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const { title, category, readingTime } = props as ArticleData

  try {
    const pngBuffer = await generateOgImage({
      title: title,
      category: category || undefined,
      readingTime: readingTime,
    })

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[OG] Generation error:', error)
    // Return a simple fallback PNG
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#16110c"/><text x="600" y="315" font-family="sans-serif" font-size="48" fill="#d4a373" text-anchor="middle" dominant-baseline="middle">Artigo com Café</text></svg>',
      {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
  }
}
