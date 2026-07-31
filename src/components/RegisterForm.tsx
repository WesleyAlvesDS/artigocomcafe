import { useState, type FormEvent } from 'react'
import { api, setToken } from '../lib/api'
import { THEMES, applyThemeColors, type ThemeDefinition } from '../lib/themes'

export default function RegisterForm() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('cafe')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'theme'>('theme')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post<{ token: string }>('/auth/register', {
        name, username, email, password,
        password_confirmation: password,
        theme: selectedTheme,
      })
      // Apply theme colors immediately
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
      <div class="space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Escolha sua identidade
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
            Sua identidade define como você vê o conhecimento. Cores, ícones e até os nomes das recompensas mudam com a sua escolha.
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.values(THEMES).map(theme => {
            const isSelected = selectedTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedTheme(theme.id)
                  applyThemeColors(theme.id)
                }}
                class={`relative p-4 rounded-2xl text-center transition-all duration-300 border-2 ${
                  isSelected
                    ? 'border-[var(--color-accent)] bg-[var(--color-bg-card)] shadow-lg scale-[1.02]'
                    : 'border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)]/30 hover:scale-[1.01]'
                }`}
              >
                {/* Preview gradient bar */}
                <div class="h-1.5 rounded-full mb-3 transition-all duration-500"
                  style={{
                    background: `linear-gradient(90deg, ${theme.colors.gradient_from}, ${theme.colors.gradient_to})`,
                    opacity: isSelected ? 1 : 0.5,
                  }}
                />
                <div class="text-3xl mb-2">{theme.icon}</div>
                <h3 class={`text-sm font-bold transition-colors ${
                  isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                }`}>
                  {theme.name}
                </h3>
                <p class="text-[10px] text-[var(--color-text-muted)] mt-1 leading-tight">
                  {theme.description}
                </p>
                {isSelected && (
                  <div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xs font-bold shadow-lg">
                    ✓
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Preview card */}
        <div class="glass-card p-4 transition-all duration-500">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">{THEMES[selectedTheme].icon}</span>
            <div>
              <h3 class="font-bold text-sm text-[var(--color-text-primary)]">
                Tema: {THEMES[selectedTheme].name}
              </h3>
              <div class="flex gap-2 mt-1">
                {Object.values(THEMES[selectedTheme].vocabulary).slice(0, 4).map(word => (
                  <span key={word} class="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: `${THEMES[selectedTheme].colors.primary}22`,
                      color: THEMES[selectedTheme].colors.primary,
                    }}>
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 rounded-full bg-[var(--color-bg-card-border)] overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                style={{
                  width: '60%',
                  background: `linear-gradient(90deg, ${THEMES[selectedTheme].colors.gradient_from}, ${THEMES[selectedTheme].colors.gradient_to})`,
                }}
              />
            </div>
            <span class="text-xs font-mono text-[var(--color-text-muted)]">60%</span>
          </div>
          <p class="text-xs text-[var(--color-text-muted)] mt-2">
            🎨 As cores e vocabulário do site se adaptam ao tema escolhido
          </p>
        </div>

        <button
          onClick={() => setStep('form')}
          class="w-full py-3 px-6 rounded-xl font-bold text-base transition-all"
          style={{
            background: `linear-gradient(135deg, ${THEMES[selectedTheme].colors.gradient_from}, ${THEMES[selectedTheme].colors.gradient_to})`,
            color: 'var(--color-btn-text)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.opacity = '0.95' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1' }}
        >
          Continuar com {THEMES[selectedTheme].name} {THEMES[selectedTheme].icon}
        </button>
      </div>
    )
  }

  // Registration form step
  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {/* Theme indicator */}
      <div class="flex items-center gap-2 mb-4 p-3 rounded-xl"
        style={{
          background: `${THEMES[selectedTheme].colors.primary}11`,
          border: `1px solid ${THEMES[selectedTheme].colors.primary}22`,
        }}
      >
        <span class="text-xl">{THEMES[selectedTheme].icon}</span>
        <span class="text-sm text-[var(--color-text-secondary)] flex-1">
          Identidade: <strong style={{ color: THEMES[selectedTheme].colors.primary }}>{THEMES[selectedTheme].name}</strong>
        </span>
        <button type="button" onClick={() => setStep('theme')}
          class="text-xs px-2.5 py-1 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] transition-colors">
          Alterar
        </button>
      </div>

      {error && (
        <div class="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">{error}</div>
      )}
      <div>
        <label for="name" class="block text-sm font-medium text-foreground mb-1">Nome</label>
        <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 transition-shadow"
          placeholder="Seu nome" />
      </div>
      <div>
        <label for="username" class="block text-sm font-medium text-foreground mb-1">Usuário</label>
        <input id="username" type="text" required value={username} onChange={e => setUsername(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 transition-shadow"
          placeholder="seu_usuario" />
      </div>
      <div>
        <label for="email" class="block text-sm font-medium text-foreground mb-1">Email</label>
        <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 transition-shadow"
          placeholder="seu@email.com" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-foreground mb-1">Senha (mín. 8 caracteres)</label>
        <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 transition-shadow"
          placeholder="Sua senha" />
      </div>
      <button type="submit" disabled={loading}
        class="w-full py-2.5 px-4 rounded-xl font-medium transition-all disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${THEMES[selectedTheme].colors.gradient_from}, ${THEMES[selectedTheme].colors.gradient_to})`,
          color: 'var(--color-btn-text)',
        }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.95' } }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.opacity = '1' }}
      >
        {loading ? 'Criando conta...' : `Criar Conta ${THEMES[selectedTheme].icon}`}
      </button>
    </form>
  )
}
