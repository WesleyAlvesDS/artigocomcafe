import AuthPage from './AuthPage'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'

interface Achievement {
  id: number; name: string; slug: string; description: string
  icon: string; category: string; rarity: string; grain_reward: number; unlocked: boolean
}

const rarityColors: Record<string, string> = {
  common: 'background: var(--color-bg-card); border-color: var(--color-bg-card-border)',
  uncommon: 'background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.3)',
  rare: 'background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.3)',
  epic: 'background: rgba(168,85,247,0.08); border-color: rgba(168,85,247,0.3)',
}

function AchievementsContent() {
  const [unlocked, setUnlocked] = useState<Achievement[]>([])
  const [locked, setLocked] = useState<Achievement[]>([])
  const [total, setTotal] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    api.get<{ unlocked: Achievement[]; locked: Achievement[]; total: number; unlocked_count: number }>('/user/achievements')
      .then(d => { setUnlocked(d.unlocked); setLocked(d.locked); setTotal(d.total); setCount(d.unlocked_count) })
      .catch(() => {})
  }, [])

  return (
    <div class="space-y-6">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-foreground">Conquistas</h1>
        <p class="text-muted-foreground mt-2">{count} de {total} desbloqueadas</p>
      </div>
      <div class="bg-card border border-border rounded-2xl p-6">
        <div class="w-full bg-muted rounded-full h-3">
          <div class="bg-primary h-3 rounded-full transition-all" style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }} />
        </div>
      </div>
      {unlocked.length > 0 && (
        <>
          <h2 class="font-semibold text-foreground">Desbloqueadas ({unlocked.length})</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            {unlocked.map(a => (
              <div class={`rounded-2xl p-4 border ${rarityColors[a.rarity] || rarityColors.common}`}>
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{a.icon || '🏆'}</span>
                  <div><h3 class="font-semibold text-foreground text-sm">{a.name}</h3><p class="text-xs text-muted-foreground">{a.description}</p></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {locked.length > 0 && (
        <>
          <h2 class="font-semibold text-foreground">Bloqueadas ({locked.length})</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            {locked.map(a => (
              <div class="rounded-2xl p-4 border border-border bg-card opacity-60">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🔒</span>
                  <div><h3 class="font-semibold text-foreground text-sm">{a.name}</h3><p class="text-xs text-muted-foreground">{a.description}</p></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function AchievementsPage() { return <AuthPage><AchievementsContent /></AuthPage> }
