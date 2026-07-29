import type { ReactNode } from 'react'
import { AuthProvider } from '../lib/auth'
import AuthGuard from './AuthGuard'

export default function AuthPage({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard fallback={fallback}>
        {children}
      </AuthGuard>
    </AuthProvider>
  )
}
