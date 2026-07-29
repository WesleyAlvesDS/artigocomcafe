import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { api, setToken } from './api'

interface User {
  id: number; name: string; username: string; email: string
  bio: string | null; avatar: string | null; theme: string
  reading_time_total: number; articles_read_count: number
  daily_streak: number; total_grains: number
  completed_trails: number; collections_count: number; achievements_count: number
}

interface AuthCtx {
  user: User | null; loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      api.get<{ user: User }>('/auth/me')
        .then(d => setUser(d.user))
        .catch(() => setToken(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const d = await api.post<{ user: User; token: string }>('/auth/login', { email, password })
    setToken(d.token); setUser(d.user)
  }

  const register = async (name: string, username: string, email: string, password: string) => {
    const d = await api.post<{ user: User; token: string }>('/auth/register', { name, username, email, password, password_confirmation: password })
    setToken(d.token); setUser(d.user)
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    setToken(null); setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
