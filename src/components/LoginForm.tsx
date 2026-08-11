import { useState, useEffect, type FormEvent } from 'react'
import { api, setToken, isAuthenticated } from '../lib/api'
import { applyThemeColors, getStoredTheme, resetThemeColors } from '../lib/themes'
import { showToast } from '../components/Toast'

interface LoginResponse {
  token: string
  user: { theme?: string }
}

/**
 * Destino após o login:
 * - respeita o parâmetro `?next=` (quando seguro) para voltar à página de origem;
 * - caso contrário, leva o usuário direto para o Dashboard (painel do leitor),
 *   que é a melhor experiência pós-login.
 */
function getRedirectTarget(): string {
  if (typeof window === 'undefined') return '/dashboard/'
  const url = new URL(window.location.href)
  const next = url.searchParams.get('next')
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/dashboard/'
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    applyThemeColors(getStoredTheme())
  }, [])

  // Usuário já autenticado não precisa ver a página de login — vai direto
  // para o destino (dashboard ou `?next=`). A aresta /entrar → já logado →
  // conteúdo não faz sentido, então fechamos esse ciclo aqui. A chamada a
  // /auth/me valida o token: se estiver expirado, o token é limpo e o
  // usuário continua na página de login (sem loop de redirecionamento).
  useEffect(() => {
    if (!isAuthenticated()) return
    let cancelled = false
    api.get('/auth/me')
      .then(() => {
        if (!cancelled) window.location.href = getRedirectTarget()
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null)
          resetThemeColors()
        }
      })
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.postForm<LoginResponse>('/auth/login', { email, password })
      setToken(data.token)
      if (data.user?.theme) applyThemeColors(data.user.theme)
      showToast('Bem-vindo de volta! ☕', 'success')
      window.location.href = getRedirectTarget()
    } catch (err: any) {
      if (err.errors?.email) {
        setError(Array.isArray(err.errors.email) ? err.errors.email[0] : String(err.errors.email))
      } else if (err.status === 401) {
        setError('Email ou senha incorretos')
      } else {
        setError(err.message || 'Erro ao entrar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form" noValidate>
      {error && (
        <div className="form-error" role="alert">{error}</div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">Email</label>
          <input id="login-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            className="form-input" placeholder="seu@email.com" />
        </div>
        <div className="form-group">
          <label htmlFor="login-password" className="form-label">Senha</label>
          <div className="relative">
            <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
              className="form-input pr-12" placeholder="Sua senha" />
            <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="form-group">
        <a href="/recuperar-senha" className="form-help-link">Esqueceu a senha?</a>
      </div>
      <button type="submit" disabled={loading} className="btn-primary form-submit">
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-[var(--color-btn-text)]/30 border-t-[var(--color-btn-text)] rounded-full animate-spin" aria-hidden="true"></span>
            Entrando...
          </>
        ) : (
          <>
            Entrar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}