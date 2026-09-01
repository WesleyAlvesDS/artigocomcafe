const CACHE_NAME = 'ac-dash-v1';
const ASSETS_TO_CACHE = [
    '/admin/login',
    '/manifest.json'
];

// ═══ INSTALL ═══
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// ═══ ACTIVATE ═══
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// ═══ FETCH (Network First) ═══
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});

// ═══ PUSH NOTIFICATION ═══
self.addEventListener('push', event => {
    if (!event.data) {
        return;
    }

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Artigo com Café',
            body: event.data.text(),
            icon: '/favicon-32x32.png',
            url: '/app'
        };
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/favicon-32x32.png',
        badge: data.badge || '/favicon-32x32.png',
        tag: data.tag || 'artigo-com-cafe',
        data: data.data || { url: data.url || '/app' },
        vibrate: [200, 100, 200],
        requireInteraction: false,
        actions: data.actions || [],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Artigo com Café', options)
    );
});

// ═══ NOTIFICATION CLICK ═══
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const url = event.notification.data?.url || '/app';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Verifica se já há uma janela aberta
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }

                // Abre nova janela
                return self.clients.openWindow(url);
            })
    );
});

// ═══ NOTIFICATION CLOSE ═══
self.addEventListener('notificationclose', event => {
    // Analytics ou tracking pode ser adicionado aqui
    console.log('Notification closed:', event.notification.tag);
});
