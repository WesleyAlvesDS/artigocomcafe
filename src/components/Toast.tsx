import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'grain' | 'achievement'

interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
  icon?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nextId++
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => removeToast(id), toast.duration || 4000)
  }, [removeToast])

  // Escuta toasts disparados fora do contexto (ex.: forms) via window event.
  useEffect(() => {
    const onShow = (e: Event) => {
      const detail = (e as CustomEvent<Omit<Toast, 'id'>>).detail
      if (detail?.title) addToast(detail)
    }
    window.addEventListener('app:show-toast', onShow)
    return () => window.removeEventListener('app:show-toast', onShow)
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? { toasts: [], addToast: () => {}, removeToast: () => {} }
}

/**
 * Mostra um toast a partir de qualquer lugar da aplicação, sem precisar
 * estar dentro de um ToastProvider. Se nenhum provider estiver montado,
 * o evento é simplesmente ignorado.
 */
export function showToast(
  title: string,
  type: ToastType = 'info',
  options?: { message?: string; duration?: number; icon?: string }
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('app:show-toast', {
    detail: { title, type, ...options },
  }))
}

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', icon: '✅' },
  error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', icon: '❌' },
  info: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', icon: 'ℹ️' },
  warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: '⚠️' },
  grain: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: '🫘' },
  achievement: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', icon: '🏆' },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const style = TYPE_STYLES[toast.type]

  return (
    <div
      class="pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-[420px] p-4 rounded-2xl backdrop-blur-lg shadow-2xl animate-slide-up cursor-pointer transition-all hover:scale-[1.02]"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}
      onClick={onDismiss}
    >
      <div class="text-2xl flex-shrink-0">{toast.icon || style.icon}</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-[var(--color-text-primary)]">{toast.title}</p>
        {toast.message && (
          <p class="text-xs text-[var(--color-text-secondary)] mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss() }}
        class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
        aria-label="Fechar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
