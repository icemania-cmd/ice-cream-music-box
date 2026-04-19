"use client";

import { Heart, Play } from "lucide-react";

const BRAND = "#D65076";
const PLAY_COLOR = "#C8860A";
const FONT = "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif";

type RankEntry = { likes: number; plays: number; score: number };

type Props = {
  rankingData: Record<number, RankEntry>;
};

export default function TotalLikes({ rankingData }: Props) {
  const totals = Object.values(rankingData).reduce(
    (acc, entry) => ({
      likes: acc.likes + (entry?.likes ?? 0),
      plays: acc.plays + (entry?.plays ?? 0),
    }),
    { likes: 0, plays: 0 }
  );

  // データ未取得 or どちらも0は非表示
  if (totals.likes < 1 && totals.plays < 1) return null;

  return (
    <div
      className="flex items-center justify-center gap-4 py-2 px-4 flex-wrap"
      style={{
        background: "linear-gradient(90deg, rgba(214,80,118,0.05), rgba(214,80,118,0.10), rgba(214,80,118,0.05))",
        borderBottom: "1px solid rgba(214,80,118,0.16)",
      }}
    >
      {/* 累計いいね */}
      <div className="flex items-center gap-1.5">
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
            letterSpacing: "0.06em",
            fontFamily: FONT,
            margin: 0,
          }}
        >
          累計いいね{" "}
          <strong
            className="tabular-nums"
            style={{ color: BRAND, fontSize: 13 }}
          >
            {totals.likes.toLocaleString()}
          </strong>
        </p>
      </div>

      {/* 累計再生 */}
      <div className="flex items-center gap-1.5">
        <Play
          size={12}
          fill={PLAY_COLOR}
          color={PLAY_COLOR}
          strokeWidth={2}
          style={{ flexShrink: 0 }}
        />
        <p
          style={{
            color: "#8B6A4A",
            fontSize: 11,
            letterSpacing: "0.06em",
            fontFamily: FONT,
            margin: 0,
          }}
        >
          累計再生{" "}
          <strong
            className="tabular-nums"
            style={{ color: PLAY_COLOR, fontSize: 13 }}
          >
            {totals.plays.toLocaleString()}
          </strong>
        </p>
      </div>

      <style>{`
        @keyframes total-likes-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.18); }
        }
      `}</style>
    </div>
  );
}
