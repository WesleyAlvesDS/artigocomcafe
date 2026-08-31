import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import AuthPage from './AuthPage'
import ReaderHeader from './ReaderHeader'
import { getCurrentVocabulary } from '../lib/themes'
import { showToast } from './Toast'

interface Mission {
  id: number
  title: string
  description: string
  icon: string
  type: string
  grain_reward: number
  conditions: { action: string; target: number }
  progress: number
  target: number
  is_completed: boolean
  reward_claimed: boolean
}

const TYPE_ICONS: Record<string, string> = {
  daily: '📅',
  weekly: '📆',
}

function MissionsContent() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily')
  const vocab = getCurrentVocabulary()

  const loadMissions = () => {
    setLoading(true)
    const daily = api.get<{ missions: Mission[] }>('/user/missions/daily').then(d => d.missions || [])
    const weekly = api.get<{ missions: Mission[] }>('/user/missions/weekly').then(d => d.missions || [])
    Promise.all([daily, weekly]).then(([dailyMissions, weeklyMissions]) => {
      setMissions([...dailyMissions, ...weeklyMissions])
    }).catch(() => setMissions([])).finally(() => setLoading(false))
  }

  useEffect(() => { loadMissions() }, [])

  const handleClaim = async (mission: Mission) => {
    try {
      const res = await api.post<{ grains: number }>(`/missions/${mission.id}/claim`)
      showToast(`${vocab.currency_icon} +${res.grains} ${vocab.currency}!`, 'grain', {
        message: `Recompensa de "${mission.title}" resgatada!`,
        duration: 5000,
      })
      loadMissions()
    } catch (err: unknown) {
      showToast('Erro ao resgatar', 'error', { message: err.message || 'Tente novamente' })
    }
  }

  const filtered = missions.filter(m => m.type === activeTab)
  const completedMissions = missions.filter(m => m.is_completed && m.type === activeTab)

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[50vh]">
        <div class="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div class="space-y-8">
      <ReaderHeader
        label="🎯 Missões"
        title="Missões"
        subtitle={`Complete missões diárias e semanais para ganhar ${vocab.currency.toLowerCase()}`}
      />

      {/* Stats */}
      <div class="grid grid-cols-3 gap-4 data-reveal">
        {[
          { label: 'Disponíveis', value: filtered.filter(m => !m.is_completed).length, color: 'text-blue-400' },
          { label: 'Completas', value: completedMissions.length, color: 'text-green-400' },
          { label: 'Total', value: filtered.length, color: 'text-[var(--color-accent)]' },
        ].map(stat => (
          <div key={stat.label} class="reader-card p-5 text-center group">
            <div class={`text-3xl font-bold tabular-nums ${stat.color} group-hover:scale-110 transition-transform duration-300`}>{stat.value}</div>
            <div class="text-xs text-[var(--color-text-muted)] mt-2 font-medium uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Desafio da Semana (missão semanal em destaque) */}
      {(() => {
        const challenge = missions.find(m => m.type === 'weekly')
        if (!challenge) return null
        const cPercent = challenge.target > 0 ? Math.round((challenge.progress / challenge.target) * 100) : 0
        return (
          <div class="relative overflow-hidden rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[var(--color-bg-card)] to-[var(--color-bg-card)] data-reveal">
            <div class="absolute -top-10 -right-10 text-8xl opacity-10 select-none" aria-hidden="true">🏆</div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">🏆 Desafio da Semana</span>
              <span class="text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-1 rounded-lg">
                +{challenge.grain_reward} {vocab.currency_icon}
              </span>
            </div>
            <h3 class={`text-lg font-bold text-[var(--color-text-primary)] ${challenge.is_completed ? 'line-through text-green-400' : ''}`}>
              {challenge.title}
            </h3>
            <p class="text-sm text-[var(--color-text-secondary)] mt-1 mb-3">{challenge.description}</p>
            <div class="flex items-center gap-3">
              <div class="reader-progress-track flex-1">
                <div class="reader-progress-fill" style={{ width: `${Math.min(100, cPercent)}%` }} />
              </div>
              {challenge.is_completed ? (
                challenge.reward_claimed ? (
                  <span class="px-4 py-2 text-xs font-bold rounded-xl bg-green-500/15 text-green-400 border border-green-500/30 whitespace-nowrap">
                    ✓ Resgatada
                  </span>
                ) : (
                  <button onClick={() => handleClaim(challenge)}
                    class="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-105 shadow-lg shadow-amber-500/25 whitespace-nowrap"
                  >
                    Resgatar 🎉
                  </button>
                )
              ) : (
                <span class="text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap tabular-nums">
                  {challenge.progress}/{challenge.target} · {cPercent}%
                </span>
              )}
            </div>
          </div>
        )
      })()}

      {/* Tabs */}
      <div class="flex gap-2 flex-wrap data-reveal">
        {(['daily', 'weekly'] as const).map(type => {
          const count = missions.filter(m => m.type === type && !m.is_completed).length
          return (
              <button key={type} onClick={() => setActiveTab(type)}
                class={`reader-tab ${activeTab === type ? 'active' : ''}`}
            >
              {TYPE_ICONS[type]} {type === 'daily' ? 'Diárias' : 'Semanais'}
              {count > 0 && (
                <span class="ml-1.5 px-1.5 py-0.5 text-[10px] bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded-full font-bold">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Missions list */}
      {filtered.length === 0 ? (
        <div class="empty-state data-reveal">
          <div class="empty-icon text-5xl mb-4">🎯</div>
          <h3 class="empty-title">Nenhuma missão disponível</h3>
          <p class="empty-desc">Volte mais tarde para novas missões e continue sua jornada!</p>
        </div>
      ) : (
        <div class="space-y-3 animate-stagger">
          {filtered.map(mission => {
            const percent = mission.target > 0 ? Math.round((mission.progress / mission.target) * 100) : 0
            return (
              <div key={mission.id}
                class={`glass-card p-5 transition-all ${
                  mission.is_completed ? 'ring-1 ring-green-500/20' : ''
                }`}
              >
                <div class="flex items-start gap-4">
                  <div class={`text-3xl transition-all duration-300 ${mission.is_completed ? '' : 'opacity-70 group-hover:opacity-100'}`}>{mission.icon}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <h3 class={`font-bold text-[var(--color-text-primary)] ${mission.is_completed ? 'line-through text-green-400' : ''}`}>
                        {mission.title}
                      </h3>
                      <span class="text-xs font-bold text-[var(--color-accent)] whitespace-nowrap bg-[var(--color-accent)]/10 px-2 py-1 rounded-lg">
                        +{mission.grain_reward} {vocab.currency_icon}
                      </span>
                    </div>
                    <p class="text-sm text-[var(--color-text-secondary)] mb-3">{mission.description}</p>

                    <div class="flex items-center gap-3">
                      <div class="reader-progress-track flex-1">
                        <div class="reader-progress-fill relative" style={{ width: `${Math.min(100, percent)}%` }}>
                          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse opacity-60" />
                        </div>
                      </div>
                      <span class="text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap tabular-nums">
                        {mission.progress}/{mission.target}
                      </span>
                    </div>
                  </div>

                  <div class="flex-shrink-0">
                    {mission.is_completed ? (
                      mission.reward_claimed ? (
                        <span class="px-4 py-2 text-xs font-bold rounded-xl bg-green-500/15 text-green-400 border border-green-500/30 whitespace-nowrap">
                          ✓ Resgatada
                        </span>
                      ) : (
                        <button onClick={() => handleClaim(mission)}
                          class="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400 transition-all hover:scale-105 shadow-lg shadow-green-500/25"
                        >
                          Resgatar 🎉
                        </button>
                      )
                    ) : (
                      <div class="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-bg-card-border)] tabular-nums">
                        {percent}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tips */}
      <div class="glass-card p-5 data-reveal relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent rounded-full blur-xl" />
        <h3 class="text-sm font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
          <span class="text-lg">💡</span> Dicas
        </h3>
        <ul class="text-xs text-[var(--color-text-secondary)] space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-[var(--color-accent)] mt-0.5">▸</span>
            Missões diárias renovam a cada 24 horas
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[var(--color-accent)] mt-0.5">▸</span>
            Missões semanais oferecem mais {vocab.currency.toLowerCase()}
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[var(--color-accent)] mt-0.5">▸</span>
            Complete leituras e explore categorias para progredir
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function MissionsPage() {
  return <MissionsContent />
}
