// ─────────────────────────────────────────────
// Travel Planner — Service Worker
// Gère le cache pour le mode hors-ligne
// ─────────────────────────────────────────────

const CACHE_NAME = 'travel-planner-v1';

// Fichiers à mettre en cache lors de l'installation
const FILES_TO_CACHE = [
  './travel-planner.html',
  './manifest.json'
];

// ── Installation : mise en cache des ressources ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Mise en cache des ressources...');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ── Activation : suppression des anciens caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Suppression ancien cache :', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie Cache First, puis réseau ──
self.addEventListener('fetch', event => {
  // On ne gère que les requêtes GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Ressource trouvée dans le cache → on la retourne
        return cachedResponse;
      }
      // Sinon on va chercher sur le réseau et on met en cache
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Hors-ligne et pas en cache : page de fallback minimale
        return new Response(
          '<html><body style="font-family:sans-serif;text-align:center;padding:40px">' +
          '<h2>✈️ Travel Planner</h2>' +
          '<p>Vous êtes hors-ligne. Rechargez la page une fois connecté.</p>' +
          '</body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    })
  );
});
