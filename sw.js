// sw.js - Versão mínima para PWA instalável
const CACHE_NAME = 'finance-app-v2.3.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // Sem externos aqui para evitar CORS. Adicione só locais (ex: '/tailwind.css' se compilar depois)
];

// Install: Cacheia o básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate: Limpa caches antigos (agora deletará v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => 
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {  // Deleta v1 e anteriores
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())  // Assume controle de páginas abertas
  );
});

// Fetch: Serve cache ou rede, com fallback offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => caches.match('/index.html'))  // Fallback para página inicial offline
  );

event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna cache se existir, senão fetch da rede
        if (response) {
          return response;
        }
        return fetch(event.request).then((fetchResponse) => {
          // Cacheia responses da rede para próximas visitas (estratégia "cache-first" com network fallback)
          if (fetchResponse && fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
      .catch(() => {
        // Fallback offline: Tenta servir index.html para rotas SPA
        return caches.match('/index.html');
      })
  );
});
