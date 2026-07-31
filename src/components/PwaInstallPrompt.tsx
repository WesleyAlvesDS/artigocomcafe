import { useState, useEffect } from 'react'

export default function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (typeof window !== 'undefined') {
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      )

      // Detect iOS Safari
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      setIsIOS(iOS)

      // Check if user already dismissed
      const dismissedTime = localStorage.getItem('pwa_dismissed')
      if (dismissedTime) {
        const daysPassed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
        if (daysPassed < 30) {
          setDismissed(true)
          return
        }
      }

      // Listen for install prompt
      const handleInstallReady = () => {
        // Show prompt after a short delay
        setTimeout(() => setShowPrompt(true), 5000)
      }

      window.addEventListener('pwa-install-ready', handleInstallReady)

      // For non-Chrome browsers, show after some time on page
      if (!isStandalone && !iOS) {
        const timer = setTimeout(() => {
          if (!dismissed) setShowPrompt(true)
        }, 8000)
        return () => {
          clearTimeout(timer)
          window.removeEventListener('pwa-install-ready', handleInstallReady)
        }
      }

      return () => {
        window.removeEventListener('pwa-install-ready', handleInstallReady)
      }
    }
  }, [isStandalone, dismissed])

  useEffect(() => {
    // Hide when installed
    const handleInstalled = () => {
      setShowPrompt(false)
      setIsStandalone(true)
    }
    window.addEventListener('pwa-installed', handleInstalled)
    return () => window.removeEventListener('pwa-installed', handleInstalled)
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa_dismissed', String(Date.now()))
  }

  const handleInstall = async () => {
    const promptEvent = (window as any).__deferredPrompt
    if (promptEvent) {
      promptEvent.prompt()
      const result = await promptEvent.userChoice
      ;(window as any).__deferredPrompt = null
      if (result.outcome === 'accepted') {
        setShowPrompt(false)
      }
    }
  }

  if (isStandalone || dismissed || !showPrompt) return null

  if (isIOS) {
    return (
      <div
        class="fixed bottom-6 left-4 right-4 z-[200] animate-slide-up"
        role="dialog"
        aria-label="Instalar aplicativo"
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-bg-card-border)',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          maxWidth: '400px',
          margin: '0 auto'
        }}
      >
        <button
          onClick={handleDismiss}
          class="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          aria-label="Fechar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <section aria-label="Instruções de instalação" class="flex items-start gap-3">
          <div class="text-2xl">📱</div>
          <div>
            <p class="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
              Instale o App
            </p>
            <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Toque em <strong>Compartilhar</strong> <span class="text-base">⎙</span> e depois em <strong>Adicionar à Tela de Início</strong>.
            </p>
          </div>
        </section>
        <button
          onClick={handleDismiss}
          class="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))',
            color: 'var(--color-btn-text)'
          }}
        >
          Entendi!
        </button>
      </div>
    )
  }

  // Android / Desktop Chrome
  return (
    <div
      class="fixed bottom-6 left-4 right-4 z-[200] animate-slide-up"
        role="dialog"
        aria-label="Instalar aplicativo"
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-bg-card-border)',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          maxWidth: '400px',
          margin: '0 auto'
        }}
      >
        <button
          onClick={handleDismiss}
          class="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          aria-label="Fechar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <section aria-label="Convite de instalação" class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(0,212,170,0.1)' }}>
            ☕
          </div>
          <div class="flex-1">
            <p class="font-semibold text-sm text-[var(--color-text-primary)] mb-0.5">
              Instale o Artigo com Café
            </p>
            <p class="text-xs text-[var(--color-text-secondary)]">
              Adicione à tela de início para acessar rapidamente.
            </p>
          </div>
        </section>
      <div class="flex gap-2 mt-3">
        <button
          onClick={handleDismiss}
          class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-bg-card-border)',
            color: 'var(--color-text-secondary)'
          }}
        >
          Agora não
        </button>
        <button
          onClick={handleInstall}
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))',
            color: 'var(--color-btn-text)'
          }}
        >
          Instalar
        </button>
      </div>
    </div>
  )
}
