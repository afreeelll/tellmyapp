import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { BASE_URL } from './config';

// Do precaching
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

// Runtime caching
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ url }) =>
    url.origin === 'https://tile.openstreetmap.org' ||
    /^https:\/\/[abc]\.tile\.openstreetmap\.org$/.test(url.origin),
  new StaleWhileRevalidate({
    cacheName: 'map-tiles',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

registerRoute(
  ({ url }) =>
    url.pathname.endsWith('marker-icon.png') ||
    url.pathname.endsWith('marker-shadow.png'),
  new CacheFirst({
    cacheName: 'leaflet-markers',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

registerRoute(
  ({ url }) => {
    return url.origin === 'https://ui-avatars.com';
  },
  new CacheFirst({
    cacheName: 'avatars-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination !== 'image';
  },
  new NetworkFirst({
    cacheName: 'tellmy-api',
  })
);

registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'tellmy-api-images',
  })
);

registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ url }) => {
    return url.origin.includes('maptiler');
  },
  new CacheFirst({
    cacheName: 'maptiler-api',
  })
);

registerRoute(
  ({ url }) =>
    url.origin === 'https://unpkg.com' && url.pathname.includes('/leaflet'),
  new CacheFirst({
    cacheName: 'leaflet-cdn',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

self.addEventListener('push', (event) => {
  console.log('Service worker pushing...');

  async function chainPromise() {
    const data = await event.data.json();
    await self.registration.showNotification(data.title, {
      body: data.options.body,
    });
  }

  event.waitUntil(chainPromise());
});
