import { useState, useEffect, type FormEvent } from 'react'
import { api, setToken } from '../lib/api'
import { applyThemeColors, getStoredTheme } from '../lib/themes'

interface LoginResponse {
  token: string
  user: { theme?: string }
}

function getRedirectTarget(): string {
  if (typeof window === 'undefined') return '/'
  const url = new URL(window.location.href)
  const next = url.searchParams.get('next')
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/'
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post<LoginResponse>('/auth/login', { email, password })
      setToken(data.token)
      if (data.user?.theme) applyThemeColors(data.user.theme)
      window.location.href = getRedirectTarget()
    } catch (err: any) {
      if (err.errors?.email) {
        setError(Array.isArray(err.errors.email) ? err.errors.email[0] : String(err.errors.email))
      } else {
        setError(err.message || 'Erro ao entrar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {error && (
        <div class="p-3.5 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm animate-fade-in" role="alert">{error}</div>
      )}
      <div class="form-field">
        <label for="login-email" class="form-label">Email</label>
        <input id="login-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          class="form-input" placeholder="seu@email.com" />
      </div>
      <div class="form-field">
        <div class="flex items-center justify-between mb-2">
          <label for="login-password" class="form-label mb-0">Senha</label>
          <a href="/recuperar-senha" class="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-dark)] hover:underline transition-colors">Esqueceu a senha?</a>
        </div>
        <div class="relative">
          <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
            class="form-input pr-12" placeholder="Sua senha" />
          <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors"
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
      <button type="submit" disabled={loading} class="btn-primary w-full py-3">
        {loading ? (
          <>
            <span class="inline-block w-4 h-4 border-2 border-[var(--color-btn-text)]/30 border-t-[var(--color-btn-text)] rounded-full animate-spin" aria-hidden="true"></span>
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
