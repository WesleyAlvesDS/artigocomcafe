import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../lib/api'
import { getLocationPref, saveLocationPref, type LocationPref } from '../lib/consent'

interface Weather {
  city: string
  region: string | null
  temperature_c: number | null
  feels_like_c: number | null
  description: string | null
  icon_url: string | null
  humidity: number | null
  wind_speed_kmph: number | null
}

interface Suggestion {
  emoji: string
  title: string
  text: string
  href: string
}

const QUICK_CITIES = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Recife', 'Salvador', 'Porto Alegre', 'Manaus']

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

function queryFor(pref: LocationPref | null): string {
  if (pref?.granted && pref.lat != null && pref.lon != null) {
    return `lat=${pref.lat}&lon=${pref.lon}`
  }
  const city = pref?.city || 'São Paulo'
  return `city=${encodeURIComponent(city)}`
}

export default function ClimaDoCafe() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [customCity, setCustomCity] = useState('')

  const loadWeather = (query: string) => {
    setLoading(true)
    setError(false)
    api.get<{ data: Weather }>(`/integrations/weather?${query}`)
      .then(d => {
        setWeather(d.data)
        try {
          sessionStorage.setItem('clima_do_cafe', JSON.stringify({ ...d.data, query, cached_at: new Date().toISOString() }))
        } catch {
          /* storage indisponível */
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const useGeolocation = () => {
    if (!navigator.geolocation) {
      applyCity('São Paulo')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pref: LocationPref = {
          granted: true,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          updated_at: new Date().toISOString(),
        }
        saveLocationPref(pref)
        loadWeather(queryFor(pref))
        setLocating(false)
        setPanelOpen(false)
      },
      () => {
        applyCity('São Paulo')
        setLocating(false)
      },
      { timeout: 8000, maximumAge: 600000 }
    )
  }

  const applyCity = (city: string) => {
    const pref: LocationPref = { granted: false, city }
    saveLocationPref(pref)
    loadWeather(queryFor(pref))
    setPanelOpen(false)
  }

  const submitCustom = (e: FormEvent) => {
    e.preventDefault()
    const c = customCity.trim()
    if (c) applyCity(c)
  }

  useEffect(() => {
    const pref = getLocationPref()
    const query = queryFor(pref)
    const cached = sessionStorage.getItem('clima_do_cafe')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Weather & { cached_at?: string; query?: string }
        if (parsed.temperature_c != null && parsed.query === query && Date.now() - (parsed.cached_at ? Date.parse(parsed.cached_at) : 0) < 1800000) {
          setWeather(parsed)
          setLoading(false)
          return
        }
      } catch {
        /* cache inválido, busca de novo */
      }
    }
    loadWeather(query)
  }, [])

  if (loading) {
    return (
      <div class="glass-card p-6 animate-scale-in" style={{ minHeight: '120px' }}>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-[var(--color-bg-card-border)] skeleton flex-shrink-0" />
          <div class="flex-1 space-y-3">
            <div class="h-4 bg-[var(--color-accent)]/30 rounded w-1/3 skeleton" />
            <div class="h-3 bg-[var(--color-bg-card-border)] rounded w-2/3 skeleton" />
          </div>
        </div>
        <span class="sr-only">Clima do Café</span>
      </div>
    )
  }

  if (error || !weather || weather.temperature_c == null) {
    return (
      <div class="glass-card p-6 animate-scale-in">
        <div class="absolute -top-6 -right-6 w-24 h-24 bg-sky-500/8 rounded-full blur-3xl" />
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/15 to-sky-600/10 flex items-center justify-center flex-shrink-0 ring-1 ring-sky-500/20">
            <span class="text-2xl" aria-hidden="true">🌤️</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-0.5">
              Clima do Café
            </div>
            <p class="text-sm text-[var(--color-text-secondary)]">
              Não foi possível carregar o clima no momento
            </p>
            <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
              Verifique sua conexão e tente novamente
            </p>
          </div>
          <button
            onClick={() => { const pref = getLocationPref(); loadWeather(queryFor(pref)) }}
            disabled={loading}
            class="px-3 py-1.5 text-xs font-semibold text-[var(--color-btn-text)] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
          >
            Tentar
          </button>
        </div>
      </div>
    )
  }

  const temp = weather.temperature_c
  const suggestion = suggestionFor(temp)

  return (
    <a
      href={suggestion.href}
      class="glass-card p-6 group block relative overflow-hidden animate-scale-in transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-sky-500/5"
    >
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300" />
      <div class="absolute -top-6 -right-6 w-28 h-28 bg-sky-500/8 rounded-full blur-3xl group-hover:bg-sky-500/12 transition-colors duration-500" />
      <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/8 transition-colors duration-500" />

      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/15 to-sky-600/10 flex items-center justify-center flex-shrink-0 ring-1 ring-sky-500/20 group-hover:ring-sky-500/30 group-hover:scale-105 transition-all">
          {weather.icon_url ? (
            <img src={weather.icon_url} alt="" width="36" height="36" loading="lazy" decoding="async" />
          ) : (
            <span class="text-2xl" aria-hidden="true">🌤️</span>
          )}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              Clima do Café
            </span>
            <span class="text-[var(--color-text-muted)]">·</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPanelOpen(o => !o) }}
              class="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
              aria-expanded={panelOpen}
              aria-label="Trocar localização do clima"
              title="Trocar localização"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {weather.city}{weather.region ? `, ${weather.region}` : ''}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" class={`transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <div class="flex items-baseline gap-3 mb-1">
            <span class="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums bg-gradient-to-r from-sky-300 to-amber-200 bg-clip-text text-transparent">
              {Math.round(temp)}°C
            </span>
            {weather.description && (
              <span class="text-sm text-[var(--color-text-secondary)] capitalize">{weather.description}</span>
            )}
            {weather.feels_like_c != null && (
              <span class="text-xs text-[var(--color-text-muted)]">sensação {Math.round(weather.feels_like_c)}°C</span>
            )}
          </div>

          <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <span class="text-base">{suggestion.emoji}</span>
            <span class="font-medium text-[var(--color-text-primary)]">{suggestion.title}</span>
            <span class="flex items-center gap-1 group-hover:gap-2 transition-all ml-auto text-xs text-[var(--color-accent)] font-medium">
              Ver receitas
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </div>

          {panelOpen && (
            <div
              class="mt-4 pt-4 border-t border-[var(--color-bg-card-border)] text-left animate-fade-in"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            >
              <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2.5">
                Trocar localização
              </p>
              <button
                type="button"
                onClick={useGeolocation}
                disabled={locating}
                class="w-full mb-3 px-3 py-2.5 text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/25 rounded-lg hover:bg-[var(--color-accent)]/15 transition-colors disabled:opacity-60"
              >
                {locating ? 'Buscando localização…' : '📍 Usar minha localização'}
              </button>
              <div class="flex flex-wrap gap-1.5 mb-2.5">
                {QUICK_CITIES.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => applyCity(city)}
                    class={`px-2.5 py-1.5 text-[11px] font-medium rounded-full border transition-all ${
                      weather.city === city
                        ? 'bg-[var(--color-accent)]/12 border-[var(--color-accent)] text-[var(--color-accent)] shadow-sm shadow-[var(--color-accent)]/10'
                        : 'bg-[var(--color-bg-card)] border-[var(--color-bg-card-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
              <form onSubmit={submitCustom} class="flex gap-1.5">
                <input
                  type="text"
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  placeholder="Outra cidade…"
                  aria-label="Outra cidade"
                  class="flex-1 min-w-0 px-3 py-2 text-xs bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] rounded-lg text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-glow)] transition-all"
                />
                <button
                  type="submit"
                  class="px-3 py-1.5 text-xs font-semibold text-[var(--color-btn-text)] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-lg hover:opacity-90 transition-opacity"
                >
                  Ir
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </a>
  )
}
