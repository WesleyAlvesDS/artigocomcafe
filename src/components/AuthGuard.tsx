import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { isAuthenticated } from '../lib/api'

export default function AuthGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, loading } = useAuth()
  const hasToken = isAuthenticated()

  useEffect(() => {
    // Só redireciona para login se realmente não há sessão (sem token).
    // Se há token mas /auth/me falhou por erro de rede, mantém o usuário na
    // página em vez de jogá-lo para /entrar indevidamente.
    if (!loading && !user && !fallback && !hasToken) {
      const next = window.location.pathname + window.location.search
      window.location.href = `/entrar?next=${encodeURIComponent(next)}`
    }
  }, [user, loading, fallback, hasToken])

  if (loading) {
    return (
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    // Com token presente mas usuário ainda não carregado (erro de rede no /auth/me),
    // mostra o fallback para o usuário navegar pelo site livremente.
    if (fallback) return <>{fallback}</>
    if (hasToken) return (
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
      </div>
    )
    return null
  }

  return <>{children}</>
}
