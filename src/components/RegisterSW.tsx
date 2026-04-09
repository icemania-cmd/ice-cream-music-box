"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // 既にwaitingのSWがある場合（ページ再読み込み後など）
      if (registration.waiting) {
        window.dispatchEvent(
          new CustomEvent("swUpdate", { detail: registration })
        );
      }

      // 新しいSWのインストールを監視
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // installed = インストール完了・有効化待ち
          // controller が存在する = 既存のSWが動いている（初回インストールではない）
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            window.dispatchEvent(
              new CustomEvent("swUpdate", { detail: registration })
            );
          }
        });
      });
    }).catch(() => {/* 失敗しても動作に影響なし */});

    // SKIP_WAITING 後に controllerchange が発火 → ページリロード
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  return null;
}
