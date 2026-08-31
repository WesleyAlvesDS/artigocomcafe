import { useState, useEffect, type FormEvent } from 'react'
import { api, setToken, isAuthenticated } from '../lib/api'
import { THEMES, applyThemeColors, type ThemeDefinition } from '../lib/themes'

/** Destino pós-cadastro: Dashboard (painel do leitor) é a melhor experiência. */
function getRedirectTarget(): string {
  if (typeof window === 'undefined') return '/dashboard/'
  const url = new URL(window.location.href)
  const next = url.searchParams.get('next')
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/dashboard/'
}

type Errors = Record<string, string>

interface FormValues {
  name: string
  username: string
  email: string
  password: string
  passwordConfirmation: string
}

const EMPTY_VALUES: FormValues = {
  name: '',
  username: '',
  email: '',
  password: '',
  passwordConfirmation: '',
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getFieldError(field: keyof FormValues, values: FormValues): string {
  switch (field) {
    case 'name':
      if (!values.name.trim()) return 'Informe seu nome.'
      if (values.name.trim().length < 2) return 'O nome deve ter pelo menos 2 caracteres.'
      return ''
    case 'username':
      if (!values.username.trim()) return 'Escolha um nome de usuário.'
      if (values.username.trim().length > 50) return 'Máximo de 50 caracteres.'
      if (!/^[a-zA-Z0-9_-]+$/.test(values.username)) return 'Use apenas letras, números, _ e -.'
      return ''
    case 'email':
      if (!values.email.trim()) return 'Informe seu email.'
      if (!isValidEmail(values.email)) return 'Digite um email válido.'
      return ''
    case 'password':
      if (!values.password) return 'Defina uma senha.'
      if (values.password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
      return ''
    case 'passwordConfirmation':
      if (!values.passwordConfirmation) return 'Confirme sua senha.'
      if (values.passwordConfirmation !== values.password) return 'As senhas não coincidem.'
      return ''
    default:
      return ''
  }
}

function computeStrength(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s >= 5) return 3
  if (s >= 3) return 2
  return s >= 1 ? 1 : 0
}

const STRENGTH_LABELS = ['', 'Fraca', 'Média', 'Forte']
const STRENGTH_COLORS = ['', 'ps-on-1', 'ps-on-2', 'ps-on-3']

function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

export default function RegisterForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES)

  // Usuário já autenticado não precisa de cadastro — vai direto ao destino.
  useEffect(() => {
    if (isAuthenticated()) {
      window.location.href = getRedirectTarget()
    }
  }, [])
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Errors>({})
  const [generalError, setGeneralError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('cafe')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'theme' | 'form'>('theme')

  const strength = computeStrength(values.password)

  const update = (field: keyof FormValues, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    if (touched[field]) {
      const err = getFieldError(field, next)
      setErrors(prev => {
        const updated = { ...prev }
        if (err) updated[field] = err
        else delete updated[field]
        return updated
      })
    }
  }

  const handleBlur = (field: keyof FormValues) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const err = getFieldError(field, values)
    setErrors(prev => {
      const updated = { ...prev }
      if (err) updated[field] = err
      else delete updated[field]
      return updated
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    const newErrors: Errors = {}
    const fields: (keyof FormValues)[] = ['name', 'username', 'email', 'password', 'passwordConfirmation']
    for (const field of fields) {
      const err = getFieldError(field, values)
      if (err) newErrors[field] = err
    }
    setErrors(newErrors)
    setTouched(Object.fromEntries(fields.map(f => [f, true])))

    if (Object.keys(newErrors).length > 0) {
      const first = fields.find(f => newErrors[f])
      if (first) {
        const el = document.getElementById(first === 'passwordConfirmation' ? 'password_confirmation' : first)
        el?.focus()
      }
      return
    }

    setLoading(true)
    try {
      const data = await api.postForm<{ token: string }>('/auth/register', {
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
        password_confirmation: values.passwordConfirmation,
        theme: selectedTheme,
      })
      applyThemeColors(selectedTheme)
      setToken(data.token)
      window.location.href = getRedirectTarget()
    } catch (err: unknown) {
      if (err.errors) {
        const mapped: Errors = {}
        for (const [field, msgs] of Object.entries(err.errors)) {
          mapped[field] = Array.isArray(msgs) ? msgs[0] : String(msgs)
        }
        setErrors(mapped)
        setGeneralError('Não foi possível criar a conta. Verifique os campos destacados.')
      } else {
        setGeneralError(err.message || 'Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const stepIndicator = (active: 1 | 2) => (
    <div className="step-indicator">
      <div className={`step-indicator-item ${active === 1 ? 'active' : 'complete'}`}>
        <span>{active === 1 ? '1' : '✓'}</span> Identidade
      </div>
      <div className="step-indicator-line" />
      <div className={`step-indicator-item ${active === 2 ? 'active' : ''}`}>
        <span>2</span> Seus dados
      </div>
    </div>
  )

  // Theme selection step
  if (step === 'theme') {
    return (
      <div className="contact-form">
        {stepIndicator(1)}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Escolha sua identidade
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
            Sua identidade define como você vê o conhecimento. Cores, ícones e até os nomes das recompensas mudam com a sua escolha.
          </p>
        </div>

        <div className="theme-grid">
          {Object.values(THEMES).map((theme: ThemeDefinition) => {
            const isSelected = selectedTheme === theme.id
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={isSelected}
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
          type="button"
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
    <form onSubmit={handleSubmit} className="contact-form" noValidate>
      {stepIndicator(2)}

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

      {generalError && (
        <div className="form-error" role="alert">{generalError}</div>
      )}

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="name" className="form-label">Nome</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            onChange={e => update('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={`form-input ${errors.name ? 'form-input-error' : ''}`}
            placeholder="Seu nome"
          />
          {errors.name && <p id="name-error" className="form-field-error">{errors.name}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="username" className="form-label">Usuário</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={values.username}
            onChange={e => update('username', e.target.value)}
            onBlur={() => handleBlur('username')}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-error' : 'username-hint'}
            className={`form-input ${errors.username ? 'form-input-error' : ''}`}
            placeholder="seu_usuario"
          />
          {errors.username
            ? <p id="username-error" className="form-field-error">{errors.username}</p>
            : <p id="username-hint" className="form-field-hint">Letras, números, _ e -</p>}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="email" className="form-label">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={e => update('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`form-input ${errors.email ? 'form-input-error' : ''}`}
          placeholder="seu@email.com"
        />
        {errors.email && <p id="email-error" className="form-field-error">{errors.email}</p>}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="password" className="form-label">Senha</label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={values.password}
              onChange={e => update('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-strength'}
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
          {values.password && (
            <div id="password-strength" className="password-strength" aria-hidden="true">
              {[1, 2, 3].map(seg => (
                <span key={seg} className={`ps-seg ${seg <= strength ? STRENGTH_COLORS[strength] : ''}`} />
              ))}
              <span className="ps-label">{STRENGTH_LABELS[strength]}</span>
            </div>
          )}
          {errors.password && <p id="password-error" className="form-field-error">{errors.password}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="password_confirmation" className="form-label">Confirmar senha</label>
          <div className="password-wrap">
            <input
              id="password_confirmation"
              type={showPasswordConfirmation ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={values.passwordConfirmation}
              onChange={e => update('passwordConfirmation', e.target.value)}
              onBlur={() => handleBlur('passwordConfirmation')}
              aria-invalid={!!errors.passwordConfirmation}
              aria-describedby={errors.passwordConfirmation ? 'password_confirmation-error' : undefined}
              className={`form-input ${errors.passwordConfirmation ? 'form-input-error' : ''}`}
              placeholder="Repita sua senha"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPasswordConfirmation(v => !v)}
              aria-label={showPasswordConfirmation ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPasswordConfirmation}
            >
              <EyeIcon off={showPasswordConfirmation} />
            </button>
          </div>
          {errors.passwordConfirmation && <p id="password_confirmation-error" className="form-field-error">{errors.passwordConfirmation}</p>}
        </div>
      </div>

      <p className="form-note">
        Seus dados são usados apenas para personalizar sua experiência no site. Nada de spam.
      </p>

      <button type="submit" disabled={loading} className="btn-primary form-submit">
        {loading && <span className="btn-spinner" aria-hidden="true" />}
        {loading ? 'Criando conta...' : `Criar Conta ${THEMES[selectedTheme].icon}`}
      </button>
    </form>
  )
}
