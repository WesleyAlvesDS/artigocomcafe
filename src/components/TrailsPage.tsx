import AuthPage from './AuthPage'
import ReaderHeader from './ReaderHeader'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'

interface Trail {
  id: number; title: string; slug: string; description: string
  icon: string | null; color: string | null; difficulty: string
  estimated_hours: number; grain_reward: number; articles_count: number
  recipes_count: number
  user_progress: number; is_completed: boolean
}

const difficultyConfig: Record<string, { color: string; label: string; bg: string }> = {
  beginner: { color: 'text-green-400', label: 'Iniciante', bg: 'rgba(52,211,153,0.1)' },
  iniciante: { color: 'text-green-400', label: 'Iniciante', bg: 'rgba(52,211,153,0.1)' },
  intermediate: { color: 'text-amber-400', label: 'Intermediário', bg: 'rgba(251,191,36,0.1)' },
  intermediario: { color: 'text-amber-400', label: 'Intermediário', bg: 'rgba(251,191,36,0.1)' },
  advanced: { color: 'text-red-400', label: 'Avançado', bg: 'rgba(248,113,113,0.1)' },
  avancado: { color: 'text-red-400', label: 'Avançado', bg: 'rgba(248,113,113,0.1)' },
}

function TrailsContent() {
  const [trails, setTrails] = useState<Trail[]>([])
  useEffect(() => { api.get<{ trails: Trail[] }>('/user/trails').then(d => setTrails(d.trails)).catch(() => {}) }, [])

  return (
    <div class="space-y-6">
      <ReaderHeader
        label="🎓 Trilhas"
        title="Trilhas de Conhecimento"
        subtitle="Aprenda de forma estruturada e acompanhe seu progresso"
      />

      {trails.length === 0 ? (
        <div class="empty-state data-reveal">
          <div class="empty-icon text-5xl mb-4">🗺️</div>
          <h3 class="empty-title">Nenhuma trilha disponível</h3>
          <p class="empty-desc">Explore o mapa para descobrir trilhas de conhecimento!</p>
        </div>
      ) : (
        <div class="space-y-4 animate-stagger">
          {trails.map(trail => {
            const dc = difficultyConfig[trail.difficulty] || { color: 'text-[var(--color-text-muted)]', label: trail.difficulty, bg: 'var(--color-bg-card)' }
            return (
              <div key={trail.id} class="glass-card p-6 group hover:border-[var(--color-accent)]/30 transition-all duration-300">
                <div class="flex items-start gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-10 h-10 rounded-xl bg-[var(--color-bg-card)] flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                        {trail.icon || '📚'}
                      </div>
                      <h3 class="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{trail.title}</h3>
                      {trail.is_completed && (
                        <span class="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                          ✓ Completa
                        </span>
                      )}
                    </div>
                    <p class="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">{trail.description}</p>
                    <div class="flex flex-wrap gap-2 text-xs">
                      <span class={`px-2.5 py-1 rounded-lg font-semibold ${dc.color}`} style={{ background: dc.bg }}>
                        {dc.label}
                      </span>
                      <span class="px-2.5 py-1 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] font-medium">
                        {trail.articles_count > 0 && trail.recipes_count > 0
                          ? `${trail.articles_count} artigos · ${trail.recipes_count} receitas`
                          : trail.recipes_count > 0
                            ? `${trail.recipes_count} receitas`
                            : `${trail.articles_count} artigos`}
                      </span>
                      <span class="px-2.5 py-1 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] font-medium">
                        ~{trail.estimated_hours}h
                      </span>
                      <span class="px-2.5 py-1 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold">
                        +{trail.grain_reward} grãos
                      </span>
                    </div>
                  </div>
                </div>
                <div class="mt-5 pt-4 border-t border-[var(--color-bg-card-border)]">
                  <div class="flex justify-between text-xs mb-2">
                    <span class="text-[var(--color-text-muted)] font-medium">Progresso</span>
                    <span class="text-[var(--color-accent)] font-bold tabular-nums">{trail.user_progress}%</span>
                  </div>
                  <div class="h-2.5 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] relative transition-all duration-700" style={{ width: `${trail.user_progress}%` }}>
                      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                    </div>
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

export default function TrailsPage() {
  return <TrailsContent />
}
