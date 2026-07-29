import AuthPage from './AuthPage'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'

interface Trail {
  id: number; title: string; slug: string; description: string
  icon: string | null; color: string | null; difficulty: string
  estimated_hours: number; grain_reward: number; articles_count: number
  user_progress: number; is_completed: boolean
}

const difficultyConfig: Record<string, { color: string; label: string }> = {
  beginner: { color: 'text-green-500 bg-green-50 dark:bg-green-950/30', label: 'Iniciante' },
  intermediate: { color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30', label: 'Intermediário' },
  advanced: { color: 'text-red-500 bg-red-50 dark:bg-red-950/30', label: 'Avançado' },
}

function TrailsContent() {
  const [trails, setTrails] = useState<Trail[]>([])
  useEffect(() => { api.get<{ trails: Trail[] }>('/user/trails').then(d => setTrails(d.trails)).catch(() => {}) }, [])

  return (
    <div class="space-y-6">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-foreground">Trilhas de Conhecimento</h1>
        <p class="text-muted-foreground mt-2">Aprenda de forma estruturada</p>
      </div>
      {trails.length === 0 ? (
        <div class="text-center py-16 text-muted-foreground">
          <p class="text-4xl mb-4">🗺️</p>
          <p>Nenhuma trilha disponível ainda.</p>
        </div>
      ) : (
        <div class="space-y-4">
          {trails.map(trail => {
            const dc = difficultyConfig[trail.difficulty] || { color: 'text-muted-foreground bg-muted', label: trail.difficulty }
            return (
              <div class="bg-card border border-border rounded-2xl p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xl">{trail.icon || '📚'}</span>
                      <h3 class="font-semibold text-foreground">{trail.title}</h3>
                      {trail.is_completed && <span class="text-green-500 text-sm">✓ Completa</span>}
                    </div>
                    <p class="text-sm text-muted-foreground mb-3">{trail.description}</p>
                    <div class="flex flex-wrap gap-2 text-xs">
                      <span class={`px-2 py-0.5 rounded-full ${dc.color}`}>{dc.label}</span>
                      <span class="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{trail.articles_count} artigos</span>
                      <span class="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">~{trail.estimated_hours}h</span>
                      <span class="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600">+{trail.grain_reward} grãos</span>
                    </div>
                  </div>
                </div>
                <div class="mt-4">
                  <div class="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span>{trail.user_progress}%</span>
                  </div>
                  <div class="w-full bg-muted rounded-full h-2">
                    <div class="bg-primary h-2 rounded-full transition-all" style={{ width: `${trail.user_progress}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TrailsPage() { return <AuthPage><TrailsContent /></AuthPage> }
