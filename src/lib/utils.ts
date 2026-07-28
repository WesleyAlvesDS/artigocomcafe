export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function readingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).length
  const wordsPerMinute = 200
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getImageUrl(post: {
  featured_media: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
      media_details?: {
        sizes?: Record<string, { source_url: string; width: number; height: number }>
      }
    }>
  }
}): { url: string | null; alt: string } {
  const media = post._embedded?.['wp:featuredmedia']?.[0]
  if (!media) return { url: null, alt: '' }

  const alt = media.alt_text || ''
  const sizes = media.media_details?.sizes

  if (sizes?.medium_large?.source_url) {
    return { url: sizes.medium_large.source_url, alt }
  }
  if (sizes?.medium?.source_url) {
    return { url: sizes.medium.source_url, alt }
  }
  if (sizes?.full?.source_url) {
    return { url: sizes.full.source_url, alt }
  }

  return { url: media.source_url, alt }
}

export function mapWpPost(post: import('./types').WPPost): import('./types').BlogPost {
  const excerpt = stripHtml(post.excerpt.rendered)
  const categories = post._embedded?.['wp:term']?.find(
    terms => terms[0]?.taxonomy === 'category'
  )?.map(t => ({ id: t.id, name: t.name, slug: t.slug })) ?? []

  const tags = post._embedded?.['wp:term']?.find(
    terms => terms[0]?.taxonomy === 'post_tag'
  )?.map(t => ({ id: t.id, name: t.name, slug: t.slug })) ?? []

  const { url: featuredImage, alt: featuredImageAlt } = getImageUrl(post)

  return {
    id: post.id,
    slug: post.slug,
    title: post.title.rendered,
    content: post.content.rendered,
    excerpt,
    date: post.date,
    modified: post.modified,
    featuredImage,
    featuredImageAlt,
    categories,
    tags,
    readingTime: readingTime(post.content.rendered)
  }
}
