"use client";

import { useState } from "react";
import { Track } from "@/lib/tracks";

type Props = {
  track: Track;
};

// ── SVGアイコン ────────────────────────────────────────
function XIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      {/* X (旧Twitter) ロゴ */}
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

// ── シェアテキスト生成 ────────────────────────────────
function buildShareText(track: Track): string {
  return `🍦 いま「${track.title}」を聴いています！\n#あいぱく #アイスクリーム`;
}

export default function ShareButtons({ track }: Props) {
  const [copied, setCopied] = useState(false);

  const text = buildShareText(track);

  // X (Twitter) シェア
  const shareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,width=600,height=400");
  };

  // LINE シェア
  const shareLine = () => {
    const url = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,width=600,height=600");
  };

  // クリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* ラベル */}
      <p style={{
        fontSize: 9,
        color: "rgba(245,230,200,0.35)",
        letterSpacing: "0.2em",
        textAlign: "center",
        fontFamily: "'Shippori Mincho', serif",
      }}>
        ― SHARE ―
      </p>

      {/* ボタン列 */}
      <div className="flex gap-2 justify-center">

        {/* X シェア */}
        <button
          onClick={shareX}
          title="Xでシェア"
          className="flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95"
          style={{
            flex: 1,
            maxWidth: 90,
            padding: "7px 0",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 6,
            color: "#F5E6C8",
            fontSize: 10,
            letterSpacing: "0.08em",
            justifyContent: "center",
          }}
        >
          <XIcon size={14} color="#F5E6C8" />
          <span>ポスト</span>
        </button>

        {/* LINE シェア */}
        <button
          onClick={shareLine}
          title="LINEでシェア"
          className="flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95"
          style={{
            flex: 1,
            maxWidth: 90,
            padding: "7px 0",
            background: "rgba(6,199,85,0.12)",
            border: "1px solid rgba(6,199,85,0.3)",
            borderRadius: 6,
            color: "#4AE080",
            fontSize: 10,
            letterSpacing: "0.08em",
            justifyContent: "center",
          }}
        >
          <LineIcon size={14} color="#4AE080" />
          <span>LINE</span>
        </button>

        {/* コピー */}
        <button
          onClick={copyToClipboard}
          title="テキストをコピー"
          className="flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95"
          style={{
            flex: 1,
            maxWidth: 90,
            padding: "7px 0",
            background: copied ? "rgba(93,184,154,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${copied ? "rgba(93,184,154,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 6,
            color: copied ? "#5DB89A" : "rgba(245,230,200,0.5)",
            fontSize: 10,
            letterSpacing: "0.08em",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {copied
            ? <><CheckIcon size={13} color="#5DB89A" /><span>コピー済</span></>
            : <><CopyIcon size={13} color="rgba(245,230,200,0.5)" /><span>コピー</span></>
          }
        </button>
      </div>

      {/* シェアプレビュー */}
      <div style={{
        padding: "6px 10px",
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 4,
        fontSize: 9,
        color: "rgba(245,230,200,0.4)",
        lineHeight: 1.6,
        letterSpacing: "0.04em",
        whiteSpace: "pre-line",
      }}>
        {text}
      </div>
    </div>
  );
}
