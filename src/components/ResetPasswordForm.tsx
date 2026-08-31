import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const email = params.get('email') || ''
    const token = params.get('token') || ''

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email, token, password,
        password_confirmation: passwordConfirmation,
      })
      setDone(true)
    } catch (err: unknown) {
      if (err.errors) {
        setError(Object.values(err.errors).flat().join(', '))
      } else {
        setError(err.message || 'Erro ao redefinir senha')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div class="space-y-4 text-center py-4">
        <div class="text-5xl mb-2">✅</div>
        <p class="text-sm text-foreground font-medium">Senha redefinida com sucesso!</p>
        <p class="text-sm text-muted-foreground">Faça login com a sua nova senha.</p>
        <a href="/entrar" class="inline-block w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity text-center">
          Ir para o login
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      {error && (
        <div class="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800" role="alert">{error}</div>
      )}
      <div>
        <label for="reset-password" class="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Nova senha</label>
        <input id="reset-password" type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-shadow" placeholder="Mín. 8 caracteres" />
      </div>
      <div>
        <label for="reset-password-confirmation" class="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Confirmar nova senha</label>
        <input id="reset-password-confirmation" type="password" required autoComplete="new-password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-shadow" placeholder="Repita a senha" />
      </div>
      <button type="submit" disabled={loading}
        class="w-full py-2.5 px-4 bg-[var(--color-accent)] text-[var(--color-btn-text)] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? 'Redefinindo...' : 'Redefinir senha'}
      </button>
    </form>
  )
}
