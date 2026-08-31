import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { api, setToken, isAuthenticated, ApiError } from './api'
import { applyThemeColors, resetThemeColors, getStoredTheme } from './themes'
import { showToast } from '../components/Toast'

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
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>(null!)

let refreshPromise: Promise<void> | null = null

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      const storedTheme = getStoredTheme()
      if (storedTheme) applyThemeColors(storedTheme)
      setLoading(false)
      return
    }

    try {
      const d = await api.get<{ user: User }>('/auth/me')
      setUser(d.user)
      applyThemeColors(d.user.theme)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setToken(null)
        resetThemeColors()
        setUser(null)
      } else {
        // Erro de rede - mantém token mas não define usuário
        const storedTheme = getStoredTheme()
        if (storedTheme) applyThemeColors(storedTheme)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

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
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignora erro de rede - limpa local mesmo assim
    } finally {
      setToken(null)
      setUser(null)
      resetThemeColors()
      // Redireciona para a home para o usuário navegar livremente pelo site
      if (window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/'
      }
    }
  }

  const refreshUser = async () => {
    if (refreshPromise) return refreshPromise
    refreshPromise = (async () => {
      try {
        const d = await api.get<{ user: User }>('/auth/me')
        setUser(d.user)
        applyThemeColors(d.user.theme)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setToken(null)
          resetThemeColors()
          setUser(null)
          showToast('Sessão expirada. Faça login novamente.', 'warning')
        }
      }
    })()
    try {
      await refreshPromise
    } finally {
      refreshPromise = null
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>
}

const defaultAuthCtx: AuthCtx = {
  user: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // Retorna fallback seguro durante SSR/SSG quando AuthProvider não está montado
    return defaultAuthCtx
  }
  return ctx
}