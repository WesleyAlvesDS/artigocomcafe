import AuthPage from './AuthPage'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'

interface DashboardData {
  evolution: {
    total_grains: number; articles_read: number; reading_time_hours: number
    trails_completed: number; achievements_unlocked: number; daily_streak: number
    collections_count: number; categories_explored: number
  }
}

function ProfileContent() {
  const { user, logout } = useAuth()
  const [dash, setDash] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get<DashboardData>('/user/dashboard').then(setDash).catch(() => {})
  }, [])

  const s = dash?.evolution

  return (
    <div class="space-y-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-foreground">{user?.name}</h1>
            <p class="text-muted-foreground">@{user?.username} &middot; {s?.daily_streak || 0} dias seguidos 🔥</p>
          </div>
        </div>
        <button onClick={logout} class="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-border transition-colors">Sair</button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Grãos', value: s?.total_grains || 0, icon: '🫘' },
          { label: 'Artigos Lidos', value: s?.articles_read || 0, icon: '📖' },
          { label: 'Horas de Leitura', value: s?.reading_time_hours || 0, icon: '⏱️' },
          { label: 'Trilhas Completas', value: s?.trails_completed || 0, icon: '🎯' },
          { label: 'Conquistas', value: s?.achievements_unlocked || 0, icon: '🏆' },
          { label: 'Coleções', value: s?.collections_count || 0, icon: '📚' },
          { label: 'Categorias', value: s?.categories_explored || 0, icon: '🌍' },
        ].map(stat => (
          <div class="bg-card border border-border rounded-2xl p-4 text-center">
            <div class="text-2xl mb-1">{stat.icon}</div>
            <div class="text-2xl font-bold text-foreground">{stat.value}</div>
            <div class="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div class="bg-card border border-border rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-foreground mb-4">Índice de Evolução</h2>
        <p class="text-muted-foreground">
          Você já investiu <strong class="text-foreground">{s?.reading_time_hours || 0} horas</strong> em aprendizado,
          concluiu <strong class="text-foreground">{s?.trails_completed || 0} trilhas</strong>
          e explorou <strong class="text-foreground">{s?.categories_explored || 0} categorias</strong>.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <a href="/biblioteca" class="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">Minha Biblioteca</a>
        <a href="/graos" class="px-5 py-2.5 bg-card border border-border text-foreground rounded-xl font-medium hover:bg-accent transition-colors">Meus Grãos</a>
        <a href="/conquistas" class="px-5 py-2.5 bg-card border border-border text-foreground rounded-xl font-medium hover:bg-accent transition-colors">Conquistas</a>
        <a href="/trilhas" class="px-5 py-2.5 bg-card border border-border text-foreground rounded-xl font-medium hover:bg-accent transition-colors">Trilhas</a>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return <AuthPage><ProfileContent /></AuthPage>
}
