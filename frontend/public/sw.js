// AgriTwin AI — Progressive Web App Service Worker (v1)

const STATIC_CACHE = "agritwin-static-v1";
const RUNTIME_CACHE = "agritwin-runtime-v1";
const API_CACHE = "agritwin-api-v1";

const PRECACHE_ASSETS = [
  "/",
  "/farms",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// ── Install: Precache App Shell ───────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[SW] Precache skipped items:", err))
  );
});

// ── Activate: Clean up old caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== API_CACHE) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Strategic Caching ─────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Ignore chrome-extension / non-http
  if (!url.protocol.startsWith("http")) return;

  // 1. API Calls (Network-First with Fallback to Cache)
  if (url.pathname.includes("/api/v1/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const resClone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, resClone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ offline: true, message: "Offline / انٹرنیٹ دستیاب نہیں" }),
            { headers: { "Content-Type": "application/json" } }
          );
        })
    );
    return;
  }

  // 2. Next.js Static Chunks & Media (Cache-First, Stale-While-Revalidate)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. HTML Navigation / Page Routes (Network-First with App Shell Cache Fallback)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match("/") || caches.match("/farms");
        })
    );
  }
});
