// ── Livros (OpenLibrary via backend) — usado pelas páginas SEO /livro/[key]
// e pela seção de livros da home. Mesma estratégia do laravel.ts: fetch com
// retry + fallback vazio para o build SSG nunca falhar quando a API oscila.
import type { OpenLibraryBook, OpenLibraryWork } from './types'

const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://back.artigocomcafe.com/api'

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (res.ok) return res
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}`)
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

/** Chave curta da OpenLibrary ("/works/OL123W" -> "OL123W"). */
export function normBookKey(raw?: string | null): string {
  const seg = (raw || '').replace(/^\//, '').split('/').pop() || ''
  return seg
}

/** URL da capa em um tamanho específico. */
export function bookCover(b?: OpenLibraryBook | OpenLibraryWork | null, size: 'S' | 'M' | 'L' = 'M'): string | null {
  const covers = b?.covers as { S?: string; M?: string; L?: string } | null | undefined
  if (covers?.[size]) return covers[size]
  if (size === 'L' && covers?.M) return covers.M
  if (size === 'L' && covers?.S) return covers.S
  return covers?.M || covers?.L || covers?.S || null
}

/** Curadoria automática (café, conhecimento etc.) — usada no build SSG. */
export async function getCuratedBooks(limit = 24): Promise<OpenLibraryBook[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/integrations/library/explore?limit=${limit}`)
    const json = await res.json()
    const books = json?.data?.books || []
    return books.map((b: OpenLibraryBook) => ({ ...b, key: normBookKey(b.key) }))
  } catch {
    return []
  }
}

/** Curadoria + temas — usado pelo navegador client-side de /livros. */
export async function getLibraryExplore(limit = 30): Promise<{ books: OpenLibraryBook[]; themes: string[] }> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/integrations/library/explore?limit=${limit}`)
    const json = await res.json()
    const books = json?.data?.books || []
    const themes = json?.data?.themes || []
    return {
      books: books.map((b: OpenLibraryBook) => ({ ...b, key: normBookKey(b.key) })),
      themes,
    }
  } catch {
    return { books: [], themes: [] }
  }
}

/** Detalhes completos de uma work — usado no build da página /livro/[key]. */
export async function getBook(key: string): Promise<OpenLibraryWork | null> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/integrations/library/books/${encodeURIComponent(key)}`)
    if (!res.ok) return null
    const json = await res.json()
    if (!json?.data?.title) return null
    return {
      ...json.data,
      key: normBookKey(json.data.key) || key,
      // Autores podem vir como [{ key, name }] (work) ou string[] (search)
      authors: Array.isArray(json.data.authors)
        ? json.data.authors.map((a: string | { key?: string; name?: string }) =>
            typeof a === 'string' ? a : (a.name || a.key || ''))
        : [],
      subjects: Array.isArray(json.data.subjects) ? json.data.subjects : [],
    }
  } catch {
    return null
  }
}
