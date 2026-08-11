import { useState, useEffect, useMemo } from 'react'

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

const CURRENCY_NAMES: Record<string, string> = {
  BRL: 'Real brasileiro',
  USD: 'Dólar americano',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  JPY: 'Iene japonês',
  CNY: 'Yuan chinês',
  ARS: 'Peso argentino',
  CAD: 'Dólar canadense',
  AUD: 'Dólar australiano',
  CHF: 'Franco suíço',
  MXN: 'Peso mexicano',
  CLP: 'Peso chileno',
  COP: 'Peso colombiano',
  PEN: 'Sol peruano',
  UYU: 'Peso uruguaio',
  INR: 'Rupia indiana',
  KRW: 'Won sul-coreano',
  HKD: 'Dólar de Hong Kong',
  SGD: 'Dólar de Singapura',
  AED: 'Dirham dos Emirados',
  TRY: 'Lira turca',
  PLN: 'Zloty polonês',
  SEK: 'Coroa sueca',
  NOK: 'Coroa norueguesa',
  DKK: 'Coroa dinamarquesa',
  ZAR: 'Rand sul-africano',
}

function formatCurrency(code: string, value: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).format(value)
  } catch {
    return `${code} ${value.toFixed(2)}`
  }
}

function toRateMap(rates: ExchangeRate[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of rates) map[r.code] = r.rate
  return map
}

export default function ExchangeRateWidget({ compact = false, maxRates = 6 }: { compact?: boolean; maxRates?: number }) {
  const [rates, setRates] = useState<ExchangeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<'list' | 'converter'>('list')
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('BRL')
  const [to, setTo] = useState('USD')

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

  const currencies = useMemo(() => {
    if (!rates || !rates.rates) return []
    const codes = rates.rates.map(r => r.code)
    if (rates.base && !codes.includes(rates.base)) codes.unshift(rates.base)
    return codes
  }, [rates])

  const rateMap = useMemo(() => {
    if (!rates || !rates.rates) return { [from]: 1, [to]: 1 }
    const map = toRateMap(rates.rates)
    if (rates.base) map[rates.base] = 1
    return map
  }, [rates, from, to])

  const conversion = useMemo(() => {
    const parsed = parseFloat(amount.replace(',', '.'))
    const fromRate = rateMap[from]
    const toRate = rateMap[to]
    if (isNaN(parsed) || parsed < 0 || fromRate == null || toRate == null || toRate === 0) return null
    return { value: parsed * (toRate / fromRate), unit: toRate / fromRate }
  }, [amount, from, to, rateMap])

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  const selectClass = compact
    ? 'flex-1 min-w-0 px-2 py-1.5 text-xs font-semibold bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-lg text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] cursor-pointer'
    : 'flex-1 min-w-0 px-2.5 py-2 text-sm font-semibold bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-lg text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] cursor-pointer'

  const tabClass = (active: boolean) =>
    `flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
      active
        ? 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
    }`

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

      <div className="flex bg-[var(--color-bg-card)] rounded-lg p-1 mb-4" role="tablist" aria-label="Ferramenta de câmbio">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'list'}
          onClick={() => setTab('list')}
          className={tabClass(tab === 'list')}
        >
          Câmbio
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'converter'}
          onClick={() => setTab('converter')}
          className={tabClass(tab === 'converter')}
        >
          Conversor
        </button>
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
      ) : tab === 'list' ? (
        <>
          <div className="divide-y divide-[var(--color-bg-card-border)]">
            {rates.rates.slice(0, maxRates).map(r => (
              <div key={r.code} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono bg-[var(--color-bg-card-border)]/30 px-2 py-1 rounded text-[var(--color-text-primary)]">
                    {r.code}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">{CURRENCY_NAMES[r.code] || r.code}</span>
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
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="conv-amount" className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
              Valor
            </label>
            <input
              id="conv-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-lg font-bold tabular-nums bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-lg text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              placeholder="100"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <label htmlFor="conv-from" className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                De
              </label>
              <select id="conv-from" value={from} onChange={e => setFrom(e.target.value)} className={selectClass} aria-label="Moeda de origem">
                {currencies.map(c => (
                  <option key={c} value={c}>{c} — {CURRENCY_NAMES[c] || c}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={swap}
              className="mt-5 flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
              aria-label="Trocar moedas"
              title="Trocar moedas"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 16V4M7 4L3 8M7 4l4 4" />
                <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <label htmlFor="conv-to" className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                Para
              </label>
              <select id="conv-to" value={to} onChange={e => setTo(e.target.value)} className={selectClass} aria-label="Moeda de destino">
                {currencies.map(c => (
                  <option key={c} value={c}>{c} — {CURRENCY_NAMES[c] || c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl p-4 bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/20">
            <p className="text-xs text-[var(--color-text-secondary)] mb-1">
              {from && to ? `${amount || '0'} ${from} =` : ''}
            </p>
            {conversion ? (
              <>
                <p className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums break-all">
                  {formatCurrency(to, conversion.value)}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  1 {from} = {conversion.unit.toFixed(4)} {to} · {rates.source}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Informe um valor válido</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
