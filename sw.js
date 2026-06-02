const CACHE = "freedomclock-2026-06-02-1";
const STATIC = [
  "/",
  "/index.html",
  "/about/",
  "/about/index.html",
  "/build/",
  "/build/index.html",
  "/faq/",
  "/faq/index.html",
  "/freedom-time/",
  "/freedom-time/index.html",
  "/privacy/",
  "/privacy/index.html",
  "/sell-vs-borrow/",
  "/sell-vs-borrow/index.html",
  "/calc.js",
  "/quotes.json",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/site.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/.well-known/security.txt",
  "/.well-known/humans.txt",
  "/assets/fonts.css",
  "/assets/page.css",
  "/assets/device-hero.png",
  "/assets/device-hero.webp",
  "/assets/device-hero-2.png",
  "/assets/device-hero-2.webp",
  "/assets/device-hero-3.png",
  "/assets/device-hero-3.webp",
  "/assets/fonts/ibm-plex-mono-300-latin.woff2",
  "/assets/fonts/ibm-plex-mono-400-latin.woff2",
  "/assets/fonts/ibm-plex-mono-500-latin.woff2",
  "/assets/fonts/ibm-plex-mono-600-latin.woff2",
  "/assets/fonts/vt323-400-latin.woff2",
  "/assets/logo_120_transparent.svg",
  "/assets/logo_black_transparent.svg",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/maskable-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for same-origin requests, skip cross-origin API calls entirely
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      fetch(e.request)
        .then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cache.match(e.request))
    )
  );
});
