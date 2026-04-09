// ICE CREAM MUSIC BOX — Service Worker
const CACHE_NAME = "icmb-v4"; // バージョンアップ: v3 → v4

// キャッシュするファイル（アプリシェル）
const PRECACHE = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  console.log("[SW] Installing version:", CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  // 待機せず即座にactivateへ移行
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating version:", CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log("[SW] Deleting old cache:", k);
          return caches.delete(k);
        })
      )
    )
  );
  // 即座に全クライアントを制御下に（controllerchangeイベントがクライアント側で発火する）
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIルートとPOSTリクエストはSWでインターセプトしない（必ずサーバーへ）
  if (url.pathname.startsWith("/api/")) return;

  // ナビゲーションリクエスト（ページ遷移）→ ネットワーク優先（最新HTML取得）
  // オフライン時のみキャッシュにフォールバック
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // 成功時はキャッシュを更新しておく（オフライン対策）
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => {
          console.log("[SW] Offline, serving cached page");
          return caches.match("/").then((cached) => cached || caches.match(request));
        })
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
