"use client";

import { useEffect } from "react";

/**
 * Service Worker 登録 + 自動更新ハンドラ
 *
 * 動作フロー:
 * 1. SW が更新されると skipWaiting() により即座に activate
 * 2. clients.claim() により controllerchange イベントが発火
 * 3. 再生中でなければ即リロード、再生中なら停止時にリロード
 */
export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // ページロード時点で SW が制御中かどうかを記録
    // false = 初回インストール → controllerchange が来てもリロード不要
    let wasControlled = !!navigator.serviceWorker.controller;
    console.log("[SW] Page loaded, wasControlled:", wasControlled);

    const handleControllerChange = () => {
      console.log("[SW] controllerchange fired, wasControlled:", wasControlled);

      if (!wasControlled) {
        // 初回インストール時の activate はリロード不要
        wasControlled = true;
        console.log("[SW] First install, skip reload");
        return;
      }

      // SW が更新された → 自動リロードをスケジュール
      console.log("[SW] SW updated! Scheduling auto-reload...");
      scheduleReload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope, "| active state:", reg.active?.state ?? "none");
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}

type WinWithPlayState = typeof window & { __icmb_isPlaying?: boolean };

function scheduleReload() {
  const isPlaying = (window as WinWithPlayState).__icmb_isPlaying ?? false;
  console.log("[SW] scheduleReload called, isPlaying:", isPlaying);

  if (!isPlaying) {
    // 再生中でない → 即座にリロード
    console.log("[SW] Not playing → reloading now");
    window.location.reload();
    return;
  }

  // 再生中 → 停止したタイミングでリロード
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
