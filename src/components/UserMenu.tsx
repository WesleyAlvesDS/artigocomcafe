import { useState, useEffect } from 'react'
import { isAuthenticated, api } from '../lib/api'

export default function UserMenu() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      setLoggedIn(true)
      api.get<{ user: { name: string } }>('/auth/me')
        .then(d => setName(d.user.name))
        .catch(() => setLoggedIn(false))
    }
  }, [])

  if (!loggedIn) {
    return (
      <a href="/entrar" class="nav-link" style={{ fontWeight: 600 }}>
        Entrar
      </a>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        class="nav-link"
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' }}
      >
        <span style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: 'var(--color-accent)', color: 'white',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700
        }}>
          {name?.charAt(0)?.toUpperCase() || '?'}
        </span>
        {open ? '▲' : '▼'}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, zIndex: 99,
            background: 'var(--color-bg-card)', border: '1px solid var(--color-bg-card-border)',
            borderRadius: '12px', padding: '0.5rem', minWidth: '180px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', marginTop: '0.25rem'
          }}>
            <a href="/perfil" class="dropdown-link">Meu Perfil</a>
            <a href="/biblioteca" class="dropdown-link">Biblioteca</a>
            <a href="/graos" class="dropdown-link">Grãos</a>
            <a href="/conquistas" class="dropdown-link">Conquistas</a>
            <a href="/trilhas" class="dropdown-link">Trilhas</a>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-bg-card-border)', margin: '0.3rem 0' }} />
            <a href="/entrar" class="dropdown-link" onClick={() => { localStorage.removeItem('auth_token'); setLoggedIn(false) }}
              style={{ color: 'var(--color-red, #ef4444)' }}>Sair</a>
          </div>
        </>
      )}
      <style>{`
        .dropdown-link {
          display: block;
          padding: 0.5rem 0.75rem;
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.85rem;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .dropdown-link:hover {
          background: var(--color-bg-card-hover, rgba(128,128,128,0.1));
          color: var(--color-accent);
        }
      `}</style>
    </div>
  )
}
