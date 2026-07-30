import { useEffect, useRef, useState } from 'react'
import { api, isAuthenticated } from '../lib/api'
import { useToast } from './Toast'

interface Props {
  articleId: number
  articleTitle: string
}

export default function ReadingTracker({ articleId, articleTitle }: Props) {
  const { addToast } = useToast()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const completedRef = useRef(false)
  const startTime = useRef(Date.now())
  const maxScrollRef = useRef(0)
  const progressRef = useRef(0)

  // Only activate for authenticated users
  useEffect(() => {
    if (isAuthenticated()) setVisible(true)
  }, [])

  // Track scroll depth
  useEffect(() => {
    if (!visible) return

    let rafId: number
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const depth = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0
        maxScrollRef.current = Math.max(maxScrollRef.current, depth)
        progressRef.current = depth
        setProgress(depth)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [visible])

  // Send progress to API every 15 seconds
  useEffect(() => {
    if (!visible) return

    const interval = setInterval(async () => {
      const currentProgress = progressRef.current
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000)

      try {
        await api.post(`/articles/${articleId}/progress`, {
          progress_percent: currentProgress,
          time_spent_seconds: timeSpent,
          scroll_depth: maxScrollRef.current,
        })

        // Auto-complete if 90%+ scroll and 30s+ spent
        if (currentProgress >= 90 && timeSpent >= 30 && !completedRef.current) {
          completedRef.current = true
          try {
            await api.post(`/articles/${articleId}/complete`)
            addToast({
              type: 'grain',
              title: 'Leitura concluída! 🎉',
              message: `Você ganhou grãos por ler "${articleTitle.substring(0, 40)}..."`,
              duration: 5000,
            })
          } catch {
            completedRef.current = false // Allow retry on failure
          }
        }
      } catch {
        // Silently fail
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [visible, articleId, articleTitle, addToast])

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
