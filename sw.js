const CACHE_NAME = "hamou-math-v29";

const APP_SHELL = [
  "/",
  "/index.html",
  "/math-lab.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/404.html"
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

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  /*
   * resources.json:
   * network first + no-store
   */
  if (url.pathname === "/data/resources.json") {

    event.respondWith(

      fetch(request, {
        cache:"no-store"
      })

      .then(response => {

        if(response.ok){

          const copy =
            response.clone();

          caches.open(CACHE_NAME)
            .then(cache =>
              cache.put(request,copy)
            )
            .catch(()=>{});
        }

        return response;
      })

      .catch(() =>
        caches.match(request)
      )

    );

    return;
  }

  /*
   * HTML:
   * network first
   */
  if(
    request.mode === "navigate" ||
    request.destination === "document"
  ){

    event.respondWith(

      fetch(request)

      .then(response => {

        if(response.ok){

          const copy =
            response.clone();

          caches.open(CACHE_NAME)
            .then(cache =>
              cache.put(request,copy)
            )
            .catch(()=>{});
        }

        return response;
      })

      .catch(() =>
        caches.match(request)
      )

    );

    return;
  }

  /*
   * Other static assets
   */
  event.respondWith(

    fetch(request)

      .then(response => {

        if(response.ok){

          const copy =
            response.clone();

          caches.open(CACHE_NAME)
            .then(cache =>
              cache.put(request,copy)
            )
            .catch(()=>{});
        }

        return response;
      })

      .catch(() =>
        caches.match(request)
      )

  );
});
