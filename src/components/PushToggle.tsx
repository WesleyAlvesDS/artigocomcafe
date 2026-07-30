import { useState, useEffect } from 'react'
import { isAuthenticated } from '../lib/api'
import { isPushSupported, getPermissionState, subscribeToPush, unsubscribeFromPush, isSubscribed } from '../lib/push'

export default function PushToggle() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [auth, setAuth] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    setAuth(isAuthenticated())
    if (!isPushSupported()) {
      setSupported(false)
      return
    }
    setSupported(true)
    const perm = getPermissionState()
    if (perm === 'denied') {
      setDenied(true)
      return
    }
    if (perm === 'granted') {
      isSubscribed().then(setEnabled)
    }
  }, [])

  const handleToggle = async () => {
    if (!auth) {
      window.location.href = '/entrar'
      return
    }

    if (denied) {
      alert('Notificações bloqueadas neste navegador. Ative nas configurações do navegador (geralmente em "Configurações > Privacidade > Notificações").')
      return
    }

    setLoading(true)
    try {
      if (enabled) {
        await unsubscribeFromPush()
        setEnabled(false)
      } else {
        const sub = await subscribeToPush()
        if (sub) {
          setEnabled(true)
        } else {
          const perm = getPermissionState()
          if (perm === 'denied') setDenied(true)
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  const label = denied
    ? 'Notificações Bloqueadas'
    : loading
    ? 'Atualizando...'
    : enabled
    ? 'Notificações Ativas'
    : 'Ativar Notificações'

  const icon = denied ? '🚫' : loading ? '⏳' : enabled ? '🔔' : '🔕'

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      class="dropdown-link"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        width: '100%',
        background: 'none',
        border: 'none',
        font: 'inherit',
        cursor: loading ? 'wait' : 'pointer',
        opacity: auth ? 1 : 0.6,
      }}
      title={denied ? 'Clique para abrir configurações de notificação do navegador' : undefined}
    >
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <span style={{
        width: '36px', height: '20px', borderRadius: '10px',
        background: enabled ? 'var(--color-accent)' : 'var(--color-bg-card-border)',
        position: 'relative', transition: 'background 0.3s', flexShrink: 0,
        opacity: denied ? 0.4 : 1,
      }}>
        <span style={{
          position: 'absolute', top: '2px',
          left: enabled ? '18px' : '2px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.3s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </span>
    </button>
  )
}
