import AuthPage from './AuthPage'
import ReaderHeader from './ReaderHeader'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'

interface Achievement {
  id: number; name: string; slug: string; description: string
  icon: string; category: string; rarity: string; grain_reward: number; unlocked: boolean
}

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'rgba(184,134,85,0.08)', border: 'rgba(184,134,85,0.3)', text: 'var(--color-text-muted)', glow: 'rgba(184,134,85,0.15)' },
  uncommon: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.3)', text: '#34d399', glow: 'rgba(52,211,153,0.15)' },
  rare: { bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.3)', text: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
  epic: { bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.3)', text: '#c084fc', glow: 'rgba(192,132,252,0.15)' },
}

function AchievementsContent() {
  const [unlocked, setUnlocked] = useState<Achievement[]>([])
  const [locked, setLocked] = useState<Achievement[]>([])
  const [total, setTotal] = useState(0)
  const [count, setCount] = useState(0)
  const [showUnlocked, setShowUnlocked] = useState(true)
  const [showLocked, setShowLocked] = useState(true)

  useEffect(() => {
    api.get<{ unlocked: Achievement[]; locked: Achievement[]; total: number; unlocked_count: number }>('/user/achievements')
      .then(d => { setUnlocked(d.unlocked); setLocked(d.locked); setTotal(d.total); setCount(d.unlocked_count) })
      .catch(() => {})
  }, [])

  const percent = total > 0 ? (count / total) * 100 : 0

  return (
    <div class="space-y-6">
      <ReaderHeader
        label="🏆 Conquistas"
        title="Conquistas"
        subtitle={`${count} de ${total} desbloqueadas`}
      />

      <div class="glass-card p-6 data-reveal relative overflow-hidden">
        <div class="absolute inset-0 opacity-5"
          style={{ background: 'radial-gradient(circle at 50% 0%, var(--color-accent) 0%, transparent 70%)' }} />
        <div class="relative">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-bold text-[var(--color-text-primary)]">Progresso Total</span>
            <span class="text-xs font-mono text-[var(--color-accent)] tabular-nums">{count}/{total}</span>
          </div>
          <div class="h-3 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-secondary)] to-[var(--color-accent)] relative transition-all duration-700" style={{ width: `${percent}%` }}>
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          <p class="text-xs text-[var(--color-text-muted)] mt-2 text-center">{percent.toFixed(1)}% completo</p>
        </div>
      </div>

      {unlocked.length > 0 && (
        <div data-reveal>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-[var(--color-text-primary)]">Desbloqueadas ({unlocked.length})</h2>
            <button onClick={() => setShowUnlocked(!showUnlocked)} class="text-xs text-[var(--color-accent)] hover:underline">
              {showUnlocked ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showUnlocked && (
            <div class="grid sm:grid-cols-2 gap-3 animate-stagger">
              {unlocked.map(a => {
                const rarity = rarityColors[a.rarity] || rarityColors.common
                return (
                  <div key={a.id} class="glass-card p-4 group hover:border-[var(--color-accent)]/30" style={{ background: rarity.bg, borderColor: rarity.border }}>
                    <div class="flex items-center gap-3">
                      <div class="w-11 h-11 rounded-xl bg-[var(--color-bg-card)] flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                        {a.icon || '🏆'}
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-[var(--color-text-primary)] text-sm truncate">{a.name}</h3>
                        <p class="text-xs text-[var(--color-text-muted)] line-clamp-1">{a.description}</p>
                      </div>
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: rarity.glow, color: rarity.text }}>
                        {a.rarity}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {locked.length > 0 && (
        <div data-reveal>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-[var(--color-text-primary)]">Bloqueadas ({locked.length})</h2>
            <button onClick={() => setShowLocked(!showLocked)} class="text-xs text-[var(--color-accent)] hover:underline">
              {showLocked ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showLocked && (
            <div class="grid sm:grid-cols-2 gap-3 animate-stagger">
              {locked.map(a => (
                <div key={a.id} class="reader-card p-4 opacity-60 hover:opacity-80 transition-opacity">
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-xl bg-[var(--color-bg-card)] flex items-center justify-center text-xl">
                      🔒
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-[var(--color-text-primary)] text-sm truncate">{a.name}</h3>
                      <p class="text-xs text-[var(--color-text-muted)] line-clamp-1">{a.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {unlocked.length === 0 && locked.length === 0 && (
        <div class="empty-state data-reveal">
          <div class="empty-icon text-5xl mb-4">🏆</div>
          <h3 class="empty-title">Nenhuma conquista ainda</h3>
          <p class="empty-desc">Continue lendo e explorando para desbloquear conquistas exclusivas!</p>
        </div>
      )}
    </div>
  )
}

export default function AchievementsPage() { return <AuthPage><AchievementsContent /></AuthPage> }
