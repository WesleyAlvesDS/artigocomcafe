import { useState } from 'react'
import { api, isAuthenticated } from '../lib/api'
import { ToastProvider, useToast } from './Toast'

interface Props {
  articleId: number
}

type BtnState = 'idle' | 'loading' | 'done' | 'error'

export default function ArticleActions({ articleId }: Props) {
  return (
    <ToastProvider>
      <ActionsContent articleId={articleId} />
    </ToastProvider>
  )
}

function ActionsContent({ articleId }: Props) {
  const { addToast } = useToast()
  const [complete, setComplete] = useState<BtnState>('idle')
  const [save, setSave] = useState<BtnState>('idle')

  const requireAuth = (): boolean => {
    if (isAuthenticated()) return true
    window.location.href = '/entrar'
    return false
  }

  const completeReading = async () => {
    if (!requireAuth() || complete === 'loading') return
    setComplete('loading')
    try {
      await api.post(`/articles/${articleId}/complete`)
      setComplete('done')
      addToast({ type: 'grain', title: 'Leitura concluída! 🎉', message: 'Você ganhou grãos por completar esta leitura.', duration: 5000 })
    } catch {
      setComplete('error')
      setTimeout(() => setComplete('idle'), 3000)
    }
  }

  const saveArticle = async () => {
    if (!requireAuth() || save === 'loading') return
    setSave('loading')
    try {
      await api.post(`/user/library/${articleId}`)
      setSave('done')
      addToast({ type: 'success', title: 'Salvo na biblioteca 📚', message: 'O artigo foi adicionado à sua Minha Biblioteca.', duration: 4000 })
    } catch {
      setSave('error')
      setTimeout(() => setSave('idle'), 3000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <button
        onClick={completeReading}
        disabled={complete === 'loading'}
        class="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400"
        style={{ opacity: complete === 'done' ? 0.6 : 1, cursor: complete === 'loading' ? 'wait' : 'pointer' }}
      >
        {complete === 'idle' && '✅ Concluir Leitura'}
        {complete === 'loading' && '⏳ Concluindo...'}
        {complete === 'done' && '✅ Leitura Concluída!'}
        {complete === 'error' && '❌ Erro - Tente novamente'}
      </button>
      <button
        onClick={saveArticle}
        disabled={save === 'loading'}
        class="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all bg-[var(--color-bg-card)] border border-[var(--color-bg-card-border)] text-[var(--color-text-secondary)] hover:border-accent"
        style={{ opacity: save === 'done' ? 0.6 : 1, cursor: save === 'loading' ? 'wait' : 'pointer' }}
      >
        {save === 'idle' && '📚 Salvar na Biblioteca'}
        {save === 'loading' && '⏳ Salvando...'}
        {save === 'done' && '✅ Salvo!'}
        {save === 'error' && '❌ Erro - Tente novamente'}
      </button>
    </div>
  )
}
