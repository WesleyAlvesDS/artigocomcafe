import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const name = this.props.name || 'Component'
    console.error(`[ErrorBoundary] ${name} failed:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary-fallback">
          <style>{`
            .error-boundary-fallback {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2rem 1.5rem;
              text-align: center;
              background: var(--color-bg-card);
              border: 1px solid var(--color-bg-card-border);
              border-radius: var(--radius-card);
              margin: 1rem 0;
            }
            .error-boundary-icon {
              font-size: 2rem;
              margin-bottom: 0.75rem;
              opacity: 0.7;
            }
            .error-boundary-title {
              font-size: 0.95rem;
              font-weight: 600;
              color: var(--color-text-primary);
              margin: 0 0 0.35rem;
            }
            .error-boundary-desc {
              font-size: 0.82rem;
              color: var(--color-text-muted);
              margin: 0 0 1rem;
              max-width: 280px;
            }
            .error-boundary-retry {
              padding: 0.5rem 1.25rem;
              border: 1px solid var(--color-accent);
              border-radius: 8px;
              background: transparent;
              color: var(--color-accent);
              font-size: 0.82rem;
              font-weight: 600;
              cursor: pointer;
              transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast)
              font-family: var(--font-sans);
            }
            .error-boundary-retry:hover {
              background: var(--color-accent);
              color: var(--color-btn-text);
            }
          `}</style>
          <span className="error-boundary-icon" aria-hidden="true">⚠️</span>
          <p className="error-boundary-title">Algo deu errado</p>
          <p className="error-boundary-desc">
            Este componente não pôde ser carregado. Tente recarregar a página.
          </p>
          <button
            className="error-boundary-retry"
            onClick={() => window.location.reload()}
            type="button"
          >
            Recarregar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
