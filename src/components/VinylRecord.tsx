"use client";

import { useEffect, useRef } from "react";
import { Track } from "@/lib/tracks";

type Props = {
  track: Track;
  isPlaying: boolean;
  size?: number;
  onClick?: () => void;
};

export default function VinylRecord({ track, isPlaying, size = 240, onClick }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  // JS-driven rotation（CSS animationに依存しない確実な方法）
  const divRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (!isPlayingRef.current) return;
      // 33rpm相当: 60fps で 0.2°/frame ≒ 12°/s ≒ 1回転/30s ... は遅すぎ
      // 視覚的に分かりやすく: 1.8秒/回転 = 200°/s = 3.3°/frame @60fps
      angleRef.current = (angleRef.current + 3.3) % 360;
      if (divRef.current) {
        divRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const grooves: number[] = [];
  for (let i = 0; i < 20; i++) {
    grooves.push(r * 0.39 + i * (r * 0.53 / 20));
  }

  return (
    // 外側ラッパー: 回転しない → シャドーが動かない
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        filter: `drop-shadow(0 10px 28px rgba(0,0,0,0.75))`,
      }}
    >
    {/* 内側ラッパー: 回転する → レコード本体のみ回転 */}
    <div
      ref={divRef}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        cursor: onClick ? "pointer" : "default",
        willChange: "transform",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id={`vinylGrad-${track.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A1A1A" />
            <stop offset="60%" stopColor="#0D0D0D" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          <radialGradient id={`sheen-${track.id}`} cx="30%" cy="25%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id={`labelGrad-${track.id}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </radialGradient>
        </defs>

        {/* 盤面 */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#vinylGrad-${track.id})`} />

        {/* グルーヴ溝 */}
        {grooves.map((gr, i) => (
          <circle key={i} cx={cx} cy={cy} r={gr} fill="none"
            stroke={i % 4 === 0 ? "#1E1E1E" : "#131313"} strokeWidth="0.5" />
        ))}

        {/* 光沢 */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#sheen-${track.id})`} />

        {/* ラベル */}
        <circle cx={cx} cy={cy} r={r * 0.355} fill={track.color} />
        <circle cx={cx} cy={cy} r={r * 0.355} fill={`url(#labelGrad-${track.id})`} />
        <circle cx={cx} cy={cy} r={r * 0.355} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r * 0.31} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
        <circle cx={cx} cy={cy} r={r * 0.24} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.4" />

        {/* AIPAKU */}
        <text x={cx} y={cy - r * 0.13}
          textAnchor="middle" fill="rgba(255,255,255,0.92)"
          fontSize={r * 0.09} fontFamily="Georgia, serif"
          fontWeight="bold" letterSpacing="3">
          AIPAKU
        </text>

        {/* 曲名 */}
        <text x={cx} y={cy + r * 0.01}
          textAnchor="middle" fill="rgba(255,255,255,0.78)"
          fontSize={r * 0.062} fontFamily="sans-serif">
          {track.title.length > 13 ? track.title.slice(0, 12) + "…" : track.title}
        </text>

        {/* A面 */}
        <text x={cx} y={cy + r * 0.135}
          textAnchor="middle" fill="rgba(255,255,255,0.55)"
          fontSize={r * 0.055} fontFamily="Georgia, serif">
          &#x2015; A面 &#x2015;
        </text>

        {/* 中心穴 */}
        <circle cx={cx} cy={cy} r={r * 0.038} fill="#0A0A0A" />
        <circle cx={cx} cy={cy} r={r * 0.038} fill="none"
          stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

        {/* 外縁 */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1C1C1C" strokeWidth="2" />
      </svg>
    </div>
    </div>
  );
}
