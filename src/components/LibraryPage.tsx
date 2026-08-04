import AuthPage from './AuthPage'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'

interface Collection {
  id: number; name: string; description: string | null
  icon: string | null; color: string | null
  articles_count: number; created_at: string
}

function LibraryContent() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => {
    try { setCollections((await api.get<{ collections: Collection[] }>('/user/collections')).collections) } catch {}
  }

  const create = async () => {
    if (!newName.trim()) return
    try { await api.post('/user/collections', { name: newName }); setNewName(''); setShowForm(false); load() } catch {}
  }

  const remove = async (id: number) => {
    try { await api.delete(`/user/collections/${id}`); load() } catch {}
  }

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-foreground">Minha Biblioteca</h1>
          <button onClick={() => setShowForm(!showForm)}
            class="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-btn-text)] rounded-xl font-medium hover:opacity-90 text-sm">
            + Nova Coleção
          </button>
        </div>
        {showForm && (
          <div class="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()}
              placeholder="Nome da coleção..."
              class="flex-1 px-4 py-2 rounded-xl border border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
            <button onClick={create} class="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-btn-text)] rounded-xl font-medium hover:opacity-90">Criar</button>
          </div>
        )}
      {collections.length === 0 ? (
        <div class="text-center py-16 text-muted-foreground">
          <p class="text-4xl mb-4">📚</p>
          <p>Você ainda não tem coleções.</p>
          <p class="text-sm mt-1">Salve artigos para começar sua biblioteca.</p>
        </div>
      ) : (
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => (
            <div class="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-2xl">{col.icon || '📁'}</span>
                  <h3 class="font-semibold text-foreground mt-1">{col.name}</h3>
                  {col.description && <p class="text-sm text-muted-foreground mt-1">{col.description}</p>}
                  <p class="text-xs text-muted-foreground mt-2">{col.articles_count} artigos</p>
                </div>
                <button onClick={() => remove(col.id)} class="text-muted-foreground hover:text-red-500 transition-colors text-sm">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LibraryPage() {
  return <AuthPage><LibraryContent /></AuthPage>
}
