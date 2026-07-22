const cacheName = "nexodigi-read-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        void caches.open(cacheName).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(async () => (await caches.match(request)) || Response.error()),
  );
});