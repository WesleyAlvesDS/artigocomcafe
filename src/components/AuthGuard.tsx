import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'

export default function AuthGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user && !fallback) {
      window.location.href = '/entrar'
    }
  }, [user, loading, fallback])

  if (loading) {
    return (
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    if (fallback) return <>{fallback}</>
    return null
  }

  return <>{children}</>
}
