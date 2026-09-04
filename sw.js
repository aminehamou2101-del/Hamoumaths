"use strict";

const CACHE_NAME = "hamou-math-v30";
const STATIC_CACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isAPI(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/auth/")
  );
}

function isResourceJSON(url) {
  return url.pathname === "/data/resources.json";
}

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  /*
   * Never cache API requests.
   */
  if (isAPI(url)) {
    event.respondWith(fetch(request));
    return;
  }

  /*
   * Resource database:
   * network first, then cached copy.
   */
  if (isResourceJSON(url)) {

    event.respondWith(
      fetch(request)
        .then(response => {

          if (response.ok) {

            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache =>
                cache.put(
                  "/data/resources.json",
                  copy
                )
              );

          }

          return response;

        })
        .catch(() =>
          caches.match(
            "/data/resources.json"
          )
        )
    );

    return;
  }

  /*
   * HTML:
   * network first, cache fallback.
   */
  if (
    request.mode === "navigate" ||
    url.pathname.endsWith(".html")
  ) {

    event.respondWith(

      fetch(request)
        .then(response => {

          if (response.ok) {

            const copy =
              response.clone();

            caches.open(CACHE_NAME)
              .then(cache =>
                cache.put(
                  request,
                  copy
                )
              );

          }

          return response;

        })
        .catch(() =>
          caches.match(
            request
          ).then(cached =>
            cached ||
            caches.match(
              "/index.html"
            )
          )
        )

    );

    return;
  }

  /*
   * Static files:
   * cache first, network fallback.
   */
  event.respondWith(

    caches.match(request)
      .then(cached => {

        if(cached){
          return cached;
        }

        return fetch(request)
          .then(response => {

            if(
              response &&
              response.ok
            ){

              const copy =
                response.clone();

              caches.open(
                CACHE_NAME
              ).then(cache =>
                cache.put(
                  request,
                  copy
                )
              );

            }

            return response;

          });

      })

  );

});
