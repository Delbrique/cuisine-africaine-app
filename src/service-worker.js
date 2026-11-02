/* eslint-disable no-restricted-globals */
// Service worker Workbox : compilé par react-scripts (InjectManifest) lors de `npm run build`.
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

clientsClaim();

// Pré-cache de tous les fichiers générés par le build (JS, CSS, polices…).
precacheAndRoute(self.__WB_MANIFEST);

// Navigation : l'application monopage répond hors-ligne via index.html.
const fileExtensionRegexp = /[^/?]+\.[^/]+$/;
registerRoute(({ request, url }) => {
  if (request.mode !== 'navigate') return false;
  if (url.pathname.startsWith('/_') || url.pathname.startsWith('/api')) return false;
  return !url.pathname.match(fileExtensionRegexp);
}, createHandlerBoundToURL(`${process.env.PUBLIC_URL}/index.html`));

// Fichiers statiques du dossier public (logo, icônes…).
registerRoute(
  ({ url }) => url.origin === self.location.origin && /\.(png|svg|ico|webp|jpg|jpeg)$/.test(url.pathname),
  new StaleWhileRevalidate({ cacheName: 'images', plugins: [new ExpirationPlugin({ maxEntries: 60 })] })
);

// Images distantes (photos Cloudinary, Pexels…).
registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin !== self.location.origin,
  new CacheFirst({
    cacheName: 'remote-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
