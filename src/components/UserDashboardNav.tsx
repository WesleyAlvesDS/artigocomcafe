import { useState, useEffect } from 'react'
import { api, isAuthenticated } from '../lib/api'
import '../styles/user-dashboard-nav.css'

interface UserData {
  name: string
  email: string
  grains?: number
  articles_read?: number
  level?: number
}

interface NavItem {
  icon: string
  label: string
  href: string
  badge?: number
}

const mainNav: NavItem[] = [
  { icon: '📰', label: 'Feed', href: '/#feed' },
  { icon: '📚', label: 'Blog', href: '/blog' },
  { icon: '🍳', label: 'Receitas', href: '/receitas' },
  { icon: '📖', label: 'Livros', href: '/livros' },
]

const journeyNav: NavItem[] = [
  { icon: '📊', label: 'Minha Jornada', href: '/dashboard#/jornada' },
  { icon: '🎯', label: 'Missões', href: '/dashboard#/missoes' },
  { icon: '🏆', label: 'Conquistas', href: '/dashboard#/conquistas' },
  { icon: '🎓', label: 'Trilhas', href: '/dashboard#/trilhas' },
]

const libraryNav: NavItem[] = [
  { icon: '🫘', label: 'Meus Grãos', href: '/dashboard#/graos' },
  { icon: '☕', label: 'Torrefação', href: '/dashboard#/torrefacao' },
  { icon: '📚', label: 'Biblioteca', href: '/dashboard#/biblioteca' },
  { icon: '👤', label: 'Perfil', href: '/dashboard#/perfil' },
]

export default function UserDashboardNav() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false)
      return
    }

    api.get<{ user: UserData }>('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Track active section based on URL hash
  useEffect(() => {
    const updateActive = () => {
      const hash = window.location.hash.slice(1)
      setActiveSection(hash || 'home')
    }
    updateActive()
    window.addEventListener('hashchange', updateActive)
    return () => window.removeEventListener('hashchange', updateActive)
  }, [])

  if (loading) {
    return (
      <aside className="dashboard-nav">
        <div className="dashboard-nav-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      </aside>
    )
  }

  if (!user) return null

  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <aside className="dashboard-nav">
      {/* Profile Card */}
      <div className="profile-card glass-card">
        <div className="profile-avatar">
          <span className="avatar-initials">{initials}</span>
          <div className="avatar-status" aria-label="Online"></div>
        </div>
        <div className="profile-info">
          <h3 className="profile-name">{user.name || 'Leitor'}</h3>
          <p className="profile-email">{user.email}</p>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{user.grains || 0}</span>
            <span className="stat-label">Grãos</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{user.articles_read || 0}</span>
            <span className="stat-label">Lidos</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">Nv.{user.level || 1}</span>
            <span className="stat-label">Nível</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="dashboard-nav-menu" aria-label="Navegação do dashboard">
        <div className="nav-section">
          <span className="nav-section-title">Principal</span>
          {mainNav.map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-item ${activeSection === item.href.split('#')[1] ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {item.badge && <span className="nav-item-badge">{item.badge}</span>}
            </a>
          ))}
        </div>

        <div className="nav-section">
          <span className="nav-section-title">Sua Jornada</span>
          {journeyNav.map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-item ${activeSection === item.href.split('/').pop() ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </a>
          ))}
        </div>

        <div className="nav-section">
          <span className="nav-section-title">Biblioteca</span>
          {libraryNav.map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-item ${activeSection === item.href.split('#')[1] ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Daily Goal */}
      <div className="daily-goal glass-card">
        <div className="daily-goal-header">
          <span className="daily-goal-icon">🎯</span>
          <span className="daily-goal-title">Meta Diária</span>
        </div>
        <div className="daily-goal-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '60%' }}></div>
          </div>
          <span className="progress-text">2/3 artigos</span>
        </div>
        <p className="daily-goal-hint">Leia 1 mais para ganhar +5 grãos</p>
      </div>

    </aside>
  )
}
