/**
 * Safe JSON parser — o api-proxy.php retorna 200 com body vazio (0 bytes),
 * o que crasha res.json() com "Unexpected end of JSON input" no undici.
 * Este helper lê o body como texto primeiro e só faz parse se houver conteúdo.
 */
export async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text()
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

/**
 * Safe fetch with retry + JSON parsing.
 * Returns parsed JSON or null on any failure.
 */
export async function safeFetchJson<T = unknown>(
  url: string,
  attempts = 3
): Promise<T | null> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(`HTTP ${res.status}`)
          await new Promise(r => setTimeout(r, 800 * 2 ** i))
          continue
        }
        return null
      }
      return await safeJson<T>(res)
    } catch (e) {
      lastError = e
      await new Promise(r => setTimeout(r, 800 * 2 ** i))
    }
  }
  return null
}
