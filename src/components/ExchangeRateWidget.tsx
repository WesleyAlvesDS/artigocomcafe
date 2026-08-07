import { useState, useEffect } from 'react'

interface ExchangeRate {
  base: string
  code: string
  rate: number
  inverse: number | null
}

interface ExchangeData {
  base: string
  updated_at: string | null
  rates: ExchangeRate[]
  source?: string
  cached_at?: string
}

export default function ExchangeRateWidget({ compact = false, maxRates = 6 }: { compact?: boolean; maxRates?: number }) {
  const [rates, setRates] = useState<ExchangeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchExchange = () => {
    setLoading(true)
    setError(false)

    const cached = sessionStorage.getItem('public_exchange')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ExchangeData
        if (parsed.rates && parsed.rates.length > 0 && Date.now() - (parsed.cached_at ? Date.parse(parsed.cached_at) : 0) < 3600000) {
          setRates(parsed)
          setLoading(false)
          return
        }
      } catch {}
    }

    fetch('/api-proxy.php/integrations/exchange?base=BRL')
      .then(res => res.json())
      .then(d => {
        setRates(d.data)
        try { sessionStorage.setItem('public_exchange', JSON.stringify({ ...d.data, cached_at: new Date().toISOString() })) } catch {}
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchExchange()
  }, [])

  if (compact) {
    return (
      <div className="exchange-compact glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Câmbio
          </span>
          {loading ? (
            <div className="w-6 h-6 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          ) : error ? (
            <span className="text-2xl" aria-hidden="true">💱</span>
          ) : (
            <span className="text-2xl" aria-hidden="true">💱</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(maxRates)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-10 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
                <div className="h-4 w-16 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : !rates || !rates.rates || rates.rates.length === 0 ? (
          <div className="text-sm text-[var(--color-text-muted)]">Indisponível</div>
        ) : (
          <div className="divide-y divide-[var(--color-bg-card-border)]">
            {rates.rates.slice(0, maxRates).map(r => (
              <div key={r.code} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                <span className="text-xs font-mono bg-[var(--color-bg-card-border)]/30 px-2 py-0.5 rounded text-[var(--color-text-primary)]">
                  {r.code}
                </span>
                <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                  {r.rate.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
        {rates?.cached_at && (
          <p className="text-[10px] text-[var(--color-text-muted-dark)] mt-2 text-right">
            {rates.source}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Câmbio ao Vivo
          </span>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {rates ? `1 ${rates.base} para outras moedas` : 'Taxas de câmbio'}
          </p>
        </div>
        <span className="text-2xl" aria-hidden="true">💱</span>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[...Array(maxRates)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-10 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
              <div className="h-4 w-16 bg-[var(--color-bg-card-border)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">💱</span>
          <span className="text-sm text-[var(--color-text-muted)]">Indisponível</span>
          <button onClick={fetchExchange} className="text-xs font-medium text-[var(--color-accent)] hover:underline">
            Tentar
          </button>
        </div>
      ) : !rates || !rates.rates || rates.rates.length === 0 ? (
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">💱</span>
          <span className="text-sm text-[var(--color-text-muted)]">Indisponível no momento</span>
        </div>
      ) : (
        <>
          <div className="divide-y divide-[var(--color-bg-card-border)]">
            {rates.rates.slice(0, maxRates).map(r => (
              <div key={r.code} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono bg-[var(--color-bg-card-border)]/30 px-2 py-1 rounded text-[var(--color-text-primary)]">
                    {r.code}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">1 {r.base} =</span>
                </div>
                <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                  {r.rate.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
          {rates.cached_at && (
            <p className="text-[10px] text-[var(--color-text-muted-dark)] mt-3 text-right">
              atualizado · {rates.source}
            </p>
          )}
        </>
      )}
    </div>
  )
}