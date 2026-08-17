// ── Livros (OpenLibrary via backend) — usado pelas páginas SEO /livro/[key]
// e pela seção de livros da home. Mesma estratégia do laravel.ts: fetch com
// retry + fallback vazio para o build SSG nunca falhar quando a API oscila.
import type { OpenLibraryBook, OpenLibraryWork } from './types'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://back.artigocomcafe.com/api'

// ── Cache em disco (build-time) ─────────────────────────────────────
// Cada página /livro/[key] busca a obra completa na OpenLibrary via backend;
// com a API lenta isso custava 20–30s por página (builds de 5+ minutos).
// Cacheamos as respostas em .book-cache/ (gitignored) por 7 dias: no build
// seguinte as páginas saem de disco e o build volta a segundos.
const CACHE_DIR = join(process.cwd(), '.book-cache')
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7 // 7 dias

interface CacheEntry { t: number; data: unknown }

function cacheGet<T>(key: string): T | null {
  try {
    const file = join(CACHE_DIR, `${key}.json`)
    if (!existsSync(file)) return null
    const entry = JSON.parse(readFileSync(file, 'utf8')) as CacheEntry
    if (!entry || typeof entry.t !== 'number' || Date.now() - entry.t > CACHE_TTL) return null
    return entry.data as T
  } catch {
    return null
  }
}

function cacheSet(key: string, data: unknown): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(join(CACHE_DIR, `${key}.json`), JSON.stringify({ t: Date.now(), data } as CacheEntry), 'utf8')
  } catch {
    /* cache é best-effort */
  }
}

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
  const cacheKey = `curated-${limit}`
  const cached = cacheGet<OpenLibraryBook[]>(cacheKey)
  if (cached) return cached
  try {
    const res = await fetchWithRetry(`${API_BASE}/integrations/library/explore?limit=${limit}`)
    const json = await res.json()
    const books = json?.data?.books || []
    const normalized = books.map((b: OpenLibraryBook) => ({ ...b, key: normBookKey(b.key) }))
    cacheSet(cacheKey, normalized)
    return normalized
  } catch {
    return []
  }
}

/** Curadoria + temas — usado pelo navegador client-side de /livros. */
export async function getLibraryExplore(limit = 30): Promise<{ books: OpenLibraryBook[]; themes: string[] }> {
  const cacheKey = `explore-${limit}`
  const cached = cacheGet<{ books: OpenLibraryBook[]; themes: string[] }>(cacheKey)
  if (cached) return cached
  try {
    const res = await fetchWithRetry(`${API_BASE}/integrations/library/explore?limit=${limit}`)
    const json = await res.json()
    const books = json?.data?.books || []
    const themes = json?.data?.themes || []
    const result = {
      books: books.map((b: OpenLibraryBook) => ({ ...b, key: normBookKey(b.key) })),
      themes,
    }
    cacheSet(cacheKey, result)
    return result
  } catch {
    return { books: [], themes: [] }
  }
}

/** Detalhes completos de uma work — usado no build da página /livro/[key]. */
export async function getBook(key: string): Promise<OpenLibraryWork | null> {
  const cacheKey = `book-${key}`
  const cached = cacheGet<OpenLibraryWork>(cacheKey)
  if (cached) return cached
  try {
    const res = await fetchWithRetry(`${API_BASE}/integrations/library/books/${encodeURIComponent(key)}`)
    if (!res.ok) return null
    const json = await res.json()
    if (!json?.data?.title) return null
    const book: OpenLibraryWork = {
      ...json.data,
      key: normBookKey(json.data.key) || key,
      // Autores podem vir como [{ key, name }] (work) ou string[] (search)
      authors: Array.isArray(json.data.authors)
        ? json.data.authors.map((a: string | { key?: string; name?: string }) =>
            typeof a === 'string' ? a : (a.name || a.key || ''))
        : [],
      subjects: Array.isArray(json.data.subjects) ? json.data.subjects : [],
    }
    cacheSet(cacheKey, book)
    return book
  } catch {
    return null
  }
}
