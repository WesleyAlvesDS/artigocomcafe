import { useState, useEffect, useRef } from 'react'
import { isAuthenticated, api, setToken } from '../lib/api'
import { resetThemeColors } from '../lib/themes'
import '../styles/user-menu.css'
import PushToggle from './PushToggle'

export default function UserMenu() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAuthenticated()) {
      setLoggedIn(true)
      api.get<{ user: { name: string } }>('/auth/me')
        .then(d => setName(d.user.name))
        .catch(() => {
          // Token inválido/expirado: limpa e volta ao estado deslogado.
          setToken(null)
          resetThemeColors()
          setLoggedIn(false)
        })
    }
  }, [])

  // Fecha ao clicar fora ou pressionar Esc
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!loggedIn) {
    return (
      <a
        href="/entrar"
        class="nav-cta btn-primary"
        style={{
          padding: '0.5rem 1.15rem',
          fontSize: '0.85rem',
          borderRadius: '100px',
          marginLeft: '0.35rem',
        }}
      >
        Entrar
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      </a>
    )
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    setToken(null)
    resetThemeColors()
    setLoggedIn(false)
    setOpen(false)
    // Pequeno delay para o toast renderizar antes da navegação
    setTimeout(() => {
      window.location.href = '/'
    }, 100)
  }

  return (
    <div class="user-menu" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        class="nav-link user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu-dropdown"
      >
        <span class="user-menu__avatar" aria-hidden="true">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </span>
        <svg class="user-menu__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points={open ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
        </svg>
      </button>

      {open && (
        <div class="user-menu__dropdown" id="user-menu-dropdown" role="menu" aria-label="Menu do usuário">
          <div class="user-menu__header">
            <span class="user-menu__avatar user-menu__avatar--lg" aria-hidden="true">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
            <div class="user-menu__identity">
              <span class="user-menu__name">{name || 'Leitor'}</span>
              <span class="user-menu__hint">Área do leitor</span>
            </div>
          </div>

          <a href="/dashboard" class="dropdown-link dropdown-link--highlight" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </a>

          <div class="user-menu__divider" role="separator" />
          <span class="user-menu__label">Minha jornada</span>
          <a href="/dashboard/jornada" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Jornada
          </a>
          <a href="/dashboard/missoes" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            Missões
          </a>
          <a href="/dashboard/conquistas" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            Conquistas
          </a>
          <a href="/dashboard/trilhas" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Trilhas
          </a>

          <div class="user-menu__divider" role="separator" />
          <span class="user-menu__label">Biblioteca</span>
          <a href="/dashboard/biblioteca" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Minha Biblioteca
          </a>
          <a href="/dashboard/mapa" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Mapa do Conhecimento
          </a>
          <a href="/dashboard/graos" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1 0-18z" opacity="0.4" />
            </svg>
            Grãos
          </a>
          <a href="/dashboard/torrefacao" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
            Torrefação
          </a>

          <div class="user-menu__divider" role="separator" />
          <a href="/dashboard/perfil" class="dropdown-link" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Meu Perfil
          </a>
          <PushToggle />
          <button
            onClick={logout}
            class="dropdown-link logout-link"
            role="menuitem"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      )}

    </div>
  )
}
