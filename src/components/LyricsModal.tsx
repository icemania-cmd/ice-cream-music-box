"use client";

import { useEffect } from "react";
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
 * 中心からの距離（行数）→ 縦オフセット(px)の累積テーブル
 * 各行の高さ感を考慮した非線形スペーシング
 */
const OFFSETS = [0, 62, 106, 140, 166, 186, 202, 215];
function getOffset(absDist: number): number {
  if (absDist < OFFSETS.length) return OFFSETS[absDist];
  return OFFSETS[OFFSETS.length - 1] + (absDist - OFFSETS.length + 1) * 16;
}

/** アクティブ行を文字数に応じてフォントサイズ自動調整 */
function getActiveFontSize(len: number): string {
  if (len <= 11) return "clamp(18px, 5vw, 24px)";
  if (len <= 16) return "clamp(15px, 4.2vw, 20px)";
  if (len <= 22) return "clamp(13px, 3.5vw, 17px)";
  return "clamp(11px, 3vw, 15px)";
}

// 左右エッジをグラデーションでフェード
const EDGE_MASK =
  "linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%)";

export default function LyricsModal({
  isOpen,
  onClose,
  trackTitle,
  lines,
  currentIndex,
  status,
  currentTime,
  duration,
}: LyricsModalProps) {
  // Esc で閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const progressPct = `${(progress * 100).toFixed(2)}%`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background:
          "linear-gradient(170deg, #0d060f 0%, #110208 40%, #0a0a14 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-mplus), 'M PLUS Rounded 1c', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 背景アンビエントグロー */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(500px, 150vw)",
          height: "min(500px, 150vw)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(214,80,118,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── ヘッダー ─── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding:
            "clamp(14px, 4vw, 20px) clamp(16px, 5vw, 24px) clamp(10px, 3vw, 14px)",
          borderBottom: "1px solid rgba(214,80,118,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          backdropFilter: "blur(12px)",
          background: "rgba(13,6,15,0.6)",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: "clamp(8px, 2vw, 10px)",
                color: "#D65076",
                letterSpacing: "0.25em",
                fontWeight: 700,
                opacity: 0.85,
              }}
            >
              ♪ LYRICS
            </span>
            {status === "ready" && (
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#D65076",
                  animation: "live-pulse 1.8s ease-in-out infinite",
                }}
              />
            )}
          </div>
          <p
            style={{
              color: "#eedde8",
              fontSize: "clamp(12px, 3.5vw, 15px)",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "0.04em",
            }}
          >
            {trackTitle}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "50%",
            width: "clamp(32px, 8vw, 38px)",
            height: "clamp(32px, 8vw, 38px)",
            color: "#888",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: 12,
          }}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>

      {/* ─── 歌詞エリア（常に中央固定） ─── */}
      <div
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        {/* 上フェードマスク */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "30%",
            zIndex: 10,
            pointerEvents: "none",
            background: "linear-gradient(180deg, #0d060f 0%, transparent 100%)",
          }}
        />
        {/* 下フェードマスク */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "30%",
            zIndex: 10,
            pointerEvents: "none",
            background: "linear-gradient(0deg, #110208 0%, transparent 100%)",
          }}
        />

        {/* ローディング */}
        {status === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 36, opacity: 0.3 }}>🎵</span>
            <p style={{ fontSize: 13, color: "#444", letterSpacing: "0.12em" }}>
              読み込み中…
            </p>
          </div>
        )}

        {/* 歌詞なし */}
        {(status === "not_found" || status === "error") && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 52, opacity: 0.15 }}>🎵</span>
            <p style={{ fontSize: 14, color: "#333", letterSpacing: "0.1em" }}>
              歌詞準備中
            </p>
            <p style={{ fontSize: 11, color: "#222", letterSpacing: "0.06em" }}>
              もうしばらくお待ちください
            </p>
          </div>
        )}

        {/* 歌詞本体：各行を absolute で中央固定配置 */}
        {status === "ready" &&
          lines.map((line, i) => {
            const signedDist = i - currentIndex;
            const absDist = Math.abs(signedDist);
            const isActive = absDist === 0;
            const isPast = signedDist < 0;

            // 遠すぎる行はレンダリングをスキップ
            if (absDist > 7) return null;

            const offset = getOffset(absDist);
            const translateY = signedDist >= 0 ? offset : -offset;

            // 距離別スタイル値
            let fontSize: string;
            let fontWeight: number;
            let opacity: number;
            let blurPx = 0;
            let letterSpacing = "0.02em";
            const isGradient = isActive;
            let color = "#ccc";

            if (isActive) {
              fontSize = getActiveFontSize(line.text.length);
              fontWeight = 800;
              opacity = 1;
              letterSpacing = "0.05em";
            } else if (absDist === 1) {
              fontSize = "clamp(12px, 3.2vw, 15px)";
              fontWeight = isPast ? 400 : 500;
              opacity = isPast ? 0.25 : 0.48;
              color = isPast ? "#999" : "#ddd";
            } else if (absDist === 2) {
              fontSize = "clamp(10px, 2.6vw, 13px)";
              fontWeight = 400;
              opacity = isPast ? 0.10 : 0.24;
              color = isPast ? "#777" : "#aaa";
              blurPx = 0.5;
            } else if (absDist === 3) {
              fontSize = "clamp(9px, 2.2vw, 11px)";
              fontWeight = 400;
              opacity = isPast ? 0.05 : 0.13;
              color = "#888";
              blurPx = 1;
            } else {
              fontSize = "clamp(8px, 2vw, 10px)";
              fontWeight = 400;
              opacity = isPast ? 0.03 : 0.07;
              color = "#666";
              blurPx = 1.8;
            }

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "50%",
                  transform: `translateY(calc(-50% + ${translateY}px))`,
                  transition:
                    "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
                  zIndex: isActive ? 5 : 1,
                }}
              >
                {/* アクティブ行のバックグロー */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: "-20px 0",
                      background:
                        "radial-gradient(ellipse 80% 100% at 50% 50%, rgba(214,80,118,0.16) 0%, transparent 70%)",
                      pointerEvents: "none",
                      animation: "lyricsGlow 2.4s ease-in-out infinite",
                    }}
                  />
                )}

                {/* 左右エッジフェード + overflow clip */}
                <div
                  style={{
                    overflow: "hidden",
                    WebkitMaskImage: EDGE_MASK,
                    maskImage: EDGE_MASK,
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      fontSize,
                      fontWeight,
                      opacity,
                      filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
                      letterSpacing,
                      lineHeight: 1.5,
                      cursor: "default",
                      userSelect: "none",
                      transition: "font-size 0.4s ease, opacity 0.4s ease",
                      ...(isGradient
                        ? {
                            background:
                              "linear-gradient(135deg, #ffb3cc 0%, #ffffff 40%, #ffb3cc 75%, #ff80a8 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            filter:
                              "drop-shadow(0 0 14px rgba(214,80,118,0.5))",
                          }
                        : { color }),
                    }}
                  >
                    {line.text}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* ─── フッター: プログレスバー ─── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(10px, 3vw, 14px) clamp(16px, 5vw, 24px)",
          paddingBottom:
            "calc(clamp(10px, 3vw, 14px) + env(safe-area-inset-bottom))",
          borderTop: "1px solid rgba(214,80,118,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          backdropFilter: "blur(12px)",
          background: "rgba(13,6,15,0.6)",
        }}
      >
        <span
          style={{
            fontSize: "clamp(10px, 2.5vw, 12px)",
            color: "#444",
            minWidth: 32,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmt(currentTime)}
        </span>

        <div
          style={{
            flex: 1,
            height: 3,
            borderRadius: 3,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: progressPct,
              background: "linear-gradient(90deg, #c04068, #ff80a8)",
              borderRadius: 3,
              transition: "width 0.5s linear",
              boxShadow: "0 0 8px rgba(214,80,118,0.6)",
            }}
          />
        </div>

        <span
          style={{
            fontSize: "clamp(10px, 2.5vw, 12px)",
            color: "#444",
            minWidth: 32,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
