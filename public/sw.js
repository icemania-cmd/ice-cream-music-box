// ICE CREAM MUSIC BOX — Service Worker (no-cache / PWA install only)
// キャッシュは一切しない。PWAインストール（ホーム画面追加）のためだけに登録を維持する。

self.addEventListener("install", () => {
  // 待機せず即座にactivateへ移行
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // 古いキャッシュをすべて削除
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  // 即座に全クライアントを制御下に
  self.clients.claim();
});

// fetchイベントは何もしない → ネットワークにそのまま通す（キャッシュしない）
