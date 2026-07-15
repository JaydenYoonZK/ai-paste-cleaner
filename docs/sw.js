/*! AI Paste Cleaner | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/ai-paste-cleaner */
/* Offline support. The shell is precached at install, same-origin requests
   are answered from cache and refreshed in the background, and cross-origin
   requests pass through untouched so live lookups stay live. The cache name
   carries the release version and old caches are dropped on activate. */

const VERSION = "?v=1.5.0";
const CACHE = "ai-paste-cleaner-" + VERSION;
const SHELL = [
  "./",
  "404.html",
  "notfound.js" + VERSION,
  "styles.css" + VERSION,
  "app.js" + VERSION,
  "cleaner.js" + VERSION,
];

addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => skipWaiting()));
});

addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => clients.claim())
  );
});

addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    if (cached) {
      network.catch(() => { /* offline refresh can wait */ });
      return cached;
    }
    try {
      return await network;
    } catch (error) {
      if (req.mode === "navigate") {
        const home = await cache.match("./");
        if (home) return home;
      }
      throw error;
    }
  })());
});
