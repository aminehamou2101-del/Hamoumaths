const CACHE_NAME = "hamou-math-v27";
const OFFLINE_URL = "/404.html";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/robots.txt",
  "/sitemap.xml",
  "/404.html",
  "/data/resources.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {})
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy).catch(() => {});
          });
        }

        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;

          if (request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }

          return new Response("", {
            status: 503,
            statusText: "Offline"
          });
        })
      )
  );
});
