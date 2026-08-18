import { useState, useEffect, useRef, type ReactNode } from 'react'

interface DashboardMobileNavProps {
  sections: { id: string; label: string; icon: string }[]
  activeSection: string
  onSectionChange: (id: string) => void
  hasDraft?: boolean
  children?: ReactNode
}

export default function DashboardMobileNav({ 
  sections, 
  activeSection, 
  onSectionChange, 
  hasDraft,
  children 
}: DashboardMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    const deltaY = e.touches[0].clientY - touchStart.y
    if (deltaY > 50) {
      setIsOpen(false)
    }
  }

  const handleTouchEnd = () => {
    setTouchStart(null)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Floating Action Button - Mobile Only */}
      <button
        ref={handleRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="dash-mobile-fab"
        aria-label="Abrir navegação do dashboard"
        aria-expanded={isOpen}
        aria-controls="dashboard-mobile-nav"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        {isOpen && <span className="fab-close" aria-hidden="true">✕</span>}
      </button>

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        id="dashboard-mobile-nav"
        className={`dash-mobile-sheet ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navegação do dashboard"
        onClick={handleBackdropClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sheet-backdrop" aria-hidden="true" />
        <div className="sheet-content">
          <div className="sheet-handle" aria-hidden="true" />
          
          <header className="sheet-header">
            <h2 className="sheet-title">Navegação</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="sheet-close"
              aria-label="Fechar navegação"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          <nav className="sheet-nav" aria-label="Seções do dashboard">
            {sections.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  onSectionChange(section.id)
                  setIsOpen(false)
                }}
                aria-current={activeSection === section.id ? 'page' : undefined}
                className={`sheet-nav-item ${activeSection === section.id ? 'active' : ''}`}
              >
                <span className="sheet-nav-icon" aria-hidden="true">{section.icon}</span>
                <span className="sheet-nav-label">{section.label}</span>
                {section.id === 'posts' && hasDraft && (
                  <span className="sheet-nav-badge" aria-label="Rascunho salvo">●</span>
                )}
              </button>
            ))}
          </nav>

          {children && (
            <div className="sheet-extra">
              {children}
            </div>
          )}

          <div className="sheet-footer">
            <p className="sheet-hint">
              Teclado: <kbd>1</kbd>–<kbd>{sections.length}</kbd> trocam de seção
            </p>
          </div>
        </div>
      </div>

      <style is:global>{`
        .dash-mobile-fab {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary));
          color: var(--color-btn-text);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 30px color-mix(in srgb, var(--color-accent) 50%, transparent);
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s;
        }
        .dash-mobile-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 40px color-mix(in srgb, var(--color-accent) 60%, transparent);
        }
        .dash-mobile-fab:active {
          transform: scale(0.95);
        }
        .dash-mobile-fab .fab-close {
          display: none;
        }
        .dash-mobile-fab[aria-expanded="true"] .fab-close {
          display: block;
        }
        .dash-mobile-fab[aria-expanded="true"] svg {
          display: none;
        }

        .dash-mobile-sheet {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .dash-mobile-sheet.open {
          opacity: 1;
          visibility: visible;
        }
        .dash-mobile-sheet .sheet-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        .dash-mobile-sheet .sheet-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 85vh;
          background: var(--color-bg-primary);
          border-radius: var(--radius-card-lg) var(--radius-card-lg) 0 0;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3), 0 0 80px color-mix(in srgb, var(--color-accent) 10%, transparent);
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-top: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
        }
        .dash-mobile-sheet.open .sheet-content {
          transform: translateY(0);
        }
        .dash-mobile-sheet .sheet-handle {
          width: 40px;
          height: 4px;
          background: var(--color-bg-card-border);
          border-radius: 2px;
          margin: 1rem auto 0.5rem;
        }
        .dash-mobile-sheet .sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-bg-card-border);
        }
        .dash-mobile-sheet .sheet-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .dash-mobile-sheet .sheet-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-bg-card);
          border: 1px solid var(--color-bg-card-border);
          color: var(--color-text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .dash-mobile-sheet .sheet-close:hover {
          background: var(--color-bg-card-hover);
          color: var(--color-accent);
        }
        .dash-mobile-sheet .sheet-nav {
          padding: 1rem;
          overflow-y: auto;
          flex: 1;
        }
        .dash-mobile-sheet .sheet-nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-card);
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          position: relative;
        }
        .dash-mobile-sheet .sheet-nav-item:hover {
          background: var(--color-bg-card-hover);
          color: var(--color-text-primary);
        }
        .dash-mobile-sheet .sheet-nav-item.active {
          background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 15%, transparent), color-mix(in srgb, var(--color-accent-secondary) 10%, transparent));
          color: var(--color-accent);
          font-weight: 600;
          border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
          box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 10%, transparent);
        }
        .dash-mobile-sheet .sheet-nav-icon {
          font-size: 1.5rem;
          width: 2.5rem;
          text-align: center;
          flex-shrink: 0;
        }
        .dash-mobile-sheet .sheet-nav-label {
          flex: 1;
        }
        .dash-mobile-sheet .sheet-nav-badge {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .dash-mobile-sheet .sheet-extra {
          padding: 0 1rem 1rem;
          border-top: 1px solid var(--color-bg-card-border);
        }
        .dash-mobile-sheet .sheet-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--color-bg-card-border);
        }
        .dash-mobile-sheet .sheet-hint {
          font-size: 0.75rem;
          color: var(--color-text-muted-dark);
          text-align: center;
        }
        .dash-mobile-sheet .sheet-hint kbd {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          padding: 0.1rem 0.35rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-bg-card-border);
          border-radius: 4px;
          margin: 0 0.15rem;
        }

        @media (min-width: 769px) {
          .dash-mobile-fab {
            display: none;
          }
        }
      `}
      </style>
    </>
  )
}