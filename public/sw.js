// ICE CREAM MUSIC BOX — Service Worker
const CACHE_NAME = "icmb-v3";

// キャッシュするファイル（アプリシェル）
const PRECACHE = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIルートとPOSTリクエストはSWでインターセプトしない（必ずサーバーへ）
  if (url.pathname.startsWith("/api/")) return;

  // ナビゲーションリクエスト（ページ遷移）→ キャッシュ優先
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/").then((cached) => cached || fetch(request))
    );
    return;
  }

  // 静的アセット → ネットワーク優先、失敗時はキャッシュ
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (request.method === "GET" && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
