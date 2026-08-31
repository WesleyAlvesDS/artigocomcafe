import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'

interface ForgotResponse {
  message: string
  reset_token?: string
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devToken, setDevToken] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post<ForgotResponse>('/auth/forgot-password', { email })
      setSent(true)
      if (data.reset_token) setDevToken(data.reset_token)
    } catch (err: unknown) {
      setError(err.message || 'Erro ao solicitar recuperação')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div class="space-y-4 text-center py-4">
        <div class="text-5xl mb-2">📬</div>
        <p class="text-sm text-foreground font-medium">E-mail enviado!</p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Se existir uma conta com este e-mail, você receberá um link para redefinir sua senha.
        </p>
        {devToken && (
          <div class="p-3 rounded-xl bg-muted/50 border border-border text-left">
            <p class="text-xs text-muted-foreground mb-1">Modo de desenvolvimento — use este link de redefinição:</p>
            <a
              href={`/recuperar-senha?email=${encodeURIComponent(email)}&token=${encodeURIComponent(devToken)}`}
              class="text-xs text-primary break-all hover:underline"
            >
              /recuperar-senha?email={email}&token={devToken}
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      {error && (
        <div class="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800" role="alert">{error}</div>
      )}
      <div>
        <label for="forgot-email" class="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Email</label>
        <input id="forgot-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-shadow" placeholder="seu@email.com" />
      </div>
      <button type="submit" disabled={loading}
        class="w-full py-2.5 px-4 bg-[var(--color-accent)] text-[var(--color-btn-text)] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </button>
    </form>
  )
}
