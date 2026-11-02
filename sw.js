/* The Bank, service worker: caches the app shell so it opens with no internet. */
const CACHE = "david-riare-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon-180.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const req = e.request;
  // Network first for the page itself, so a new version always shows when online.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put("./index.html", cp)).catch(() => {});
        return resp;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Cache first for the icons and other assets.
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      const cp = resp.clone();
      caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {});
      return resp;
    }).catch(() => undefined))
  );
});
