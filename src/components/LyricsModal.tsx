"use client";

import { useEffect, useRef } from "react";
import type { LrcLine, LyricsStatus } from "@/hooks/useLyrics";

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  lines: LrcLine[];
  currentIndex: number;
  status: LyricsStatus;
  currentTime: number;
  duration: number;
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * 距離・過去/未来に応じたスタイル
 * clamp() でSP〜PCの幅に自動対応
 */
function getLineStyle(dist: number, isPast: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    lineHeight: 1.55,
    cursor: "default",
    userSelect: "none",
    textAlign: "center",
    position: "relative",
  };

  if (dist === 0) {
    return {
      ...base,
      fontSize: "clamp(22px, 6.5vw, 32px)",
      fontWeight: 800,
      letterSpacing: "0.04em",
      padding: "clamp(12px, 3vw, 18px) 0",
      opacity: 1,
      background: "linear-gradient(135deg, #ffb3cc 0%, #ffffff 40%, #ffb3cc 75%, #ff80a8 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      transform: "scale(1.06)",
      filter: "drop-shadow(0 0 18px rgba(214,80,118,0.55))",
    };
  }

  if (dist === 1) {
    return {
      ...base,
      fontSize: "clamp(14px, 4vw, 18px)",
      fontWeight: isPast ? 400 : 500,
      letterSpacing: "0.02em",
      padding: "clamp(5px, 1.5vw, 8px) 0",
      opacity: isPast ? 0.32 : 0.55,
      color: isPast ? "#aaa" : "#ddd",
      transform: "scale(1.0)",
    };
  }

  if (dist === 2) {
    return {
      ...base,
      fontSize: "clamp(12px, 3.2vw, 15px)",
      fontWeight: 400,
      padding: "clamp(4px, 1.2vw, 6px) 0",
      opacity: isPast ? 0.15 : 0.32,
      color: isPast ? "#777" : "#aaa",
      filter: "blur(0.6px)",
      transform: "scale(0.97)",
    };
  }

  if (dist === 3) {
    return {
      ...base,
      fontSize: "clamp(11px, 2.8vw, 13px)",
      fontWeight: 400,
      padding: "clamp(3px, 1vw, 5px) 0",
      opacity: isPast ? 0.08 : 0.18,
      color: "#888",
      filter: "blur(1.2px)",
      transform: "scale(0.95)",
    };
  }

  // dist 4以上
  return {
    ...base,
    fontSize: "clamp(10px, 2.4vw, 12px)",
    fontWeight: 400,
    padding: "2px 0",
    opacity: isPast ? 0.04 : 0.1,
    color: "#666",
    filter: "blur(2px)",
    transform: "scale(0.93)",
  };
}

