"use client";

import { useEffect, useState } from "react";

type Platform = "android" | "ios" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // すでにインストール済み（standaloneモード）なら非表示
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
    if (isStandalone) { setIsInstalled(true); return; }

    // プラットフォーム判定
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as { MSStream?: unknown }).MSStream;
    if (isIOS) {
      setPlatform("ios");
    }

    // Android Chrome: beforeinstallpromptイベントをキャッチ
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // インストール完了検知
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // インストール済み or 閉じた場合は表示しない
  if (isInstalled || dismissed) return null;
  // iOSでもAndroidでもない（PCなど）は表示しない
  if (platform === "other" && !deferredPrompt) return null;

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowIOSHint((v) => !v);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #2A1208 0%, #1A0A04 100%)",
      borderTop: "2px solid #B8800A",
      padding: "14px 16px",
      position: "relative",
    }}>
      {/* 閉じるボタン */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute", top: 10, right: 12,
          background: "transparent", border: "none",
          color: "rgba(230,168,32,0.45)", fontSize: 18,
          cursor: "pointer", lineHeight: 1, padding: 4,
        }}
        aria-label="閉じる"
      >×</button>

      <div className="flex items-center gap-3">
        {/* アプリアイコン */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt="ICE CREAM MUSIC BOX"
          style={{
            width: 52, height: 52, borderRadius: 12,
            flexShrink: 0,
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        />

        {/* テキスト + ボタン */}
        <div className="flex-1 min-w-0">
          <p style={{
            color: "#E6A820", fontSize: 12, fontWeight: 700,
            fontFamily: "'Shippori Mincho', serif",
            letterSpacing: "0.05em", lineHeight: 1.4,
            marginBottom: 4,
          }}>
            🍦 無料でいつでもアイスクリームミュージックを楽しもう
          </p>
          <p style={{
            color: "rgba(245,230,200,0.6)", fontSize: 10,
            lineHeight: 1.5, marginBottom: 8,
          }}>
            ホーム画面に追加するとアプリのように起動できます
          </p>
          <button
            onClick={handleInstall}
            style={{
              background: "linear-gradient(135deg, #D4A020, #B8800A)",
              border: "none", borderRadius: 6,
              color: "#1A0A04", fontSize: 11, fontWeight: 700,
              padding: "7px 18px", cursor: "pointer",
              letterSpacing: "0.08em",
              fontFamily: "'Shippori Mincho', serif",
              boxShadow: "0 2px 8px rgba(184,128,10,0.5)",
            }}
          >
            {platform === "ios" ? "📱 追加方法を見る" : "📲 ホーム画面に追加"}
          </button>
        </div>
      </div>

      {/* iOSの場合: 手順案内 */}
      {showIOSHint && platform === "ios" && (
        <div style={{
          marginTop: 12,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(184,128,10,0.3)",
          borderRadius: 8, padding: "10px 14px",
        }}>
          <p style={{ color: "#E6A820", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            Safari でホーム画面に追加する方法
          </p>
          <ol style={{ color: "rgba(245,230,200,0.75)", fontSize: 11, lineHeight: 2, paddingLeft: 16, margin: 0 }}>
            <li>画面下部の <strong style={{ color: "#E6A820" }}>共有ボタン（□↑）</strong> をタップ</li>
            <li><strong style={{ color: "#E6A820" }}>「ホーム画面に追加」</strong> を選択</li>
            <li>右上の <strong style={{ color: "#E6A820" }}>「追加」</strong> をタップして完了</li>
          </ol>
        </div>
      )}
    </div>
  );
}
