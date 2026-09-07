const CACHE_NAME =
    "hamou-math-v1";

const APP_SHELL = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/js/theme.js",
    "/js/navbar.js",
    "/pages/login.html",
    "/pages/register.html",
    "/pages/forgot-password.html",
    "/pages/dashboard.html",
    "/pages/library.html",
    "/pages/tools.html",
    "/pages/levels.html",
    "/pages/curriculum.html",
    "/pages/exercises.html"
];

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            ).then(cache =>
                cache.addAll(
                    APP_SHELL
                )
            )

        );

        self.skipWaiting();
    }
);

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(keys =>
                    Promise.all(
                        keys
                            .filter(
                                key =>
                                    key !==
                                    CACHE_NAME
                            )
                            .map(
                                key =>
                                    caches.delete(
                                        key
                                    )
                            )
                    )
                )

        );

        self.clients.claim();
    }
);

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;

        if (
            request.method !== "GET"
        ) {
            return;
        }

        /*
         * API/Supabase:
         * لا نخزنها في cache.
         */
        const url =
            new URL(
                request.url
            );

        if (
            url.pathname.startsWith("/api/")
        ) {
            return;
        }

        if (
            url.hostname.includes(
                "supabase.co"
            )
        ) {
            return;
        }

        event.respondWith(

            caches.match(
                request
            ).then(cached => {

                if (cached) {
                    return cached;
                }

                return fetch(request)
                    .then(response => {

                        if (
                            !response ||
                            response.status !== 200 ||
                            response.type === "opaque"
                        ) {
                            return response;
                        }

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

                        return response;
                    })
                    .catch(() =>
                        caches.match(
                            "/index.html"
                        )
                    );
            })

        );
    }
);
