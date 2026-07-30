// Artigo com Café - Service Worker
// Versão: 2.1.0 (with Push Notifications - resilient caching)
const CACHE_NAME = 'artigocomcafe-v2'

const PRECACHE_URLS = [
  '/',
  '/blog/',
  '/sobre/',
  '/contato/',
  '/offline/',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png'
]

// Bump this version to force SW update
const SW_VERSION = '2.1.0'

self.addEventListener('install', (event) => {
  event.waitUntil(
    console.log('[SW] v' + SW_VERSION + ' installing...')
    caches.open(CACHE_NAME).then((cache) => {
      // Cache each URL individually so one failure doesn't block install
      const cachePromises = PRECACHE_URLS.map((url) => {
        return cache.add(url).catch((err) => {
          console.warn('[SW] Failed to cache', url, err)
        })
      })
      return Promise.all(cachePromises)
    }).then(() => {
      console.log('[SW] v' + SW_VERSION + ' installed successfully')
      return self.skipWaiting()
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.hostname.includes('google') || url.hostname.includes('googletagmanager') || url.hostname.includes('gstatic') || url.hostname.includes('fonts')) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/offline/') || caches.match('/')
          })
        })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone())
          return response
        })
      }).catch(() => {
        if (event.request.destination === 'image') {
          return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" width="1" height="1"><rect fill="transparent"/></svg>', {
            headers: { 'Content-Type': 'image/svg+xml' }
          })
        }
        return new Response('Offline', { status: 503 })
      })
    })
  )
})

// ── Push Notifications ──────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      title: data.title || 'Artigo com Café',
      body: data.body || '',
      icon: data.icon || '/favicon-32x32.png',
      badge: '/favicon-16x16.png',
      image: data.image || undefined,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        articleSlug: data.articleSlug || null,
        dateOfArrival: Date.now(),
      },
      actions: data.actions || [
        { action: 'read', title: 'Ler agora' },
        { action: 'close', title: 'Fechar' },
      ],
      tag: data.tag || 'default',
      renotify: data.renotify || false,
      requireInteraction: true,
      silent: false,
    }

    event.waitUntil(self.registration.showNotification(options.title, options))
  } catch (e) {
    // Fallback for plain text payloads
    event.waitUntil(
      self.registration.showNotification('Artigo com Café', {
        body: event.data.text(),
        icon: '/favicon-32x32.png',
        badge: '/favicon-16x16.png',
      })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const urlToOpen = data.url || '/'

  // Handle action buttons
  if (event.action === 'close') return

  // Open the URL or focus an existing tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a tab with this URL
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
