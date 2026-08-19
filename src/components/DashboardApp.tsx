import { useState, useEffect, useCallback } from 'react'
import DashboardPage from './DashboardPage'
import JornadaPage from './JornadaPage'
import MissionsPage from './MissionsPage'
import TrailsPage from './TrailsPage'
import AchievementsPage from './AchievementsPage'
import LibraryPage from './LibraryPage'
import KnowledgeMap from './KnowledgeMap'
import GrainsPage from './GrainsPage'
import RoasteryPage from './RoasteryPage'
import ProfilePage from './ProfilePage'

const SECTIONS = [
  { id: 'dashboard', label: 'Visão Geral', icon: '📊', Component: DashboardPage },
  { id: 'jornada', label: 'Jornada', icon: '📈', Component: JornadaPage },
  { id: 'missoes', label: 'Missões', icon: '🎯', Component: MissionsPage },
  { id: 'trilhas', label: 'Trilhas', icon: '🎓', Component: TrailsPage },
  { id: 'conquistas', label: 'Conquistas', icon: '🏆', Component: AchievementsPage },
  { id: 'biblioteca', label: 'Biblioteca', icon: '📚', Component: LibraryPage },
  { id: 'mapa', label: 'Mapa', icon: '🗺️', Component: KnowledgeMap },
  { id: 'graos', label: 'Grãos', icon: '🫘', Component: GrainsPage },
  { id: 'torrefacao', label: 'Torrefação', icon: '☕', Component: RoasteryPage },
  { id: 'perfil', label: 'Perfil', icon: '👤', Component: ProfilePage },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

function sectionFromHash(): SectionId {
  if (typeof window === 'undefined') return 'dashboard'
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase()
  if (SECTIONS.some(s => s.id === h)) return h as SectionId
  return 'dashboard'
}

export default function DashboardApp() {
  const [section, setSection] = useState<SectionId>('dashboard')
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setSection(sectionFromHash())
    const sync = () => setSection(sectionFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const navigate = useCallback((id: SectionId) => {
    setSection(id)
    setNavOpen(false)
    try { window.history.pushState(null, '', `#/${id}`) } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Keyboard shortcuts 1–N
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      const idx = parseInt(e.key, 10)
      if (idx >= 1 && idx <= SECTIONS.length) {
        e.preventDefault()
        navigate(SECTIONS[idx - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  // Prevent body scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [navOpen])

  const active = SECTIONS.find(s => s.id === section) ?? SECTIONS[0]

  return (
    <div class="dash-app">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside class="dash-app-sidebar" aria-label="Áreas do app">
        <div class="dash-app-brand">
          <span class="dash-app-logo" aria-hidden="true">☕</span>
          <div class="dash-app-brand-text">
            <strong>Artigo com Café</strong>
            <span>Área do leitor</span>
          </div>
        </div>

        <nav class="dash-app-nav">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(s.id)}
              class={`dash-app-item${active.id === s.id ? ' active' : ''}`}
              aria-current={active.id === s.id ? 'page' : undefined}
              title={`${s.label} (atalho ${i + 1})`}
            >
              <span class="dash-app-item-icon" aria-hidden="true">{s.icon}</span>
              <span class="dash-app-item-label">{s.label}</span>
              <span class="dash-app-item-key" aria-hidden="true">{i + 1}</span>
            </button>
          ))}
        </nav>

        <div class="dash-app-sidebar-foot">
          <a href="/" class="dash-app-back">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Voltar ao site
          </a>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div class="dash-app-main">
        <div class="dash-app-topbar">
          <a href="/" class="dash-app-topbar-home" aria-label="Voltar ao site">←</a>
          <span class="dash-app-crumb">Área do leitor</span>
          <span class="dash-app-sep" aria-hidden="true">›</span>
          <strong class="dash-app-title">{active.icon} {active.label}</strong>
        </div>

        <div class="dash-app-view" key={section}>
          {section === 'dashboard'
            ? <DashboardPage embedded />
            : (() => {
                const { Component } = active
                return <Component />
              })()}
        </div>
      </div>

      {/* ── Mobile FAB ──────────────────────────────────── */}
      <button
        type="button"
        class="dash-app-fab"
        onClick={() => setNavOpen(o => !o)}
        aria-label={navOpen ? 'Fechar navegação' : 'Abrir navegação'}
        aria-expanded={navOpen}
        aria-controls="dash-app-sheet"
      >
        {navOpen ? (
          <span aria-hidden="true">✕</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* ── Mobile bottom sheet ─────────────────────────── */}
      <div
        id="dash-app-sheet"
        class={`dash-app-sheet${navOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navegação do app"
        onClick={e => { if (e.target === e.currentTarget) setNavOpen(false) }}
      >
        <div class="dash-app-sheet-backdrop" aria-hidden="true" />
        <div class="dash-app-sheet-content">
          <div class="dash-app-sheet-handle" aria-hidden="true" />
          <div class="dash-app-sheet-head">
            <strong class="dash-app-sheet-title">Navegação</strong>
            <button type="button" class="dash-app-sheet-close" onClick={() => setNavOpen(false)} aria-label="Fechar navegação">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <nav class="dash-app-sheet-nav">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(s.id)}
                class={`dash-app-sheet-item${active.id === s.id ? ' active' : ''}`}
                aria-current={active.id === s.id ? 'page' : undefined}
              >
                <span class="dash-app-sheet-icon" aria-hidden="true">{s.icon}</span>
                <span class="dash-app-sheet-label">{s.label}</span>
                <span class="dash-app-sheet-key" aria-hidden="true">{i + 1}</span>
              </button>
            ))}
          </nav>
          <div class="dash-app-sheet-foot">
            <a href="/" class="dash-app-back dash-app-back--sheet">← Voltar ao site</a>
          </div>
        </div>
      </div>

      <style>{`
        .dash-app {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }

        /* ── Sidebar ─────────────────────────────────── */
        .dash-app-sidebar {
          position: sticky;
          top: 6rem;
          flex: 0 0 252px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.1rem;
          border-radius: var(--radius-card-lg);
          background: color-mix(in srgb, var(--color-bg-card) 82%, transparent);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--color-bg-card-border);
          box-shadow: var(--shadow-card);
        }

        .dash-app-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.2rem 0.25rem 0.85rem;
          border-bottom: 1px solid var(--color-bg-card-border);
        }

        .dash-app-logo {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          border-radius: 13px;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary));
          color: var(--color-btn-text);
          box-shadow: 0 0 22px color-mix(in srgb, var(--color-accent) 35%, transparent);
        }

        .dash-app-brand-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .dash-app-brand-text strong {
          font-size: 0.92rem;
          font-weight: 800;
          color: var(--color-text-primary);
          line-height: 1.2;
        }

        .dash-app-brand-text span {
          font-size: 0.72rem;
          color: var(--color-text-muted);
        }

        .dash-app-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .dash-app-item {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: none;
          border-radius: 12px;
          background: none;
          color: var(--color-text-secondary);
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-sans);
          transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .dash-app-item:hover {
          background: var(--color-bg-card-hover);
          color: var(--color-text-primary);
        }

        .dash-app-item.active {
          background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 16%, transparent), color-mix(in srgb, var(--color-accent-secondary) 10%, transparent));
          color: var(--color-accent);
          font-weight: 700;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 22%, transparent), 0 0 18px color-mix(in srgb, var(--color-accent) 10%, transparent);
        }

        .dash-app-item-icon {
          font-size: 1.15rem;
          width: 1.6rem;
          text-align: center;
          flex-shrink: 0;
        }

        .dash-app-item-label {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dash-app-item-key {
          font-size: 0.68rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted-dark);
          padding: 0.1rem 0.4rem;
          border-radius: 6px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-bg-card-border);
        }

        .dash-app-item.active .dash-app-item-key {
          color: color-mix(in srgb, var(--color-accent) 80%, var(--color-text-muted));
        }

        .dash-app-sidebar-foot {
          margin-top: auto;
          padding-top: 0.75rem;
          border-top: 1px solid var(--color-bg-card-border);
        }

        .dash-app-back {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color 0.2s, transform 0.2s;
        }

        .dash-app-back:hover {
          color: var(--color-accent);
          transform: translateX(-2px);
        }

        /* ── Main ─────────────────────────────────────── */
        .dash-app-main {
          flex: 1;
          min-width: 0;
        }

        .dash-app-topbar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.1rem;
          font-size: 0.82rem;
          color: var(--color-text-muted);
        }

        .dash-app-topbar-home {
          display: none;
          font-size: 0.95rem;
          text-decoration: none;
          color: var(--color-text-secondary);
        }

        .dash-app-crumb {
          color: var(--color-text-muted);
        }

        .dash-app-sep {
          color: var(--color-text-muted-dark);
        }

        .dash-app-title {
          color: var(--color-text-primary);
          font-weight: 700;
        }

        .dash-app-view {
          animation: dash-app-view-in 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        @keyframes dash-app-view-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ── Mobile FAB ───────────────────────────────── */
        .dash-app-fab {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 990;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: none;
          display: none;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary));
          color: var(--color-btn-text);
          cursor: pointer;
          font-size: 1.3rem;
          box-shadow: 0 8px 30px color-mix(in srgb, var(--color-accent) 50%, transparent);
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s;
        }

        .dash-app-fab:hover {
          transform: scale(1.06);
          box-shadow: 0 12px 40px color-mix(in srgb, var(--color-accent) 60%, transparent);
        }

        .dash-app-fab:active {
          transform: scale(0.95);
        }

        /* ── Mobile bottom sheet ──────────────────────── */
        .dash-app-sheet {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .dash-app-sheet.open {
          opacity: 1;
          visibility: visible;
        }

        .dash-app-sheet-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(6px);
        }

        .dash-app-sheet-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--color-bg-primary);
          border-radius: var(--radius-card-lg) var(--radius-card-lg) 0 0;
          border-top: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.35), 0 0 80px color-mix(in srgb, var(--color-accent) 10%, transparent);
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .dash-app-sheet.open .dash-app-sheet-content {
          transform: translateY(0);
        }

        .dash-app-sheet-handle {
          width: 42px;
          height: 4px;
          border-radius: 2px;
          background: var(--color-bg-card-border);
          margin: 0.9rem auto 0.45rem;
          flex-shrink: 0;
        }

        .dash-app-sheet-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1.4rem 0.9rem;
          border-bottom: 1px solid var(--color-bg-card-border);
        }

        .dash-app-sheet-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .dash-app-sheet-close {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid var(--color-bg-card-border);
          background: var(--color-bg-card);
          color: var(--color-text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .dash-app-sheet-close:hover {
          color: var(--color-accent);
          border-color: var(--color-accent);
        }

        .dash-app-sheet-nav {
          flex: 1;
          overflow-y: auto;
          padding: 0.9rem 1rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .dash-app-sheet-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.8rem 1rem;
          border: none;
          border-radius: 14px;
          background: var(--color-bg-card);
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-sans);
          transition: all 0.2s;
        }

        .dash-app-sheet-item:hover {
          background: var(--color-bg-card-hover);
          color: var(--color-text-primary);
        }

        .dash-app-sheet-item.active {
          background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 15%, transparent), color-mix(in srgb, var(--color-accent-secondary) 10%, transparent));
          color: var(--color-accent);
          font-weight: 700;
          border: 1px solid color-mix(in srgb, var(--color-accent) 22%, transparent);
          box-shadow: 0 0 18px color-mix(in srgb, var(--color-accent) 10%, transparent);
        }

        .dash-app-sheet-icon {
          font-size: 1.25rem;
          width: 1.7rem;
          text-align: center;
          flex-shrink: 0;
        }

        .dash-app-sheet-label {
          flex: 1;
        }

        .dash-app-sheet-key {
          font-size: 0.68rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted-dark);
          padding: 0.1rem 0.4rem;
          border-radius: 6px;
          background: var(--color-bg-card-border);
        }

        .dash-app-sheet-foot {
          padding: 0.85rem 1.4rem 1.2rem;
          border-top: 1px solid var(--color-bg-card-border);
        }

        .dash-app-back--sheet {
          font-size: 0.85rem;
        }

        /* ── Responsive ───────────────────────────────── */
        @media (max-width: 1024px) {
          .dash-app-sidebar {
            display: none;
          }

          .dash-app-fab {
            display: flex;
          }

          .dash-app-topbar-home {
            display: inline-flex;
          }
        }
      `}</style>
    </div>
  )
}