import { useState, type FormEvent } from 'react'

interface Props {
  variant?: 'inline' | 'hero'
}

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  maxWidth: '400px'
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.7rem 1rem',
  borderRadius: 'var(--radius-input)',
  border: '1px solid var(--color-bg-card-border)',
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-primary)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  transition: 'border-color 0.25s, box-shadow 0.25s, background-color 0.25s'
}

const btnStyle: React.CSSProperties = {
  padding: '0.7rem 1.25rem',
  borderRadius: 'var(--radius-button)',
  border: 'none',
  background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))',
  color: 'var(--color-btn-text)',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'var(--font-sans)',
  boxShadow: '0 4px 20px color-mix(in srgb, var(--color-accent) 25%, transparent)',
  transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s, opacity 0.25s'
}

export default function NewsletterForm({ variant = 'inline' }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const isHero = variant === 'hero'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api-newsletter.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setStatus('success')
        setMessage('Inscrição realizada com sucesso!')
        setEmail('')
      } else {
        setStatus('error')
        setMessage('Erro ao inscrever. Tente novamente.')
      }
    } catch {
      setStatus('error')
      setMessage('Erro de conexão. Tente novamente.')
    }
  }

  const heroInputGroup = { ...inputGroupStyle, maxWidth: isHero ? '480px' : '400px' }
  const heroInput = { ...inputStyle, ...(isHero ? { padding: '0.9rem 1.25rem', fontSize: '1rem' } : {}) }
  const heroBtn = { ...btnStyle, ...(isHero ? { padding: '0.9rem 1.75rem', fontSize: '0.95rem' } : {}) }

  return (
    <form onSubmit={handleSubmit}>
      <div style={heroInputGroup}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Seu melhor email"
          required
          disabled={status === 'loading'}
          style={heroInput}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-bg-card-border)' }}
          aria-label="Email para newsletter"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          style={heroBtn}
          onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)' } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {status === 'loading' ? 'Enviando…' : 'Inscrever'}
        </button>
      </div>
      {message && (
        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          color: status === 'success' ? 'var(--color-accent)' : '#ef4444'
        }}>
          {message}
        </p>
      )}
    </form>
  )
}
