// llm service worker. The page registers it as /sw.js?v=<app version>, so the
// cache name changes with every release and old caches are cleared on activate.
//   - shell files are precached; hashed static assets are cache-first
//   - pages (navigations) are network only, with /offline.html when offline
//   - /api/*, auth routes, non-GET and cross-origin requests are never touched
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const PREFIX = "llm-";
const CACHE = `${PREFIX}${VERSION}`;
const OFFLINE = "/offline.html";
const SHELL = [OFFLINE, "/manifest.webmanifest", "/pwa/icon-192.png", "/pwa/icon-512.png"];
const BYPASS = [/^\/api\//, /^\/auth\//, /^\/login/, /^\/logout/, /^\/_next\/data\//, /\/sw\.js$/];
const STATIC_RE = /^\/(_next\/static\/|pwa\/)|\.(?:css|js|woff2?|png|svg|webp|jpg|jpeg|ico)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function cacheable(res) {
  if (!res || !res.ok || res.type !== "basic") return false;
  return !/no-store|private/i.test(res.headers.get("cache-control") || "");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS.some((re) => re.test(url.pathname))) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const refresh = fetch(req)
          .then((res) => {
            if (cacheable(res)) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || refresh;
      }),
    );
  }
});
