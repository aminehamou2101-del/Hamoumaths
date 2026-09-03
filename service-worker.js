/* =========================================================
   HAMOU MATH V18.3
   Service Worker
   PWA + Offline Cache
   ========================================================= */

const CACHE_NAME = "hamou-math-v18-3";

const CORE_FILES = [
  "/",
  "/index.html"
];

/* ---------------------------------------------------------
   INSTALL
   --------------------------------------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

/* ---------------------------------------------------------
   ACTIVATE
   --------------------------------------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* ---------------------------------------------------------
   FETCH
   Network First + Offline Fallback
   --------------------------------------------------------- */
self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") {
    return;
  }

  const requestURL = new URL(event.request.url);

  /*
   لا نعترض الطلبات الخارجية مثل:
   Open Library
   Google Fonts
   APIs
   وغيرها
  */
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(

    fetch(event.request)
      .then((response) => {

        /*
          نحفظ نسخة من الاستجابة الناجحة
        */
        if (response && response.status === 200) {

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            })
            .catch(() => {});
        }

        return response;
      })

      .catch(() => {

        /*
          إذا لم يوجد إنترنت:
          نستخدم النسخة المحفوظة
        */
        return caches.match(event.request)
          .then((cachedResponse) => {

            if (cachedResponse) {
              return cachedResponse;
            }

            /*
              إذا كان المستخدم يفتح صفحة غير موجودة
              نعيد الصفحة الرئيسية
            */
            if (event.request.mode === "navigate") {
              return caches.match("/index.html");
            }

            return new Response(
              "HAMOU MATH غير متاح حاليًا دون اتصال.",
              {
                status: 503,
                statusText: "Offline",
                headers: {
                  "Content-Type": "text/plain; charset=utf-8"
                }
              }
            );
          });
      })
  );
});

/* ---------------------------------------------------------
   MESSAGE
   --------------------------------------------------------- */
self.addEventListener("message", (event) => {

  if (!event.data) {
    return;
  }

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {

    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => caches.delete(key))
        );
      })
      .catch(() => {});
  }
});
