import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import AuthPage from './AuthPage'
import ReaderHeader from './ReaderHeader'
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
  uncommon: '#34d399',
  rare: '#60a5fa',
  epic: '#c084fc',
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
  const vocab = getCurrentVocabulary()
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
      setError(err.message || `Erro ao ${vocab.roast_action.toLowerCase()}`)
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
            <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] flex items-center justify-center text-4xl animate-pulse-glow">
              {reward.icon || '🎁'}
            </div>
            <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">{reward.name}</h2>
            <p class="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">{reward.description}</p>
            <div class="flex items-center justify-center gap-2 mb-5">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: `${RARITY_COLORS[reward.rarity]}22`, color: RARITY_COLORS[reward.rarity] }}>
                {RARITY_LABELS[reward.rarity]}
              </span>
              <span class="px-2.5 py-1 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-bold">
                {vocab.currency_icon} {reward.grain_cost} {vocab.currency.toLowerCase()}
              </span>
            </div>
            {error && (
              <p class="text-sm text-red-500 mb-3 bg-red-500/10 rounded-lg p-2">{error}</p>
            )}
            <button onClick={handleRoast} disabled={roasting || !canAfford}
              class="w-full py-3 px-6 rounded-xl font-bold text-lg transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: canAfford ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))' : 'var(--color-bg-card)',
                color: canAfford ? 'var(--color-btn-text)' : 'var(--color-text-muted)',
                border: canAfford ? 'none' : '1px solid var(--color-bg-card-border)',
              }}
            >
              {roasting ? `${vocab.roast_action}...` : `${vocab.currency_icon} ${vocab.roast_action} ${reward.grain_cost} ${vocab.currency.toLowerCase()}`}
            </button>
            {!canAfford && !error && (
              <p class="text-xs text-[var(--color-text-muted)] mt-2">
                Faltam <strong class="text-[var(--color-text-primary)]">{reward.grain_cost - balance}</strong> {vocab.currency.toLowerCase()}
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
        <div class="text-center glass-card p-8 max-w-md data-reveal">
          <div class="text-4xl mb-4">☕</div>
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">Faça login para torrar seus grãos</h2>
          <p class="text-[var(--color-text-secondary)] mb-4">A Torrefação permite transformar seus grãos em recompensas exclusivas.</p>
          <a href="/entrar" class="btn-primary ripple">Entrar</a>
        </div>
      </div>
    )
  }

  const activeRewards = data.grouped[activeTab as keyof typeof data.grouped] || []

  return (
    <div class="space-y-8">
      <ReaderHeader
        label={`☕ ${vocab.roasting}`}
        title={vocab.roasting}
        subtitle={`Transforme seus ${vocab.currency.toLowerCase()} em recompensas exclusivas`}
      />

      {/* Balance card */}
      <div class="glass-card p-6 text-center relative overflow-hidden data-reveal">
        <div class="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(circle at 50% 0%, #f59e0b 0%, transparent 70%)' }} />
        <div class="relative">
          <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] flex items-center justify-center text-3xl shadow-lg animate-pulse-glow">
            🫘
          </div>
          <div class="text-5xl font-bold text-[var(--color-text-primary)] tabular-nums gradient-text mb-1">{data.balance}</div>
          <div class="text-sm text-[var(--color-text-muted)] mb-4">{vocab.currency.toLowerCase()} disponíveis</div>
          <div class="flex justify-center gap-6 text-xs text-[var(--color-text-muted)]">
            <span>{vocab.harvest}: <strong class="text-green-400">+{data.total_earned}</strong></span>
            <span>{vocab.roast_action}: <strong class="text-[var(--color-accent)]">-{data.total_spent}</strong></span>
            <span>Desbloqueados: <strong class="text-[var(--color-accent)]">{data.unlocked_count}/{data.total_count}</strong></span>
          </div>
        </div>
      </div>

      {/* Rarity progress */}
      <div class="glass-card p-4 data-reveal">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-[var(--color-text-primary)]">Coleção</h3>
          <span class="text-xs font-mono text-[var(--color-accent)] tabular-nums">{data.unlocked_count}/{data.total_count}</span>
        </div>
        <div class="h-2.5 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-secondary)] to-[var(--color-accent)] relative transition-all duration-700" style={{ width: `${(data.unlocked_count / Math.max(1, data.total_count)) * 100}%` }}>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>
        </div>
      </div>

      {/* Type tabs */}
      <div class="flex flex-wrap gap-2 data-reveal">
        {Object.entries(TYPE_LABELS).map(([key, label]) => {
          const count = data.grouped[key as keyof typeof data.grouped]?.filter(r => r.is_unlocked).length || 0
          const total = data.grouped[key as keyof typeof data.grouped]?.length || 0
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              class={`reader-tab ${activeTab === key ? 'active' : ''}`}
            >
              {label}
              <span class="ml-1.5 text-xs opacity-70 tabular-nums">({count}/{total})</span>
            </button>
          )
        })}
      </div>

      {/* Rewards grid */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
        {activeRewards.map(reward => {
          const isUnlocked = reward.is_unlocked
          const isActive = reward.is_active
          const rarityColor = RARITY_COLORS[reward.rarity]

          return (
            <div key={reward.id}
              class="glass-card p-4 transition-all duration-300 hover:border-[var(--color-accent)]/30"
            >
              <div class="flex items-start gap-3">
                <div class={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-[var(--color-bg-card)] transition-transform duration-300 group-hover:scale-110 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                  {reward.icon || '🎁'}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class={`font-bold text-sm truncate ${isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {reward.name}
                    </h3>
                    {isActive && <span class="text-xs text-amber-400 flex items-center gap-1">● Ativo</span>}
                  </div>

                  <p class="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-3 leading-relaxed">{reward.description}</p>

                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] px-2 py-0.5 rounded-lg font-bold"
                        style={{ background: `${rarityColor}22`, color: rarityColor }}>
                        {RARITY_LABELS[reward.rarity]}
                      </span>
                      <span class="text-xs text-[var(--color-accent)] font-bold">{vocab.currency_icon} {reward.grain_cost}</span>
                    </div>

                    {!isUnlocked ? (
                      <button onClick={() => setRoastTarget(reward)}
                        class="text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all
                          bg-gradient-to-r from-amber-600 to-amber-500 text-white
                          hover:from-amber-500 hover:to-amber-400 hover:scale-105
                          disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-amber-500/20"
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
                        class={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                          isActive
                            ? 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-bg-card-border)]'
                            : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] hover:border-[var(--color-accent)]/50'
                        }`}
                      >
                        {isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    ) : (
                      <span class="text-[11px] text-green-400 font-bold">✅</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {activeRewards.length === 0 && (
        <div class="empty-state data-reveal">
          <div class="empty-icon text-5xl mb-4">🎁</div>
          <h3 class="empty-title">Nenhuma recompensa nesta categoria</h3>
          <p class="empty-desc">Explore outras categorias ou colete mais grãos para desbloquear!</p>
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
