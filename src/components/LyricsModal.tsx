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
  currentTime: number; // 秒
  duration: number;    // 秒
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LyricsModal({
  isOpen, onClose, trackTitle,
  lines, currentIndex, status,
  currentTime, duration,
}: LyricsModalProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  // 現在行が変わったら中央にスクロール
  useEffect(() => {
    if (!isOpen || currentIndex < 0) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex, isOpen]);

  // ESCキーで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "linear-gradient(160deg, #0a0a14 0%, #12060e 100%)",
        display: "flex", flexDirection: "column",
        fontFamily: "var(--font-mplus), 'M PLUS Rounded 1c', sans-serif",
      }}
    >
      {/* ヘッダー */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid rgba(214,80,118,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ color: "#D65076", fontSize: 10, letterSpacing: "0.2em", marginBottom: 2 }}>
            ♪ LYRICS
          </p>
          <p style={{
            color: "#ddd", fontSize: 13, fontWeight: 700,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {trackTitle}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: "50%", width: 32, height: 32,
            color: "#aaa", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 12,
          }}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>

      {/* 歌詞エリア */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1, overflowY: "auto",
          padding: "40px 24px",
          scrollbarWidth: "none",
        }}
      >
        {status === "loading" && (
          <div style={{ textAlign: "center", color: "#444", paddingTop: 60 }}>
            <p style={{ fontSize: 14 }}>読み込み中…</p>
          </div>
        )}

        {(status === "not_found" || status === "error") && (
          <div style={{
            textAlign: "center", paddingTop: 60,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>🎵</span>
            <p style={{ fontSize: 14, color: "#555" }}>歌詞準備中</p>
            <p style={{ fontSize: 12, color: "#333" }}>もうしばらくお待ちください</p>
          </div>
        )}

        {status === "ready" && (
          <>
            {/* 上フェード */}
            <div style={{
              position: "sticky", top: 0, height: 60, pointerEvents: "none",
              background: "linear-gradient(180deg, #0a0a14, transparent)",
              marginBottom: -60, zIndex: 1,
            }} />

            {lines.map((line, i) => {
              const isActive = i === currentIndex;
              const isPast = i < currentIndex;
              return (
                <div
                  key={i}
                  ref={isActive ? activeRef : undefined}
                  style={{
                    textAlign: "center",
                    padding: isActive ? "12px 0" : "5px 0",
                    fontSize: isActive ? 22 : isPast ? 13 : 14,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#ffffff" : isPast ? "#3a3a3a" : "#555",
                    textShadow: isActive
                      ? "0 0 24px rgba(214,80,118,0.7), 0 0 48px rgba(214,80,118,0.3)"
                      : "none",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    lineHeight: 1.6,
                  }}
                >
                  {line.text}
                </div>
              );
            })}

            {/* 下フェード */}
            <div style={{
              position: "sticky", bottom: 0, height: 60, pointerEvents: "none",
              background: "linear-gradient(0deg, #12060e, transparent)",
              marginTop: -60, zIndex: 1,
            }} />
          </>
        )}
      </div>

      {/* フッター: プログレスバー */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "12px 20px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          borderTop: "1px solid rgba(214,80,118,0.1)",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: "#666", minWidth: 32, fontVariantNumeric: "tabular-nums" }}>
          {fmt(currentTime)}
        </span>
        <div style={{ flex: 1, height: 3, background: "#222", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #D65076, #ff80a0)",
            transition: "width 0.4s linear",
          }} />
        </div>
        <span style={{ fontSize: 11, color: "#666", minWidth: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {fmt(duration)}
        </span>
      </div>

      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