export default function LyricsModal({
  isOpen, onClose, trackTitle,
  lines, currentIndex, status,
  currentTime, duration,
}: LyricsModalProps) {
  const activeRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // アクティブ行を常に中央に
  useEffect(() => {
    if (!isOpen || currentIndex < 0) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex, isOpen]);

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const progressPct = `${(progress * 100).toFixed(2)}%`;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        // 深みのある背景：ピンク系のごく暗いグラデーション
        background: "linear-gradient(170deg, #0d060f 0%, #110208 40%, #0a0a14 100%)",
        display: "flex", flexDirection: "column",
        fontFamily: "var(--font-mplus), 'M PLUS Rounded 1c', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 背景アンビエントグロー（装飾） */}
      <div style={{
        position: "absolute",
        top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(520px, 140vw)",
        height: "min(520px, 140vw)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(214,80,118,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ─── ヘッダー ─── */}
      <div
        style={{
          position: "relative", zIndex: 2,
          padding: "clamp(14px, 4vw, 20px) clamp(16px, 5vw, 24px) clamp(10px, 3vw, 14px)",
          borderBottom: "1px solid rgba(214,80,118,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
          backdropFilter: "blur(12px)",
          background: "rgba(13,6,15,0.6)",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* LYRICS バッジ */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: "clamp(8px, 2vw, 10px)",
              color: "#D65076",
              letterSpacing: "0.25em",
              fontWeight: 700,
              opacity: 0.85,
            }}>
              ♪ LYRICS
            </span>
            {status === "ready" && (
              <span style={{
                display: "inline-block",
                width: 6, height: 6, borderRadius: "50%",
                background: "#D65076",
                animation: "live-pulse 1.8s ease-in-out infinite",
              }} />
            )}
          </div>
          {/* 曲名 */}
          <p style={{
            color: "#eedde8",
            fontSize: "clamp(12px, 3.5vw, 15px)",
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "0.04em",
          }}>
            {trackTitle}
          </p>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "50%",
            width: "clamp(32px, 8vw, 38px)",
            height: "clamp(32px, 8vw, 38px)",
            color: "#888", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 12,
            transition: "background 0.2s, color 0.2s",
          }}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>

      {/* ─── 歌詞エリア ─── */}
      <div
        ref={scrollRef}
        style={{
          position: "relative",
          flex: 1, overflowY: "auto",
          padding: "clamp(40px, 12vw, 72px) clamp(20px, 7vw, 56px)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          zIndex: 1,
        }}
      >
        {/* ─ ローディング ─ */}
        {status === "loading" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 16, paddingTop: 80,
          }}>
            <span style={{ fontSize: 36, opacity: 0.3 }}>🎵</span>
            <p style={{ fontSize: 13, color: "#444", letterSpacing: "0.12em" }}>読み込み中…</p>
          </div>
        )}

        {/* ─ 歌詞なし ─ */}
        {(status === "not_found" || status === "error") && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 16, paddingTop: 80,
          }}>
            <span style={{ fontSize: 52, opacity: 0.15 }}>🎵</span>
            <p style={{ fontSize: 14, color: "#333", letterSpacing: "0.1em" }}>歌詞準備中</p>
            <p style={{ fontSize: 11, color: "#222", letterSpacing: "0.06em" }}>もうしばらくお待ちください</p>
          </div>
        )}

        {/* ─ 歌詞本体 ─ */}
        {status === "ready" && (
          <>
            {/* 上フェード */}
            <div style={{
              position: "sticky", top: 0,
              height: "clamp(60px, 15vw, 100px)",
              pointerEvents: "none",
              background: "linear-gradient(180deg, #0d060f 0%, transparent 100%)",
              marginBottom: "clamp(-60px, -15vw, -100px)",
              zIndex: 10,
            }} />

            <div style={{ position: "relative" }}>
              {lines.map((line, i) => {
                const isActive = i === currentIndex;
                const isPast = i < currentIndex;
                const dist = Math.abs(i - currentIndex);
                const lineStyle = getLineStyle(dist, isPast);

                return (
                  <div
                    key={i}
                    ref={isActive ? activeRef : undefined}
                    style={lineStyle}
                  >
                    {/* アクティブ行のバックグロー */}
                    {isActive && (
                      <div style={{
                        position: "absolute",
                        inset: "-8px -20px",
                        background: "radial-gradient(ellipse 80% 100% at 50% 50%, rgba(214,80,118,0.14) 0%, transparent 70%)",
                        borderRadius: 20,
                        pointerEvents: "none",
                        zIndex: -1,
                        animation: "lyricsGlow 2.4s ease-in-out infinite",
                      }} />
                    )}
                    {line.text}
                  </div>
                );
              })}
            </div>

            {/* 下フェード */}
            <div style={{
              position: "sticky", bottom: 0,
              height: "clamp(60px, 15vw, 100px)",
              pointerEvents: "none",
              background: "linear-gradient(0deg, #110208 0%, transparent 100%)",
              marginTop: "clamp(-60px, -15vw, -100px)",
              zIndex: 10,
            }} />
          </>
        )}
      </div>

      {/* ─── フッター: プログレスバー ─── */}
      <div
        style={{
          position: "relative", zIndex: 2,
          padding: "clamp(10px, 3vw, 14px) clamp(16px, 5vw, 24px)",
          paddingBottom: "calc(clamp(10px, 3vw, 14px) + env(safe-area-inset-bottom))",
          borderTop: "1px solid rgba(214,80,118,0.08)",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          backdropFilter: "blur(12px)",
          background: "rgba(13,6,15,0.6)",
        }}
      >
        <span style={{
          fontSize: "clamp(10px, 2.5vw, 12px)",
          color: "#444",
          minWidth: 32,
          fontVariantNumeric: "tabular-nums",
        }}>
          {fmt(currentTime)}
        </span>

        {/* トラックバー */}
        <div style={{
          flex: 1, height: 3, borderRadius: 3,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: progressPct,
            background: "linear-gradient(90deg, #c04068, #ff80a8)",
            borderRadius: 3,
            transition: "width 0.5s linear",
            boxShadow: "0 0 8px rgba(214,80,118,0.6)",
          }} />
        </div>

        <span style={{
          fontSize: "clamp(10px, 2.5vw, 12px)",
          color: "#444",
          minWidth: 32, textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}>
          {fmt(duration)}
        </span>
      </div>

    </div>
  );
}
