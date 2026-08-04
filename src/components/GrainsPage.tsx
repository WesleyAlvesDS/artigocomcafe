import AuthPage from './AuthPage'
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
      <div class="text-center">
        <h1 class="text-3xl font-bold text-foreground">Meus {vocab.currency}</h1>
        <p class="text-muted-foreground mt-2">Quanto mais você {vocab.harvest.toLowerCase()}, mais {vocab.currency.toLowerCase()} recebe</p>
      </div>
      <div class="grid grid-cols-3 gap-4">
        {[
          { label: 'Saldo', value: data?.balance || 0, color: 'text-amber-400' },
          { label: vocab.harvest, value: data?.total_earned || 0, color: 'text-green-400' },
          { label: vocab.roast_action, value: data?.total_spent || 0, color: 'text-red-400' },
        ].map(item => (
          <div class="bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-2xl p-6 text-center">
            <div class={`text-3xl font-bold ${item.color}`}>{item.value}</div>
            <div class="text-xs text-muted-foreground mt-1">{item.label}</div>
          </div>
        ))}
      </div>
      <div class="bg-card border border-border rounded-2xl p-6">
        <h2 class="font-semibold text-foreground mb-4">Histórico</h2>
        {!data?.recent?.length ? (
          <p class="text-muted-foreground text-center py-8">Complete leituras para ganhar {vocab.currency.toLowerCase()}.</p>
        ) : (
          <div class="space-y-3">
            {data.recent.map(entry => (
              <div class="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p class="text-sm text-foreground">{entry.description}</p>
                  <p class="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <span class={`font-bold text-sm ${entry.type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
                  {entry.type === 'earned' ? '+' : '-'}{entry.amount} {vocab.currency_icon}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div class="text-center">
        <a href="/torrefacao" class="btn-primary">
          {vocab.roasting} {vocab.currency}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default function GrainsPage() { return <AuthPage><GrainsContent /></AuthPage> }
