const CACHE_NAME = "hamou-math-v29";
const OFFLINE_URL = "/404.html";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg"
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

  /* API: لا نخزن طلبات API */
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  /* resources.json:
     الشبكة أولاً دائمًا */
  if (url.pathname === "/data/resources.json") {

    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
      .then(response => {

        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy))
            .catch(() => {});
        }

        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {

          if (cached) return cached;

          return new Response(
            JSON.stringify({
              resources: []
            }),
            {
              status: 503,
              headers: {
                "Content-Type":
                  "application/json; charset=utf-8"
              }
            }
          );
        })
      )
    );

    return;
  }

  /* صفحات HTML:
     Network First */
  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {

    event.respondWith(
      fetch(request)
        .then(response => {

          if (response && response.ok) {

            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache =>
                cache.put(request, copy)
              )
              .catch(() => {});
          }

          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => {

            if (cached) return cached;

            return caches.match(OFFLINE_URL);
          })
        )
    );

    return;
  }

  /* الملفات الثابتة */
  event.respondWith(
    fetch(request)
      .then(response => {

        if (response && response.ok) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache =>
              cache.put(request, copy)
            )
            .catch(() => {});
        }

        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {

          if (cached) return cached;

          return new Response("", {
            status: 503,
            statusText: "Service Unavailable"
          });
        })
      )
  );
});
