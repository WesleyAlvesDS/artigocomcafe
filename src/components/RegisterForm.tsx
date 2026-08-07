import { useState, type FormEvent } from 'react'
import { api, setToken } from '../lib/api'
import { THEMES, applyThemeColors, type ThemeDefinition } from '../lib/themes'

export default function RegisterForm() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('cafe')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'theme'>('theme')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      const data = await api.postForm<{ token: string }>('/auth/register', {
        name, username, email, password,
        password_confirmation: passwordConfirmation,
        theme: selectedTheme,
      })
      applyThemeColors(selectedTheme)
      setToken(data.token)
      window.location.href = '/'
    } catch (err: any) {
      if (err.errors) {
        setError(Object.values(err.errors).flat().join(', '))
      } else {
        setError(err.message || 'Erro ao criar conta')
      }
    } finally {
      setLoading(false)
    }
  }

  // Theme selection step
  if (step === 'theme') {
    return (
      <div className="contact-form">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Escolha sua identidade
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
            Sua identidade define como você vê o conhecimento. Cores, ícones e até os nomes das recompensas mudam com a sua escolha.
          </p>
        </div>

        <div className="theme-grid">
          {Object.values(THEMES).map(theme => {
            const isSelected = selectedTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedTheme(theme.id)
                  applyThemeColors(theme.id)
                }}
                className={`theme-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="theme-gradient" style={{
                  background: `linear-gradient(90deg, ${theme.colors.gradient_from}, ${theme.colors.gradient_to})`,
                  opacity: isSelected ? 1 : 0.5,
                }} />
                <div className="theme-icon">{theme.icon}</div>
                <h3 className="theme-name">{theme.name}</h3>
                <p className="theme-desc">{theme.description}</p>
                {isSelected && (
                  <div className="theme-check">✓</div>
                )}
              </button>
            )
          })}
        </div>

        <div className="theme-preview glass-card">
          <div className="theme-preview-header">
            <span className="theme-preview-icon">{THEMES[selectedTheme].icon}</span>
            <div>
              <h3 className="theme-preview-title">Tema: {THEMES[selectedTheme].name}</h3>
              <div className="theme-preview-vocab">
                {Object.values(THEMES[selectedTheme].vocabulary).slice(0, 4).map(word => (
                  <span key={word} className="theme-preview-word">{word}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="theme-preview-progress">
            <div className="theme-preview-bar">
              <div className="theme-preview-fill" style={{
                width: '60%',
                background: `linear-gradient(90deg, ${THEMES[selectedTheme].colors.gradient_from}, ${THEMES[selectedTheme].colors.gradient_to})`,
              }} />
            </div>
            <span className="theme-preview-pct">60%</span>
          </div>
          <p className="theme-preview-note">🎨 As cores e vocabulário do site se adaptam ao tema escolhido</p>
        </div>

        <button
          onClick={() => setStep('form')}
          className="btn-primary form-submit theme-continue"
        >
          Continuar com {THEMES[selectedTheme].name} {THEMES[selectedTheme].icon}
        </button>
      </div>
    )
  }

  // Registration form step
  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="theme-indicator glass-card">
        <span className="theme-indicator-icon">{THEMES[selectedTheme].icon}</span>
        <span className="theme-indicator-text">
          Identidade: <strong style={{ color: THEMES[selectedTheme].colors.primary }}>{THEMES[selectedTheme].name}</strong>
        </span>
        <button type="button" onClick={() => setStep('theme')}
          className="theme-indicator-change">
          Alterar
        </button>
      </div>

      {error && (
        <div className="form-error">{error}</div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Nome</label>
          <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
            className="form-input" placeholder="Seu nome" />
        </div>
        <div className="form-group">
          <label htmlFor="username" className="form-label">Usuário</label>
          <input id="username" type="text" required value={username} onChange={e => setUsername(e.target.value)}
            className="form-input" placeholder="seu_usuario" />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="email" className="form-label">Email</label>
        <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="form-input" placeholder="seu@email.com" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="password" className="form-label">Senha (mín. 8 caracteres)</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            className="form-input" placeholder="Sua senha" />
        </div>
        <div className="form-group">
          <label htmlFor="password_confirmation" className="form-label">Confirmar senha</label>
          <input id="password_confirmation" type="password" required value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)}
            className={`form-input ${passwordConfirmation && passwordConfirmation !== password ? 'form-input-error' : ''}`}
            placeholder="Repita sua senha" />
          {passwordConfirmation && passwordConfirmation !== password && (
            <p className="form-error-text">As senhas não coincidem.</p>
          )}
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary form-submit">
        {loading ? 'Criando conta...' : `Criar Conta ${THEMES[selectedTheme].icon}`}
      </button>
    </form>
  )
}
