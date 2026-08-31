import { useState, useEffect, type FormEvent } from 'react'
import { api, setToken, isAuthenticated } from '../lib/api'
import { applyThemeColors, getStoredTheme, resetThemeColors } from '../lib/themes'
import { showToast } from './Toast'
import '../styles/herologin.css'

interface LoginResponse {
  token: string
  user: { name: string; theme?: string }
}

export default function HeroLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  useEffect(() => {
    applyThemeColors(getStoredTheme())
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.postForm<LoginResponse>('/auth/login', { email, password })
      setToken(data.token)
      if (data.user?.theme) applyThemeColors(data.user.theme)
      showToast(`Bem-vindo, ${data.user.name}! ☕`, 'success')
      // Delay para o toast renderizar antes do reload
      setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (err: unknown) {
      if (err.status === 401) {
        setError('Email ou senha incorretos')
      } else {
        setError(err.message || 'Erro ao entrar')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setRegError('')
    if (regPassword !== regConfirm) {
      setRegError('As senhas não coincidem')
      return
    }
    setRegLoading(true)
    try {
      const data = await api.postForm<LoginResponse>('/auth/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
        password_confirmation: regConfirm,
      })
      setToken(data.token)
      if (data.user?.theme) applyThemeColors(data.user.theme)
      showToast(`Bem-vindo ao Artigo com Café, ${data.user.name}! ☕`, 'success')
      // Delay para o toast renderizar antes do reload
      setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (err: unknown) {
      if (err.errors) {
        const firstError = Object.values(err.errors)[0]
        setRegError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        setRegError(err.message || 'Erro ao criar conta')
      }
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <section className="hero-login">
      {/* Background decorativo */}
      <div className="hero-login-bg" aria-hidden="true">
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

      <div className="hero-login-content container">
        <div className="hero-login-left">
          <div className="hero-login-eyebrow">
            <span className="eyebrow-rule" aria-hidden="true"></span>
            <span>UM AMBIENTE DE LEITURA ABERTO A TODOS</span>
          </div>
          <h1 className="hero-login-title">
            ARTIGO<br /><span className="hero-title-accent">COM CAFÉ</span>
          </h1>
          <p className="hero-login-subtitle">
            O café é o nosso convite, a leitura é o nosso destino.
            Um lugar acolhedor para aprender, inspirar-se e compartilhar.
          </p>
          <div className="hero-login-features">
            <div className="feature-item">
              <span className="feature-icon">📰</span>
              <span className="feature-text">Artigos sobre café, tecnologia e cultura</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🍳</span>
              <span className="feature-text">Receitas exclusivas para o seu momento</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">Jornada de aprendizado gamificada</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <span className="feature-text">Biblioteca digital com grãos por leitura</span>
            </div>
          </div>
        </div>

        <div className="hero-login-right">
          <div className="login-card glass-card">
            {!showRegister ? (
              <>
                <div className="login-card-header">
                  <h2 className="login-card-title">Entrar na sua conta</h2>
                  <p className="login-card-desc">Acesse seu feed personalizado e continue sua jornada</p>
                </div>

                {error && (
                  <div className="login-error" role="alert">{error}</div>
                )}

                <form onSubmit={handleLogin} className="login-form" noValidate>
                  <div className="form-group">
                    <label htmlFor="hero-email" className="form-label">Email</label>
                    <input
                      id="hero-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="form-input"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hero-password" className="form-label">Senha</label>
                    <div className="password-wrapper">
                      <input
                        id="hero-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="form-input"
                        placeholder="Sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="password-toggle"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div className="form-links">
                    <a href="/recuperar-senha" className="form-link">Esqueceu a senha?</a>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary login-submit">
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        Entrar
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="login-divider">
                  <span>ou</span>
                </div>

                <button onClick={() => setShowRegister(true)} className="btn-ghost login-register-btn">
                  Criar conta gratuita
                </button>

                <p className="login-hint">
                  Comece a jornada — ganhe grãos a cada artigo lido
                </p>
              </>
            ) : (
              <>
                <div className="login-card-header">
                  <h2 className="login-card-title">Criar sua conta</h2>
                  <p className="login-card-desc">Junte-se à comunidade e comece sua jornada</p>
                </div>

                {regError && (
                  <div className="login-error" role="alert">{regError}</div>
                )}

                <form onSubmit={handleRegister} className="login-form" noValidate>
                  <div className="form-group">
                    <label htmlFor="hero-reg-name" className="form-label">Nome</label>
                    <input
                      id="hero-reg-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="form-input"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hero-reg-email" className="form-label">Email</label>
                    <input
                      id="hero-reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="form-input"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hero-reg-password" className="form-label">Senha</label>
                    <input
                      id="hero-reg-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="form-input"
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hero-reg-confirm" className="form-label">Confirmar senha</label>
                    <input
                      id="hero-reg-confirm"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      className="form-input"
                      placeholder="Repita a senha"
                      minLength={8}
                    />
                  </div>
                  <button type="submit" disabled={regLoading} className="btn-primary login-submit">
                    {regLoading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        Criar conta
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="login-divider">
                  <span>ou</span>
                </div>

                <button onClick={() => setShowRegister(false)} className="btn-ghost login-register-btn">
                  Já tenho uma conta
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </section>
  )
}
