/* GENERATED at build time from scripts/sw-template.js — do not edit dist/sw.js. */

/**
 * TinyDecklings offline shell.
 *
 * Policy, in full:
 *
 *   - **Precache the shell on install.** The JS, CSS and markup needed to reach the
 *     first screen, listed from the real bundle at build time.
 *   - **Navigations are served the cached shell.** A single-page app has exactly one
 *     document; serving it from cache is what makes the home-screen icon open with
 *     no network.
 *   - **Everything else same-origin is cache-first, then filled in.** Fonts, art and
 *     lazy screen chunks land in the cache the first time they are fetched, so the
 *     second session works on a train even though the first needed a network.
 *   - **Never touch anything cross-origin.** Nothing is fetched cross-origin today
 *     and if that changes, caching someone else's response is not this worker's
 *     business.
 *   - **No skipWaiting.** A new build waits for the old session to end rather than
 *     swapping the code out from under a fight in progress. The page notices and
 *     says an update is ready; the player restarts when they are done.
 */
const VERSION = __VERSION__;
const CACHE = `tinydecklings-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Individually, so one 404 cannot fail the whole install and leave the
      // player with no offline copy at all.
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined),
        ),
      ),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('tinydecklings-') && k !== CACHE)
            .map((k) => caches.delete(k)),
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

  // One document, always the same one: hand back the shell and let the app route.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches
        .match('/index.html')
        .then((cached) => cached ?? fetch(request))
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Opaque and error responses are not worth keeping — a cached 404 is a
          // bug that outlives the deploy that caused it.
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    }),
  );
});
