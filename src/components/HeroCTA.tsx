import '../styles/herocta.css'

export default function HeroCTA() {
  return (
    <section className="hero-cta">
      {/* Background decorativo */}
      <div className="hero-cta-bg" aria-hidden="true">
        <div className="hero-aurora aurora-1"></div>
        <div className="hero-aurora aurora-2"></div>
        <div className="hero-beans">
          <span className="bean" style={{ '--bean-x': '6%', '--bean-y': '18%', '--s': '26px' } as React.CSSProperties}></span>
          <span className="bean" style={{ '--bean-x': '14%', '--bean-y': '68%', '--s': '18px' } as React.CSSProperties}></span>
          <span className="bean" style={{ '--bean-x': '22%', '--bean-y': '42%', '--s': '14px' } as React.CSSProperties}></span>
          <span className="bean" style={{ '--bean-x': '88%', '--bean-y': '14%', '--s': '24px' } as React.CSSProperties}></span>
          <span className="bean" style={{ '--bean-x': '93%', '--bean-y': '62%', '--s': '16px' } as React.CSSProperties}></span>
        </div>
      </div>

      <div className="hero-cta-content container">
        <div className="hero-cta-text">
          <div className="hero-cta-eyebrow">
            <span className="eyebrow-rule" aria-hidden="true"></span>
            <span>UM AMBIENTE DE LEITURA ABERTO A TODOS</span>
          </div>
          <h1 className="hero-cta-title">
            ARTIGO<br /><span className="hero-title-accent">COM CAFÉ</span>
          </h1>
          <p className="hero-cta-subtitle">
            O café é o nosso convite, a leitura é o nosso destino.
            Explore artigos, receitas e conhecimento — aberto a todos.
          </p>
          <div className="hero-cta-actions">
            <a href="/cadastro" className="btn-primary hero-cta-btn">
              Comece sua jornada
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a href="#feed" className="btn-ghost hero-cta-btn-secondary">
              Explorar conteúdo
            </a>
          </div>
        </div>
      </div>

    </section>
  )
}
