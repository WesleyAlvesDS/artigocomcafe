export default function LoginSidebarCard() {
  return (
    <div className="login-sidebar-card glass-card">
      <div className="login-sidebar-icon">☕</div>
      <h3 className="login-sidebar-title">Junte-se ao Artigo com Café</h3>
      <p className="login-sidebar-desc">
        Crie sua conta gratuitamente e tenha acesso a artigos exclusivos, receitas e sua jornada de aprendizado.
      </p>
      <div className="login-sidebar-benefits">
        <div className="benefit-item">
          <span className="benefit-icon">📰</span>
          <span className="benefit-text">Feed personalizado</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">🎯</span>
          <span className="benefit-text">Jornada gamificada</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">🫘</span>
          <span className="benefit-text">Ganhe grãos por leitura</span>
        </div>
      </div>
      <a href="/cadastro" className="btn-primary login-sidebar-btn">
        Criar conta gratuita
      </a>
      <p className="login-sidebar-hint">
        Já tem conta? <a href="/entrar">Entrar</a>
      </p>

      <style>{`
        .login-sidebar-card {
          padding: 1.25rem;
          text-align: center;
        }

        .login-sidebar-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .login-sidebar-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 0.35rem;
        }

        .login-sidebar-desc {
          font-size: 0.8rem;
          line-height: 1.5;
          color: var(--color-text-muted);
          margin: 0 0 0.85rem;
        }

        .login-sidebar-benefits {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
          text-align: left;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: var(--color-text-secondary);
        }

        .benefit-icon {
          font-size: 0.9rem;
        }

        .login-sidebar-btn {
          width: 100%;
          padding: 0.65rem;
          margin-bottom: 0.65rem;
          font-size: 0.82rem;
        }

        .login-sidebar-hint {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin: 0;
        }

        .login-sidebar-hint a {
          color: var(--color-accent);
          text-decoration: none;
          font-weight: 600;
        }

        .login-sidebar-hint a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
