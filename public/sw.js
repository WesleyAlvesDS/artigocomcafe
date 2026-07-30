// Artigo com Café - Service Worker
// Versão: 1.0.0
const CACHE_NAME = 'artigocomcafe-v1'

// Assets to cache on install
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

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch event - network first, cache fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Skip API and analytics requests
  const url = new URL(event.request.url)
  if (url.hostname.includes('google') || url.hostname.includes('googletagmanager') || url.hostname.includes('gstatic') || url.hostname.includes('fonts')) {
    return
  }

  // For navigation requests, try network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            // Fallback to cached page, or show the offline page, or show homepage
            return cached || caches.match('/offline/') || caches.match('/')
          })
        })
    )
    return
  }

  // For static assets, cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone())
          return response
        })
      }).catch(() => {
        // For image assets, return a transparent placeholder
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
