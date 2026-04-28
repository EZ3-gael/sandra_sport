/**
 * Service Worker — Sandra Sport
 *
 * Stratégie :
 *  - Pre-cache : page racine + page /offline + manifest + icônes (au cas où on
 *    soit hors ligne au tout premier chargement).
 *  - Requêtes GET vers le même origin (hors Supabase) : network-first avec
 *    fallback sur le cache, et fallback final sur /offline si rien en cache.
 *  - Requêtes Supabase (auth + data) : passent en direct, jamais cachées —
 *    les données wellness/sessions doivent toujours être fraîches.
 *  - Méthodes non-GET (POST/PUT/DELETE) : passent en direct, jamais cachées.
 *
 * Versionner le cache via CACHE_VERSION pour forcer un nettoyage à chaque
 * changement majeur du SW.
 */

const CACHE_VERSION = 'v1';
const PRECACHE = `sandra-precache-${CACHE_VERSION}`;
const RUNTIME = `sandra-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = ['/', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const expected = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !expected.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/auth/')) return;

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const runtime = await caches.open(RUNTIME);

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      runtime.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await runtime.match(request);
    if (cached) return cached;

    const precache = await caches.open(PRECACHE);
    const precached = await precache.match(request);
    if (precached) return precached;

    if (request.mode === 'navigate') {
      const offline = await precache.match('/offline');
      if (offline) return offline;
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
