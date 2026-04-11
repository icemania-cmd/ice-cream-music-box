"use client";

import { useState } from "react";

// ── SVGアイコン ────────────────────────────────────────
function XIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LineIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.952 12.448C19.952 8.343 15.842 5 11.009 5 6.174 5 2.064 8.343 2.064 12.448c0 3.675 3.217 6.751 7.561 7.335.294.064.695.197.797.452.09.233.059.597.029.832l-.129.784c-.039.237-.185.927.806.505 1.003-.428 5.415-3.199 7.39-5.478 1.364-1.501 2.424-3.449 2.424-5.43z" />
      <path d="M9.5 10.5h-1v3h1v-3zm4 0h-1v3h1v-3zm-2 0h-1v3h1v-3z" fill="white" opacity="0.6" />
    </svg>
  );
}

function CopyIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polyline points="20,6 9,17 4,12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareNativeIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

const APP_URL = "https://www.ice-mbox.fun/";
const APP_SHARE_TEXT = `ICE CREAM MUSIC BOX - あいぱく公式ミュージックプレーヤー🍦🎵\nアイスクリームソングが聴き放題！\n${APP_URL}`;

export default function AppShareButtons() {
  const [copied, setCopied] = useState(false);
  const [nativeShared, setNativeShared] = useState(false);

  // X (Twitter) シェア
  const shareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(APP_SHARE_TEXT)}`;
    window.open(url, "_blank", "noopener,width=600,height=400");
  };

  // LINE シェア
  const shareLine = () => {
    const url = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(APP_SHARE_TEXT)}`;
    window.open(url, "_blank", "noopener,width=600,height=600");
  };

  // クリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(APP_SHARE_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = APP_SHARE_TEXT;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Web Share API（スマホネイティブ）
  const shareNative = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "ICE CREAM MUSIC BOX",
          text: "あいぱく公式ミュージックプレーヤー🍦🎵 アイスクリームソングが聴き放題！",
          url: APP_URL,
        });
        setNativeShared(true);
        setTimeout(() => setNativeShared(false), 2000);
      } catch {
        // キャンセルなど無視
      }
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(214,80,118,0.06) 0%, rgba(214,80,118,0.02) 100%)",
      border: "1.5px solid rgba(214,80,118,0.25)",
      borderRadius: 10,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        {/* アイコン */}
        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg, #D65076 0%, #E87898 100%)",
          borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 6px rgba(214,80,118,0.35)",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>
        <div>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#D65076",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
            lineHeight: 1.2,
          }}>
            アプリをシェア
          </p>
          <p style={{
            fontSize: 9,
            color: "#8B6A4A",
            letterSpacing: "0.04em",
            opacity: 0.75,
            lineHeight: 1.2,
          }}>
            ICE CREAM MUSIC BOXを友達に教えよう
          </p>
        </div>
      </div>

      {/* ボタン列 */}
      <div className="flex gap-2 flex-wrap">
        {/* X シェア */}
        <button
          onClick={shareX}
          title="Xでシェア"
          className="flex items-center gap-1.5 transition-all hover:brightness-95 active:scale-95"
          style={{
            flex: 1,
            minWidth: 60,
            padding: "7px 4px",
            background: "#FFF9F0",
            border: "1.5px solid #3D2B1A",
            borderRadius: 6,
            color: "#3D2B1A",
            fontSize: 10,
            letterSpacing: "0.08em",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(61,43,26,0.1)",
          }}
        >
          <XIcon size={13} color="#3D2B1A" />
          <span>ポスト</span>
        </button>

        {/* LINE シェア */}
        <button
          onClick={shareLine}
          title="LINEでシェア"
          className="flex items-center gap-1.5 transition-all hover:brightness-95 active:scale-95"
          style={{
            flex: 1,
            minWidth: 60,
            padding: "7px 4px",
            background: "#06C755",
            border: "1.5px solid #05A847",
            borderRadius: 6,
            color: "#FFFFFF",
            fontSize: 10,
            letterSpacing: "0.08em",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(6,199,85,0.25)",
          }}
        >
          <LineIcon size={13} color="#FFFFFF" />
          <span>LINE</span>
        </button>

        {/* コピー */}
        <button
          onClick={copyToClipboard}
          title="URLをコピー"
          className="flex items-center gap-1.5 transition-all hover:brightness-95 active:scale-95"
          style={{
            flex: 1,
            minWidth: 60,
            padding: "7px 4px",
            background: copied ? "rgba(214,80,118,0.08)" : "#FFF9F0",
            border: `1.5px solid ${copied ? "#D65076" : "#3D2B1A"}`,
            borderRadius: 6,
            color: copied ? "#D65076" : "#3D2B1A",
            fontSize: 10,
            letterSpacing: "0.08em",
            justifyContent: "center",
            transition: "all 0.2s",
            boxShadow: "0 1px 4px rgba(61,43,26,0.1)",
          }}
        >
          {copied
            ? <><CheckIcon size={12} color="#D65076" /><span>コピー済</span></>
            : <><CopyIcon size={12} color="#3D2B1A" /><span>コピー</span></>
          }
        </button>

        {/* Web Share API（スマホのみ表示） */}
        {hasNativeShare && (
          <button
            onClick={shareNative}
            title="シェア"
            className="flex items-center gap-1.5 transition-all hover:brightness-95 active:scale-95"
            style={{
              flex: 1,
              minWidth: 60,
              padding: "7px 4px",
              background: nativeShared ? "rgba(214,80,118,0.12)" : "linear-gradient(135deg, #D65076 0%, #E87898 100%)",
              border: "1.5px solid #D65076",
              borderRadius: 6,
              color: "#FFFFFF",
              fontSize: 10,
              letterSpacing: "0.08em",
              justifyContent: "center",
              boxShadow: "0 1px 6px rgba(214,80,118,0.35)",
            }}
          >
            {nativeShared
              ? <><CheckIcon size={12} color="#D65076" /><span style={{ color: "#D65076" }}>シェア済</span></>
              : <><ShareNativeIcon size={12} color="#FFFFFF" /><span>シェア</span></>
            }
          </button>
        )}
      </div>

      {/* URLプレビュー */}
      <div style={{
        padding: "5px 10px",
        background: "rgba(214,80,118,0.04)",
        border: "1px solid rgba(214,80,118,0.15)",
        borderRadius: 4,
        fontSize: 9,
        color: "#B8607A",
        letterSpacing: "0.04em",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#D65076" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        {APP_URL}
      </div>
    </div>
  );
}
