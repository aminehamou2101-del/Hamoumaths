const CACHE_NAME = "hamou-math-v27";

const APP_FILES = [
  "/",
  "/index.html",
  "/math-lab.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/404.html",
  "/data/resources.json"
];

self.addEventListener("install", event => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then(cache =>
        cache
          .addAll(APP_FILES)
          .catch(() => {})
      )

  );

  self.skipWaiting();

});


self.addEventListener("activate", event => {

  event.waitUntil(

    caches
      .keys()
      .then(keys =>
        Promise.all(

          keys
            .filter(
              key =>
                key !== CACHE_NAME
            )

            .map(
              key =>
                caches.delete(key)
            )

        )
      )

  );

  self.clients.claim();

});


self.addEventListener("fetch", event => {

  const request =
    event.request;

  if(
    request.method !== "GET"
  )
    return;


  const url =
    new URL(request.url);


  if(
    url.origin !==
    self.location.origin
  )
    return;


  /*
   لا نخزن API
  */

  if(
    url.pathname.startsWith("/api/")
  )
    return;


  /*
   الصفحات:
   الشبكة أولًا
   ثم الكاش
  */

  if(
    request.mode === "navigate"
  ){

    event.respondWith(

      fetch(request)

        .then(response => {

          if(
            response &&
            response.ok
          ){

            const copy =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache =>
                cache.put(
                  request,
                  copy
                )
              )
              .catch(() => {});

          }

          return response;

        })

        .catch(() =>
          caches
            .match(request)
            .then(
              cached =>
                cached ||
                caches.match(
                  "/404.html"
                )
            )
        )

    );

    return;

  }


  /*
   الموارد الأخرى
  */

  event.respondWith(

    fetch(request)

      .then(response => {

        if(response.ok){

          const copy =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache =>
              cache.put(
                request,
                copy
              )
            )
            .catch(() => {});

        }

        return response;

      })

      .catch(() =>
        caches.match(request)
      )

  );

});
