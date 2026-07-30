import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import AuthPage from './AuthPage'
import { getCurrentVocabulary } from '../lib/themes'
import { useToast } from './Toast'

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
  const { addToast } = useToast()
  const vocab = getCurrentVocabulary()

  const loadMissions = () => {
    setLoading(true)
    api.get<{ missions: Mission[] }>('/user/missions/daily')
      .then(d => setMissions(d.missions || []))
      .catch(() => setMissions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMissions() }, [])

  const handleClaim = async (mission: Mission) => {
    try {
      const res = await api.post<{ grains: number }>(`/missions/${mission.id}/claim`)
      addToast({
        type: 'grain',
        title: `${vocab.currency_icon} +${res.grains} ${vocab.currency}!`,
        message: `Recompensa de "${mission.title}" resgatada!`,
        duration: 5000,
      })
      loadMissions()
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao resgatar',
        message: err.message || 'Tente novamente',
      })
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
      {/* Header */}
      <div class="text-center">
        <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Missões</h1>
        <p class="text-[var(--color-text-secondary)] mt-2">
          Complete missões diárias e semanais para ganhar {vocab.currency.toLowerCase()}
        </p>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-3 gap-4">
        {[
          { label: 'Disponíveis', value: filtered.filter(m => !m.is_completed).length, color: 'text-blue-500' },
          { label: 'Completas', value: completedMissions.length, color: 'text-green-500' },
          { label: 'Total', value: filtered.length, color: 'text-[var(--color-text-primary)]' },
        ].map(stat => (
          <div class="glass-card p-4 text-center">
            <div class={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div class="text-xs text-[var(--color-text-muted)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div class="flex gap-2">
        {(['daily', 'weekly'] as const).map(type => {
          const count = missions.filter(m => m.type === type && !m.is_completed).length
          return (
            <button key={type} onClick={() => setActiveTab(type)}
              class={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === type
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] hover:border-amber-500/30'
              }`}
            >
              {TYPE_ICONS[type]} {type === 'daily' ? 'Diárias' : 'Semanais'}
              {count > 0 && (
                <span class="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-500 rounded-full">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Missions list */}
      {filtered.length === 0 ? (
        <div class="text-center py-12 text-[var(--color-text-muted)]">
          <p class="text-4xl mb-3">🎯</p>
          <p>Nenhuma missão disponível no momento.</p>
          <p class="text-sm mt-1">Volte mais tarde para novas missões!</p>
        </div>
      ) : (
        <div class="space-y-3">
          {filtered.map(mission => {
            const percent = mission.target > 0 ? Math.round((mission.progress / mission.target) * 100) : 0
            return (
              <div key={mission.id}
                class={`glass-card p-5 transition-all ${
                  mission.is_completed ? 'ring-1 ring-green-500/30' : ''
                }`}
              >
                <div class="flex items-start gap-4">
                  <div class={`text-3xl ${mission.is_completed ? '' : 'opacity-70'}`}>{mission.icon}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <h3 class={`font-semibold text-[var(--color-text-primary)] ${mission.is_completed ? 'line-through text-green-500' : ''}`}>
                        {mission.title}
                      </h3>
                      <span class="text-xs font-medium text-amber-500 whitespace-nowrap">
                        +{mission.grain_reward} {vocab.currency_icon}
                      </span>
                    </div>
                    <p class="text-sm text-[var(--color-text-secondary)] mb-3">{mission.description}</p>

                    {/* Progress bar */}
                    <div class="flex items-center gap-3">
                      <div class="flex-1 h-2 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, percent)}%`,
                            background: mission.is_completed
                              ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                              : 'linear-gradient(90deg, #f59e0b, #d97706)',
                          }}
                        />
                      </div>
                      <span class="text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                        {mission.progress}/{mission.target}
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div class="flex-shrink-0">
                    {mission.is_completed ? (
                      <button onClick={() => handleClaim(mission)}
                        class="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 transition-all hover:scale-105"
                      >
                        Resgatar 🎉
                      </button>
                    ) : (
                      <div class="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-bg-card-border)]">
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
      <div class="glass-card p-5 bg-gradient-to-br from-amber-500/5 to-amber-600/5 border-amber-500/10">
        <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-2">💡 Dicas</h3>
        <ul class="text-xs text-[var(--color-text-secondary)] space-y-1">
          <li>• Missões diárias renovam a cada 24 horas</li>
          <li>• Missões semanais oferecem mais {vocab.currency.toLowerCase()}</li>
          <li>• Complete leituras e explore categorias para progredir</li>
        </ul>
      </div>
    </div>
  )
}

export default function MissionsPage() {
  return <AuthPage><MissionsContent /></AuthPage>
}
