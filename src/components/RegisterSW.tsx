"use client";

import { useEffect } from "react";

/**
 * Service Worker 登録
 * キャッシュは行わず、PWAインストール（ホーム画面に追加）のためだけに登録する。
 */
export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  }, []);

  return null;
}
