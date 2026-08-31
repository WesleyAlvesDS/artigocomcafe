const CACHE_NAME = 'ac-dash-v1';
const ASSETS_TO_CACHE = [
    '/admin/login',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', event => {
    // Para PWA (especialmente painel admin), a estratégia ideal é Network First
    // para garantir dados frescos, caindo para o cache se offline.
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});