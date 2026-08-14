import AuthPage from './AuthPage'
import ReaderHeader from './ReaderHeader'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'
import { getCurrentVocabulary } from '../lib/themes'

interface GrainEntry { id: number; amount: number; type: string; source: string; description: string; created_at: string }
interface GrainData { balance: number; total_earned: number; total_spent: number; recent: GrainEntry[] }

function GrainsContent() {
  const [data, setData] = useState<GrainData | null>(null)
  const [vocab, setVocab] = useState(getCurrentVocabulary())
  useEffect(() => {
    api.get<GrainData>('/user/grains').then(setData).catch(() => {})
    setVocab(getCurrentVocabulary())
    const handler = () => setVocab(getCurrentVocabulary())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <div class="space-y-8">
      <ReaderHeader
        label={`🫘 ${vocab.currency}`}
        title={`Meus ${vocab.currency}`}
        subtitle={`Quanto mais você ${vocab.harvest.toLowerCase()}, mais ${vocab.currency.toLowerCase()} recebe`}
      />

      {/* Balance highlight card */}
      <div class="glass-card p-6 data-reveal relative overflow-hidden">
        <div class="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(circle at 50% 0%, var(--color-accent) 0%, transparent 60%)' }} />
        <div class="relative flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] flex items-center justify-center text-2xl shadow-lg">
              🫘
            </div>
            <div>
              <p class="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider mb-1">Saldo Disponível</p>
              <p class="text-4xl font-bold text-[var(--color-text-primary)] tabular-nums gradient-text">{data?.balance || 0}</p>
            </div>
          </div>
          <a href="/torrefacao" class="btn-primary ripple">
            {vocab.roasting} {vocab.currency}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>

      {/* Stats grid */}
      <div class="grid grid-cols-3 gap-4 animate-stagger">
        {[
          { label: vocab.harvest, value: data?.total_earned || 0, color: 'text-green-400' },
          { label: vocab.roast_action, value: data?.total_spent || 0, color: 'text-red-400' },
        ].map(item => (
          <div key={item.label} class="reader-card p-5 text-center group">
            <div class={`text-2xl font-bold tabular-nums ${item.color} group-hover:scale-110 transition-transform duration-300`}>{item.value}</div>
            <div class="text-xs text-[var(--color-text-muted)] mt-2 font-medium uppercase tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>

      {/* History */}
      <div class="glass-card p-6 data-reveal">
        <h2 class="text-lg font-bold text-[var(--color-text-primary)] mb-4">Histórico Recente</h2>
        {!data?.recent?.length ? (
          <div class="text-center py-8">
            <div class="text-4xl mb-3">🫘</div>
            <p class="text-sm text-[var(--color-text-muted)]">Complete leituras para ganhar {vocab.currency.toLowerCase()}.</p>
            <p class="text-xs text-[var(--color-text-muted)] mt-1">Cada artigo lido rende grãos que você pode trocar por recompensas!</p>
          </div>
        ) : (
          <div class="space-y-1">
            {data.recent.map(entry => (
              <div key={entry.id} class="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[var(--color-bg-card-hover)] transition-colors group">
                <div class="flex items-center gap-3">
                  <div class={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${entry.type === 'earned' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {entry.type === 'earned' ? '+' : '−'}
                  </div>
                  <div>
                    <p class="text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{entry.description}</p>
                    <p class="text-xs text-[var(--color-text-muted)]">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span class={`font-bold text-sm tabular-nums ${entry.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.type === 'earned' ? '+' : '-'}{entry.amount} {vocab.currency_icon}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function GrainsPage() { return <AuthPage><GrainsContent /></AuthPage> }
