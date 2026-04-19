"use client";

import { Heart } from "lucide-react";

const BRAND = "#D65076";
const FONT = "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif";

type RankEntry = { likes: number; plays: number; score: number };

type Props = {
  rankingData: Record<number, RankEntry>;
};

export default function TotalLikes({ rankingData }: Props) {
  const total = Object.values(rankingData).reduce(
    (sum, entry) => sum + (entry?.likes ?? 0),
    0
  );

  // データ未取得 or 0件は非表示
  if (total < 1) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 py-2 px-4"
      style={{
        background: "linear-gradient(90deg, rgba(214,80,118,0.06), rgba(214,80,118,0.12), rgba(214,80,118,0.06))",
        borderBottom: "1px solid rgba(214,80,118,0.18)",
      }}
    >
      <Heart
        size={14}
        fill={BRAND}
        color={BRAND}
        strokeWidth={2}
        style={{ animation: "total-likes-pulse 2.4s ease-in-out infinite", flexShrink: 0 }}
      />
      <p
        style={{
          color: "#8B6A4A",
          fontSize: 11,
          letterSpacing: "0.08em",
          fontFamily: FONT,
          margin: 0,
        }}
      >
        累計いいね数{" "}
        <strong
          className="tabular-nums"
          style={{ color: BRAND, fontSize: 13 }}
        >
          {total.toLocaleString()}
        </strong>
      </p>
      <style>{`
        @keyframes total-likes-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.18); }
        }
      `}</style>
    </div>
  );
}
