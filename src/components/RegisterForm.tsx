import { useState, type FormEvent } from 'react'
import { api, setToken } from '../lib/api'

export default function RegisterForm() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post<{ token: string }>('/auth/register', {
        name, username, email, password, password_confirmation: password,
      })
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

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error && (
        <div class="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">{error}</div>
      )}
      <div>
        <label for="name" class="block text-sm font-medium text-foreground mb-1">Nome</label>
        <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Seu nome" />
      </div>
      <div>
        <label for="username" class="block text-sm font-medium text-foreground mb-1">Usuário</label>
        <input id="username" type="text" required value={username} onChange={e => setUsername(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="seu_usuario" />
      </div>
      <div>
        <label for="email" class="block text-sm font-medium text-foreground mb-1">Email</label>
        <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="seu@email.com" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-foreground mb-1">Senha (mín. 8 caracteres)</label>
        <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
          class="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Sua senha" />
      </div>
      <button type="submit" disabled={loading}
        class="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>
  )
}
