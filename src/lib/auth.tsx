import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { api, setToken } from './api'
import { applyThemeColors, resetThemeColors } from './themes'
import { ToastProvider } from '../components/Toast'

export interface User {
  id: number; name: string; username: string; email: string
  bio: string | null; avatar: string | null; theme: string
  reading_time_total: number; articles_read_count: number
  daily_streak: number; total_grains: number
  completed_trails: number; collections_count: number; achievements_count: number
}

interface AuthCtx {
  user: User | null; loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, username: string, email: string, password: string, theme?: string) => Promise<void>
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
        .then(d => {
          setUser(d.user)
          applyThemeColors(d.user.theme)
        })
        .catch(() => {
          setToken(null)
          resetThemeColors()
        })
        .finally(() => setLoading(false))
    } else {
      // Apply stored theme even when not logged in
      const storedTheme = localStorage.getItem('user_theme')
      if (storedTheme) applyThemeColors(storedTheme)
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const d = await api.post<{ user: User; token: string }>('/auth/login', { email, password })
    setToken(d.token)
    setUser(d.user)
    applyThemeColors(d.user.theme)
  }

  const register = async (name: string, username: string, email: string, password: string, theme?: string) => {
    const d = await api.post<{ user: User; token: string }>('/auth/register', {
      name, username, email, password,
      password_confirmation: password,
      theme: theme || 'cafe',
    })
    setToken(d.token)
    setUser(d.user)
    applyThemeColors(d.user.theme)
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    setToken(null)
    setUser(null)
    resetThemeColors()
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}><ToastProvider>{children}</ToastProvider></AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
