// ICE CREAM MUSIC BOX — Service Worker
const CACHE_NAME = "icmb-v4";

// キャッシュするファイル（アプリシェル）
const PRECACHE = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// SKIP_WAITING メッセージを受信したら即座に有効化（更新通知からの明示的な指示）
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  // skipWaiting() をここでは呼ばない → 更新通知UIで明示的に更新するまで待機
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

  // APIルートはSWでインターセプトしない（必ずサーバーへ）
  if (url.pathname.startsWith("/api/")) return;

  // 外部オリジン（R2音楽ファイルなど）はキャッシュ対象外
  if (url.origin !== self.location.origin) return;

  // ナビゲーションリクエスト（HTML）→ ネットワーク優先（常に最新版を取得）
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // 静的アセット（画像・フォントなど）→ ネットワーク優先、失敗時はキャッシュ
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
