"use client";

import { useEffect } from "react";

/**
 * Service Worker 登録 + SW_UNREGISTERED メッセージ受信時リロード
 *
 * 動作フロー:
 * 1. 古いSWが新しいsw.jsを取得 → skipWaiting → 全キャッシュ削除
 * 2. SW_UNREGISTEREDメッセージをクライアントに送信
 * 3. 再生中でなければ即リロード、再生中なら停止時にリロード
 */
export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UNREGISTERED") {
        console.log("[SW] SW_UNREGISTERED received → scheduling reload");
        scheduleReload();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}

type WinWithPlayState = typeof window & { __icmb_isPlaying?: boolean };

function scheduleReload() {
  const isPlaying = (window as WinWithPlayState).__icmb_isPlaying ?? false;
  console.log("[SW] scheduleReload called, isPlaying:", isPlaying);

  if (!isPlaying) {
    console.log("[SW] Not playing → reloading now");
    window.location.reload();
    return;
  }

  console.log("[SW] Playing → will reload when playback stops");

  const handlePlayState = (e: Event) => {
    const { isPlaying: playing } = (e as CustomEvent<{ isPlaying: boolean }>).detail;
    if (!playing) {
      window.removeEventListener("icmb-playstate", handlePlayState);
      console.log("[SW] Playback stopped → reloading now");
      window.location.reload();
    }
  };

  window.addEventListener("icmb-playstate", handlePlayState);
}
