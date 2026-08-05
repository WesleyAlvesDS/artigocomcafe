import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface Weather {
  city: string
  region: string | null
  temperature_c: number | null
  description: string | null
  icon_url: string | null
}

interface Suggestion {
  emoji: string
  title: string
  text: string
  href: string
}

function suggestionFor(temp: number): Suggestion {
  if (temp >= 28) {
    return {
      emoji: '🧊',
      title: 'Dia perfeito para um café gelado',
      text: `Com ${Math.round(temp)}°C, um cold brew ou café coado gelado cai muito bem.`,
      href: '/receitas?busca=gelado',
    }
  }
  if (temp >= 20) {
    return {
      emoji: '🍃',
      title: 'Bom dia para um coado refrescante',
      text: `Clima agradável (${Math.round(temp)}°C) — aproveite para caprichar no coado.`,
      href: '/receitas',
    }
  }
  return {
    emoji: '☕',
    title: 'Hora de um café quentinho',
    text: `Com ${Math.round(temp)}°C, nada melhor que um capuccino cremoso para a pausa.`,
    href: '/receitas?busca=capuccino',
  }
}

export default function ClimaDoCafe() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cache de sessão para não estourar o rate limit da integração
    const cached = sessionStorage.getItem('clima_do_cafe')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Weather
        if (parsed.temperature_c != null) {
          setWeather(parsed)
          setLoading(false)
          return
        }
      } catch {
        /* cache inválido, busca de novo */
      }
    }

    api.get<{ data: Weather }>('/integrations/weather?city=Sao Paulo')
      .then(d => {
        setWeather(d.data)
        try {
          sessionStorage.setItem('clima_do_cafe', JSON.stringify(d.data))
        } catch {
          /* storage indisponível */
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div class="glass-card p-6" style={{ minHeight: '96px' }}>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 animate-pulse" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-[var(--color-bg-card-border)] rounded w-1/3 animate-pulse" />
            <div class="h-3 bg-[var(--color-bg-card-border)] rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!weather || weather.temperature_c == null) return null

  const temp = weather.temperature_c
  const suggestion = suggestionFor(temp)

  return (
    <a
      href={suggestion.href}
      class="glass-card p-6 group block relative overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-sky-500/5"
    >
      {/* Gradient accent top */}
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300" />

      <div class="flex items-start gap-4">
        {/* Temperature */}
        <div class="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
          {weather.icon_url ? (
            <img src={weather.icon_url} alt="" width="36" height="36" loading="lazy" decoding="async" />
          ) : (
            <span class="text-2xl">🌤️</span>
          )}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              Clima do Café
            </span>
            <span class="text-[var(--color-text-muted)]">·</span>
            <span class="text-[11px] text-[var(--color-text-muted)]">
              {weather.city}{weather.region ? `, ${weather.region}` : ''}
            </span>
          </div>

          <div class="flex items-center gap-3 mb-1">
            <span class="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {Math.round(temp)}°C
            </span>
            {weather.description && (
              <span class="text-sm text-[var(--color-text-secondary)] capitalize">{weather.description}</span>
            )}
          </div>

          <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <span class="text-base">{suggestion.emoji}</span>
            <span class="font-medium text-[var(--color-text-primary)]">{suggestion.title}</span>
            <span class="flex items-center gap-1 group-hover:gap-2 transition-all ml-auto text-xs text-[var(--color-accent)]">
              Ver receitas
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
