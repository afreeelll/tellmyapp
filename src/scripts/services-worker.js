const CACHE_STATIC = 'static-v1';
const CACHE_DYNAMIC = 'dynamic-v1';
const CACHE_IMAGE = 'images-v1';
const CACHE_LEAFLET = 'leaflet-tiles-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/favicon.ico',
  '/logo.png',
  // Leaflet
  '/leaflet/leaflet.css',
  '/leaflet/leaflet.js',
  '/marker-icon.png',
  '/marker-shadow.png',
  '/offline.html',
  '/images/fallback.jpg',
];

// INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames // Pastikan CACHE_LEAFLET masuk dalam filter pembersihan
          .filter(
            (name) =>
              ![
                CACHE_STATIC,
                CACHE_DYNAMIC,
                CACHE_IMAGE,
                CACHE_LEAFLET,
              ].includes(name)
          )
          .map((name) => caches.delete(name))
      )
    )
  );
  return self.clients.claim();
});

// FETCH
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Cache-first untuk assets statis
  if (STATIC_ASSETS.includes(requestUrl.pathname)) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cachedResponse) => cachedResponse || fetch(event.request))
    );
    return;
  }

  // 2. Network-first untuk API Story Detail
  if (requestUrl.href.includes('https://story-api.dicoding.dev/v1/stories')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Cache-first untuk gambar foto story (CDN)
  if (
    requestUrl.href.includes('https://story-api.dicoding.dev/v1/images') ||
    requestUrl.pathname.includes('/photos-')
  ) {
    event.respondWith(
      caches.open(CACHE_IMAGE).then((cache) =>
        cache.match(event.request).then((cachedImage) => {
          return (
            cachedImage ||
            fetch(event.request)
              .then((response) => {
                cache.put(event.request, response.clone());
                return response;
              })
              .catch(() => caches.match('/images/fallback.jpg'))
          );
        })
      )
    );
    return;
  }

  // 4. Cache untuk Leaflet tile (OSM)
  if (/^(https?:\/\/)?[abc]\.tile\.openstreetmap\.org/.test(requestUrl.href)) {
    event.respondWith(
      caches.open(CACHE_LEAFLET).then((cache) =>
        cache.match(event.request).then((cachedResponse) => {
          return (
            cachedResponse ||
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(() => cachedResponse)
          );
        })
      )
    );
    return;
  }

  // 5. Default: network-first, fallback ke offline.html
  event.respondWith(
    fetch(event.request)
      .then((res) => res)
      .catch(() =>
        caches
          .match(event.request)
          .then((res) => res || caches.match('/offline.html'))
      )
  );
});
