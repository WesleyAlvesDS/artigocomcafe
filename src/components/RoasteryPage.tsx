import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import AuthPage from './AuthPage'
import { getCurrentVocabulary } from '../lib/themes'

interface Reward {
  id: number; name: string; slug: string; description: string | null
  type: string; category: string | null; icon: string | null; image_url: string | null
  content: Record<string, string> | null; grain_cost: number; rarity: string
  is_unlocked: boolean; is_active: boolean; unlocked_at: string | null
}

interface RoasteryData {
  rewards: Reward[]
  grouped: { themes: Reward[]; avatars: Reward[]; frames: Reward[]; specials: Reward[] }
  balance: number; total_earned: number; total_spent: number
  unlocked_count: number; total_count: number; active_count: number
}

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--color-text-muted)',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Comum', uncommon: 'Incomum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário',
}

const TYPE_LABELS: Record<string, string> = {
  themes: '🎨 Temas', avatars: '👤 Avatares', frames: '🖼️ Molduras', specials: '✨ Especiais',
}

function RoastModal({ reward, balance, onClose, onRoast }: {
  reward: Reward; balance: number; onClose: () => void; onRoast: () => void
}) {
  const [roasting, setRoasting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const canAfford = balance >= reward.grain_cost

  const handleRoast = async () => {
    setRoasting(true)
    setError('')
    try {
      await api.post(`/user/rewards/${reward.id}/roast`)
      setDone(true)
      setTimeout(() => { onRoast(); onClose() }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao torrar grãos')
    } finally {
      setRoasting(false)
    }
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div class="glass-card p-8 max-w-sm w-full text-center animate-slide-up" onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <div class="text-5xl mb-4 animate-pulse-glow">{reward.icon || '🎁'}</div>
            <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">{reward.name}</h2>
            <p class="text-sm text-[var(--color-text-secondary)] mb-4">{reward.description}</p>
            <div class="flex items-center justify-center gap-2 mb-4">
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${RARITY_COLORS[reward.rarity]}22`, color: RARITY_COLORS[reward.rarity] }}>
                {RARITY_LABELS[reward.rarity]}
              </span>
              <span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-semibold">
                🫘 {reward.grain_cost} grãos
              </span>
            </div>
            {error && (
              <p class="text-sm text-red-500 mb-3 bg-red-500/10 rounded-lg p-2">{error}</p>
            )}
            <button onClick={handleRoast} disabled={roasting || !canAfford}
              class="w-full py-3 px-6 rounded-xl font-bold text-lg transition-all disabled:opacity-40"
              style={{
                background: canAfford ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'var(--color-bg-card)',
                color: canAfford ? '#0a0a0f' : 'var(--color-text-muted)',
                border: canAfford ? 'none' : '1px solid var(--color-bg-card-border)',
              }}
              onMouseEnter={e => { if (canAfford) e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {roasting ? '☕ Torrando...' : `☕ Torrar ${reward.grain_cost} grãos`}
            </button>
            {!canAfford && !error && (
              <p class="text-xs text-[var(--color-text-muted)] mt-2">
                Faltam {reward.grain_cost - balance} grãos
              </p>
            )}
          </>
        ) : (
          <>
            <div class="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">Recompensa Desbloqueada!</h2>
            <p class="text-sm text-[var(--color-text-secondary)]">{reward.name} ativado com sucesso!</p>
          </>
        )}
      </div>
    </div>
  )
}

function RoasteryContent() {
  const [data, setData] = useState<RoasteryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('themes')
  const [roastTarget, setRoastTarget] = useState<Reward | null>(null)
  const [vocab, setVocab] = useState(getCurrentVocabulary())

  const loadData = () => {
    api.get<RoasteryData>('/user/rewards')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    setVocab(getCurrentVocabulary())
  }, [])

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p class="text-[var(--color-text-muted)]">Preparando a torrefação...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center glass-card p-8 max-w-md">
          <div class="text-4xl mb-4">☕</div>
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">Faça login para torrar seus grãos</h2>
          <p class="text-[var(--color-text-secondary)] mb-4">A Torrefação permite transformar seus grãos em recompensas exclusivas.</p>
          <a href="/entrar" class="btn-primary">Entrar</a>
        </div>
      </div>
    )
  }

  const activeRewards = data.grouped[activeTab as keyof typeof data.grouped] || []

  return (
    <div class="space-y-8">
      {/* Header */}
      <div class="text-center">
        <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">{vocab.roasting === 'Torrefação' ? '☕' : vocab.currency_icon} {vocab.roasting}</h1>          <p class="text-[var(--color-text-secondary)] mt-2">Transforme seus {vocab.currency.toLowerCase()} em recompensas exclusivas</p>
      </div>

      {/* Balance card */}
      <div class="glass-card p-6 text-center relative overflow-hidden">
        <div class="absolute inset-0 opacity-5"
          style={{ background: 'radial-gradient(circle at 50% 0%, #f59e0b 0%, transparent 70%)' }} />
        <div class="relative">
          <div class="text-5xl mb-2">🫘</div>
          <div class="text-4xl font-bold text-amber-500">{data.balance}</div>
          <div class="text-sm text-[var(--color-text-muted)]">{vocab.currency.toLowerCase()} disponíveis</div>
          <div class="flex justify-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
            <span>{vocab.harvest}: <strong class="text-green-500">+{data.total_earned}</strong></span>
            <span>{vocab.roast_action}: <strong class="text-amber-500">-{data.total_spent}</strong></span>
            <span>Desbloqueados: <strong class="text-[var(--color-accent)]">{data.unlocked_count}/{data.total_count}</strong></span>
          </div>
        </div>
      </div>

      {/* Rarity progress */}
      <div class="glass-card p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Progresso</h3>
        <div class="flex items-center gap-3">
          <div class="flex-1 h-2 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300"
              style={{ width: `${(data.unlocked_count / Math.max(1, data.total_count)) * 100}%` }} />
          </div>
          <span class="text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
            {data.unlocked_count}/{data.total_count}
          </span>
        </div>
      </div>

      {/* Type tabs */}
      <div class="flex flex-wrap gap-2">
        {Object.entries(TYPE_LABELS).map(([key, label]) => {
          const count = data.grouped[key as keyof typeof data.grouped]?.filter(r => r.is_unlocked).length || 0
          const total = data.grouped[key as keyof typeof data.grouped]?.length || 0
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              class={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] hover:border-amber-500/30'
              }`}
            >
              {label}
              <span class="ml-1.5 text-xs opacity-70">({count}/{total})</span>
            </button>
          )
        })}
      </div>

      {/* Rewards grid */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeRewards.map(reward => {
          const isUnlocked = reward.is_unlocked
          const isActive = reward.is_active
          const rarityColor = RARITY_COLORS[reward.rarity]

          return (
            <div key={reward.id}
              class={`glass-card p-4 transition-all duration-300 ${
                isActive ? 'ring-2 ring-amber-500/50' : ''
              } ${isUnlocked ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <div class="flex items-start gap-3">
                {/* Icon */}
                <div class={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  isUnlocked ? '' : 'grayscale opacity-50'
                }`}>
                  {reward.icon || '🎁'}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class={`font-semibold text-sm truncate ${
                      isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                    }`}>
                      {reward.name}
                    </h3>
                    {isActive && <span class="text-xs text-amber-500">● Ativo</span>}
                  </div>

                  <p class="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-2">{reward.description}</p>

                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${rarityColor}22`, color: rarityColor }}>
                        {RARITY_LABELS[reward.rarity]}
                      </span>
                      <span class="text-xs text-amber-500 font-medium">{vocab.currency_icon} {reward.grain_cost}</span>
                    </div>

                    {!isUnlocked ? (
                      <button onClick={() => setRoastTarget(reward)}
                        class="text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all
                          bg-gradient-to-r from-amber-600 to-amber-500 text-white
                          hover:from-amber-500 hover:to-amber-400 hover:scale-105
                          disabled:opacity-40 disabled:hover:scale-100"
                        disabled={data.balance < reward.grain_cost}
                      >
                        {vocab.roast_action}
                      </button>
                    ) : reward.type !== 'special' ? (
                      <button onClick={async () => {
                        try {
                          await api.post(`/user/rewards/${reward.id}/toggle`)
                          loadData()
                        } catch {}
                      }}
                        class={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                          isActive
                            ? 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-bg-card-border)]'
                            : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] hover:border-amber-500/50'
                        }`}
                      >
                        {isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    ) : (
                      <span class="text-[11px] text-green-500">✅</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {activeRewards.length === 0 && (
        <div class="text-center py-12 text-[var(--color-text-muted)]">
          <p>Nenhuma recompensa nesta categoria.</p>
        </div>
      )}

      {/* Roast Modal */}
      {roastTarget && (
        <RoastModal reward={roastTarget} balance={data.balance}
          onClose={() => setRoastTarget(null)}
          onRoast={loadData}
        />
      )}
    </div>
  )
}

export default function RoasteryPage() {
  return <AuthPage><RoasteryContent /></AuthPage>
}
