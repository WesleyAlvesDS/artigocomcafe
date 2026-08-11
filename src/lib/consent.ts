export const CONSENT_VERSION = 1
export const STORAGE_KEY = 'cookie-consent'

export interface LocationPref {
  granted: boolean
  lat?: number
  lon?: number
  city?: string
  updated_at?: string
}

export interface Consent {
  essential: boolean
  analytics: boolean
  marketing: boolean
  version: number
  date: string
  location?: LocationPref
}

export function getConsent(): Consent | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Consent) : null
  } catch {
    return null
  }
}

export function saveConsent(
  analytics: boolean,
  marketing: boolean,
  location?: LocationPref
): Consent {
  const payload: Consent = {
    essential: true,
    analytics,
    marketing,
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
    ...(location ? { location } : {}),
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {}
  }
  return payload
}

export function hasConsented(): boolean {
  return getConsent()?.version === CONSENT_VERSION
}

export function getLocationPref(): LocationPref | null {
  return getConsent()?.location ?? null
}

export function saveLocationPref(pref: LocationPref): Consent | null {
  const current = getConsent()
  if (!current) return null
  const next: Consent = { ...current, location: pref }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {}
  return next
}
