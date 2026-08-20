import { useEffect, useRef, useState, useCallback } from 'react'
import { api, isAuthenticated } from '../lib/api'
import { showToast } from './Toast'

interface Props {
  articleId?: number
  recipeId?: number
  articleTitle: string
}

export default function ReadingTracker({ articleId, recipeId, articleTitle }: Props) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const completedRef = useRef(false)
  const startTime = useRef(Date.now())
  const maxScrollRef = useRef(0)
  const progressRef = useRef(0)
  const pausedTimeRef = useRef(0)
  const lastVisibilityChangeRef = useRef(Date.now())
  const docHeightRef = useRef(0)

  // Receitas usam o mesmo rastreador (Fase 6) com endpoints próprios
  const isRecipe = recipeId != null
  const contentId = isRecipe ? recipeId : articleId

  // Only activate for authenticated users
  useEffect(() => {
    if (isAuthenticated()) setVisible(true)
  }, [])

  // Calculate document height (handles lazy images, dynamic content)
  const updateDocHeight = useCallback(() => {
    const h = document.documentElement.scrollHeight - window.innerHeight
    docHeightRef.current = h > 0 ? h : 1
  }, [])

  // Track scroll depth with IntersectionObserver fallback for accuracy
  useEffect(() => {
    if (!visible) return

    updateDocHeight()
    let rafId: number
    let lastScrollTop = window.scrollY

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        // Detect direction for dwell-time heuristic
        const scrollingDown = scrollTop > lastScrollTop
        lastScrollTop = scrollTop

        const depth = Math.min(100, Math.round((scrollTop / docHeightRef.current) * 100))
        maxScrollRef.current = Math.max(maxScrollRef.current, depth)
        progressRef.current = depth
        setProgress(depth)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // Recalculate on resize (images loading, orientation change)
    window.addEventListener('resize', updateDocHeight)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateDocHeight)
      cancelAnimationFrame(rafId)
    }
  }, [visible, updateDocHeight])

  // Track active reading time (pause when tab hidden)
  useEffect(() => {
    const onVisibilityChange = () => {
      const now = Date.now()
      if (document.hidden) {
        lastVisibilityChangeRef.current = now
      } else {
        pausedTimeRef.current += now - lastVisibilityChangeRef.current
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Send progress to API every 15 seconds
  useEffect(() => {
    if (!visible || contentId == null) return

    const progressEndpoint = isRecipe ? `/recipes/${contentId}/progress` : `/articles/${contentId}/progress`
    const completeEndpoint = isRecipe ? `/recipes/${contentId}/complete` : `/articles/${contentId}/complete`
    const noun = isRecipe ? 'receita' : 'artigo'

    const interval = setInterval(async () => {
      const currentProgress = progressRef.current
      const maxProgress = maxScrollRef.current
      const activeTimeSpent = Math.round((Date.now() - startTime.current - pausedTimeRef.current) / 1000)

      try {
        // Envia o maior progresso alcançado para o servidor não "regredir" a
        // leitura quando o usuário volta ao topo da página.
        await api.post(progressEndpoint, {
          progress_percent: Math.max(currentProgress, maxProgress),
          time_spent_seconds: activeTimeSpent,
          scroll_depth: maxProgress,
        })

        // Auto-complete se o usuário chegou a 90%+ (mesmo que já tenha rolado
        // de volta ao topo) e ficou 30s+ de tempo ATIVO na página.
        if (maxProgress >= 90 && activeTimeSpent >= 30 && !completedRef.current) {
          completedRef.current = true
          try {
            await api.post(completeEndpoint)
            showToast(
              `${noun === 'receita' ? 'Receita concluída' : 'Leitura concluída'}! 🎉`,
              'grain',
              { message: `Você ganhou grãos por ${isRecipe ? 'preparar' : 'ler'} "${articleTitle.substring(0, 40)}..."`, duration: 5000 }
            )
          } catch {
            completedRef.current = false // Allow retry on failure
          }
        }
      } catch {
        // Silently fail
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [visible, contentId, isRecipe, articleTitle])

  if (!visible) return null

  return (
    <div
      class="fixed bottom-0 left-0 right-0 h-1 z-50 bg-[var(--color-bg-card-border)]"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso de leitura"
    >
      <div
        class="h-full transition-all duration-500 ease-out rounded-r-full"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-secondary))',
          boxShadow: '0 0 12px var(--color-accent)',
        }}
      />
    </div>
  )
}
