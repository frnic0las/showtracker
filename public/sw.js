// Hand-written service worker for ShowTracker's offline app shell.
// No Workbox / next-pwa: kept minimal and deploy-safe on purpose.

// Bump VERSION on every deploy where cached assets should be invalidated.
// The activate handler uses this to drop any caches left over from a
// previous version, so users never get stuck on stale content.
const VERSION = 'v1';
const SHELL_CACHE = `showtracker-shell-${VERSION}`;
const RUNTIME_CACHE = `showtracker-runtime-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, RUNTIME_CACHE];

const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Precache the offline fallback so it is always available, even on
      // the very first offline visit.
      await cache.add(OFFLINE_URL);
      // Activate this worker immediately instead of waiting for old tabs
      // to close, so deploy fixes reach users as fast as possible.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * True for requests we must never cache: same-origin API routes and any
 * call to Supabase (or another auth-bearing endpoint). These responses can
 * contain per-user, authenticated data, so caching them would risk leaking
 * data between sessions or serving stale/private content.
 */
function isBypassRequest(url) {
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    return true;
  }
  if (url.hostname.includes('supabase')) {
    return true;
  }
  return false;
}

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }
  if (url.pathname.startsWith('/_next/static/')) {
    return true;
  }
  return (
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/splash/')
  );
}

/**
 * True for TMDB posters/backdrops. The app renders them through Next.js
 * `<Image>`, so the browser actually requests the same-origin optimizer route
 * `/_next/image?url=<encoded tmdb url>&w=…&q=…` rather than image.tmdb.org
 * directly. Match both: the optimizer route (the real production case) and a
 * bare image.tmdb.org request (in case a raw <img> is ever used).
 */
function isTmdbImage(url) {
  if (url.hostname === 'image.tmdb.org') {
    return true;
  }
  if (url.origin === self.location.origin && url.pathname === '/_next/image') {
    const target = url.searchParams.get('url');
    return target != null && target.startsWith('https://image.tmdb.org/');
  }
  return false;
}

/**
 * Network-first for navigations: always try to fetch the latest HTML first
 * so a fresh deploy is picked up immediately. Only fall back to the cache
 * (or the offline shell) when the network is unreachable.
 */
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    const shellCache = await caches.open(SHELL_CACHE);
    const offline = await shellCache.match(OFFLINE_URL);
    return offline ?? Response.error();
  }
}

/**
 * Cache-first for content-hashed static assets: these never change under
 * the same URL, so serving straight from cache is safe and fast.
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // `cached` is necessarily undefined here — a cache hit early-returns above.
    return Response.error();
  }
}

/**
 * Stale-while-revalidate for TMDB posters/backdrops: show the cached image
 * instantly for a snappy UI, then refresh it in the background so future
 * visits stay up to date.
 */
async function handleTmdbImage(request, event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    // Keep the worker alive until the background refresh finishes; otherwise
    // it may be terminated before the cache is updated.
    event.waitUntil(networkFetch);
    return cached;
  }

  const response = await networkFetch;
  return response ?? Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET requests are cacheable; let everything else hit the network.
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Never cache API calls or Supabase traffic: it carries authenticated,
  // per-user data that must always come from the network.
  if (isBypassRequest(url)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  if (isTmdbImage(url)) {
    event.respondWith(handleTmdbImage(request, event));
    return;
  }

  // Anything else (third-party scripts, uncategorized requests): let the
  // browser handle it normally.
});
