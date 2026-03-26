const CACHE_NAME = 'coffee-timer-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// Paso 1: Instalar y guardar en caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Paso 2: Interceptar peticiones para que funcione sin internet
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Si el archivo está en caché, lo devuelve. Si no, lo busca en internet.
            return response || fetch(event.request);
        })
    );
});