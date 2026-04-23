"use client";

import { useEffect, useState } from "react";

type Platform = "android" | "ios" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type WinWithPrompt = typeof window & { __icmb_installPrompt?: BeforeInstallPromptEvent };

const SESSION_KEY = "pwa-install-dismissed";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // sessionStorageで閉じた場合は再表示しない
    if (sessionStorage.getItem(SESSION_KEY)) {
      setDismissed(true);
      return;
    }

    // すでにインストール済み（standaloneモード）なら非表示
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // プラットフォーム判定
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as { MSStream?: unknown }).MSStream;
    if (isIOS) {
      setPlatform("ios");
    }

    // layout.tsx の早期スクリプトでキャプチャ済みのプロンプトを取得
    const cached = (window as WinWithPrompt).__icmb_installPrompt;
    if (cached) {
      setDeferredPrompt(cached);
      setPlatform("android");
    }

    // 早期キャプチャされていない場合に備えてイベントリスナーも設定
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // インストール完了検知
    const onInstalled = () => setIsInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  };

  const handleInstall = async () => {
    // ネイティブプロンプトがある場合（Android Chrome等）
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    // プロンプトがない場合（iOS Safari等）は手順を表示
    setShowIOSHint((v) => !v);
  };

  // SSR時・インストール済み・閉じた後は非表示
  if (!mounted || isInstalled || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#D65076",
        boxShadow: "0 -4px 20px rgba(214, 80, 118, 0.4)",
        fontFamily: "'M PLUS Rounded 1c', sans-serif",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ padding: "12px 16px 16px" }}>
        {/* 閉じるボタン */}
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            fontSize: 20,
            cursor: "pointer",
            lineHeight: 1,
            padding: "4px 6px",
            fontFamily: "sans-serif",
          }}
          aria-label="閉じる"
        >
          ×
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* アイスクリームアイコン */}
          <div style={{
            fontSize: 36,
            lineHeight: 1,
            flexShrink: 0,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}>
            🍦
          </div>

          {/* テキスト + ボタン */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.4,
              marginBottom: 2,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
            }}>
              ICE CREAM MUSIC BOXをホーム画面に追加
            </p>
            <p style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 11,
              lineHeight: 1.4,
              marginBottom: 8,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
            }}>
              モバイルアプリとしてすぐに起動できます。
            </p>
            <button
              onClick={handleInstall}
              style={{
                background: "#fff",
                border: "none",
                borderRadius: 20,
                color: "#D65076",
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 20px",
                cursor: "pointer",
                letterSpacing: "0.04em",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {deferredPrompt ? "インストール" : "📱 追加方法を見る"}
            </button>
          </div>
        </div>

        {/* 手順案内（プロンプトがない環境向け） */}
        {showIOSHint && !deferredPrompt && (
          <div style={{
            marginTop: 12,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "10px 14px",
          }}>
            <p style={{
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 6,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
            }}>
              Safari でホーム画面に追加する方法
            </p>
            <ol style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 12,
              lineHeight: 1.9,
              paddingLeft: 18,
              margin: 0,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
            }}>
              <li>画面下部の <strong>共有ボタン（□↑）</strong> をタップ</li>
              <li><strong>「ホーム画面に追加」</strong> を選択</li>
              <li>右上の <strong>「追加」</strong> をタップして完了</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
