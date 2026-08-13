import { showToast } from '../components/Toast'
import { resetThemeColors } from './themes'

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

// Endpoints em que 401 NÃO significa "sessão expirada" (são erros de
// credencial ou operação sem token). Nestes casos o erro é propagado para
// o form exibir a mensagem correta — sem toast nem redirecionamento.
const AUTH_401_EXEMPT = [
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
]

function isExpiredSession(endpoint: string, status: number): boolean {
  return status === 401 && !AUTH_401_EXEMPT.some(e => endpoint.startsWith(e))
}

// Limpa a sessão local, avisa a UI e leva o usuário para o login (preservando
// a origem via ?next=). Sem loop: se já estiver em /entrar, não redireciona.
let sessionExpiredHandled = false
function handleSessionExpired() {
  if (typeof window === 'undefined') return
  if (sessionExpiredHandled) return
  sessionExpiredHandled = true
  localStorage.removeItem('auth_token')
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: { authenticated: false } }))
  resetThemeColors()
  showToast('Sessão expirada', 'warning', {
    message: 'Sua sessão expirou. Faça login novamente para continuar.',
  })
  const here = window.location.pathname
  const loginPath = '/entrar'
  if (here === loginPath || here === loginPath + '/') return
  const origin = window.location.pathname + window.location.search
  // Pequeno atraso para o toast renderizar antes da navegação completa.
  setTimeout(() => {
    window.location.href = `/entrar/?next=${encodeURIComponent(origin)}`
  }, 350)
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

  // Handle 401 - token inválido/expirado (Sanctum: sem refresh, token é revogado)
  if (response.status === 401 && isExpiredSession(endpoint, 401)) {
    handleSessionExpired()
    throw new ApiError('Sessão expirada. Faça login novamente.', 401)
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