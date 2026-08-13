const API_URL = '/api-proxy.php'

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('auth_token')
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string | null) => void> = []

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retryAttempt = 0
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (networkErr) {
    // Falha de rede — só GET é seguro para retry automático
    if (retryAttempt < 2 && (!options.method || options.method === 'GET')) {
      await new Promise(r => setTimeout(r, 600 * (retryAttempt + 1)))
      return request<T>(endpoint, options, retryAttempt + 1)
    }
    throw new ApiError('Falha de conexão com a API', 0)
  }

  // Retry para 503/502/429 transitórios (PHP-FPM compartilhado sob rajada)
  if (
    (response.status === 503 || response.status === 502 || response.status === 429) &&
    retryAttempt < 2 &&
    (!options.method || options.method === 'GET')
  ) {
    await new Promise(r => setTimeout(r, 600 * (retryAttempt + 1)))
    return request<T>(endpoint, options, retryAttempt + 1)
  }

  // Handle 401 - token expirado
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshResp = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        })
        if (refreshResp.ok) {
          const data = await refreshResp.json()
          if (data.token) {
            localStorage.setItem('auth_token', data.token)
            onTokenRefreshed(data.token)
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${data.token}`
            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
              ...options,
              headers,
            })
            isRefreshing = false
            if (!retryResponse.ok) {
              const body = await retryResponse.json().catch(() => ({}))
              throw new ApiError(
                body.message || `API Error: ${retryResponse.status}`,
                retryResponse.status,
                body.errors
              )
            }
            return retryResponse.json()
          }
        }
        // Refresh failed - clear auth
        localStorage.removeItem('auth_token')
        onTokenRefreshed(null)
        if (typeof window !== 'undefined') {
          window.location.href = '/entrar/'
        }
      } catch {
        localStorage.removeItem('auth_token')
        onTokenRefreshed(null)
        if (typeof window !== 'undefined') {
          window.location.href = '/entrar/'
        }
      } finally {
        isRefreshing = false
      }
    } else {
      // Wait for refresh to complete
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`
            fetch(`${API_URL}${endpoint}`, { ...options, headers })
              .then(r => r.json())
              .then(resolve)
              .catch(reject)
          } else {
            reject(new ApiError('Sessão expirada', 401))
          }
        })
      })
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(
      body.message || `API Error: ${response.status}`,
      response.status,
      body.errors
    )
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  postForm: <T>(endpoint: string, data: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString()
    }),
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'DELETE', body: data ? JSON.stringify(data) : undefined }),
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
  // Avisa componentes (ex.: Header/menu mobile) para reavaliar o estado autenticado.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { authenticated: !!token } }))
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export { ApiError }