"use client";

import { Heart, Play, Crown, Medal, Award } from "lucide-react";
import { Track } from "@/lib/tracks";

const FONT = "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif";
const BRAND = "#D65076";

/** 順位に応じたメダルアイコン */
function RankBadge({ rank }: { rank: number }) {
  const configs = [
    { Icon: Crown, bg: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#7A5200", shadow: "0 2px 8px rgba(255,215,0,0.5)", border: "#FFD700" },
    { Icon: Medal, bg: "linear-gradient(135deg, #E8E8E8, #B0B0B0)", color: "#555", shadow: "0 2px 8px rgba(180,180,180,0.4)", border: "#C0C0C0" },
    { Icon: Award, bg: "linear-gradient(135deg, #F0A050, #CD7F32)", color: "#5C3A10", shadow: "0 2px 8px rgba(205,127,50,0.4)", border: "#CD7F32" },
  ];
  if (rank >= 3) return null;
  const { Icon, bg, color, shadow, border } = configs[rank];
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%",
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: shadow,
      border: `1.5px solid ${border}`,
    }}>
      <Icon size={14} color={color} strokeWidth={2.2} />
    </div>
  );
}

type RankEntry = { likes: number; plays: number; score: number };

type Props = {
  tracks: Track[];
  playCounts: Record<number, number>;
  currentTrackId: number;
  onSelect: (idx: number) => void;
  allTracks: Track[];
  rankingData: Record<number, RankEntry>;
  likedByMe: Set<number>;
};

export default function RetroRankings({
  tracks, currentTrackId, onSelect, allTracks,
  rankingData, likedByMe,
}: Props) {
  const ranked = [...tracks].sort(
    (a, b) => (rankingData[b.id]?.score ?? 0) - (rankingData[a.id]?.score ?? 0)
  );

  return (
    <div className="playlist-scroll">
      {ranked.map((t, rank) => {
        const entry = rankingData[t.id] ?? { likes: 0, plays: 0, score: 0 };
        const isActive = t.id === currentTrackId;
        const liked = likedByMe.has(t.id);
        const trackIdx = allTracks.findIndex((tr) => tr.id === t.id);
        const isTop3 = rank < 3;

        return (
          <button
            key={t.id}
            onClick={() => onSelect(trackIdx)}
            className={`w-full text-left flex items-center gap-3 px-3 transition-colors${isTop3 ? " ranking-top3" : ""}`}
            style={{
              padding: isTop3 ? "10px 12px" : "8px 12px",
              background: isActive
                ? "linear-gradient(90deg, rgba(214,80,118,0.08), rgba(255,248,240,0.9))"
                : isTop3
                  ? "linear-gradient(90deg, rgba(255,215,0,0.04), transparent)"
                  : "transparent",
              borderLeft: isActive ? `3px solid ${BRAND}` : isTop3 ? "3px solid rgba(255,215,0,0.3)" : "3px solid transparent",
              borderBottom: "1px solid #F0E8DC",
            }}
          >
            {/* 順位 */}
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 28 }}>
              {isTop3 ? (
                <RankBadge rank={rank} />
              ) : (
                <span style={{
                  fontSize: 12,
                  color: isActive ? BRAND : "#B09070",
                  fontFamily: FONT,
                  fontWeight: 600,
                }}>
                  {rank + 1}
                </span>
              )}
            </div>

            {/* カラードット */}
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isActive ? BRAND : t.color,
              flexShrink: 0,
              boxShadow: isActive ? `0 0 6px ${BRAND}` : "none",
            }} />

            {/* 曲情報 */}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  color: isActive ? "#2A1208" : isTop3 ? "#2A1208" : "#3D2010",
                  fontFamily: FONT,
                  fontSize: isTop3 ? 13.5 : 13,
                  fontWeight: isActive ? 700 : isTop3 ? 600 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.title}
              </p>

              {/* いいね数 + 再生数 */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-0.5 tabular-nums" style={{ fontSize: 11, color: liked ? BRAND : "#B09070", fontFamily: FONT }}>
                  <Heart size={10} fill={liked ? BRAND : "none"} color={liked ? BRAND : "#B09070"} strokeWidth={2} />
                  {entry.likes}
                </span>
                <span className="flex items-center gap-0.5 tabular-nums" style={{ fontSize: 11, color: "#B09070", fontFamily: FONT }}>
                  <Play size={9} fill="#B09070" color="#B09070" />
                  {entry.plays}
                </span>
              </div>
            </div>

            {/* スコアバー（Top3のみ） */}
            {isTop3 && entry.score > 0 && (
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: BRAND, fontFamily: FONT,
                padding: "2px 8px",
                background: "rgba(214,80,118,0.08)",
                borderRadius: 10,
                border: "1px solid rgba(214,80,118,0.2)",
                whiteSpace: "nowrap",
              }}>
                {entry.score}pt
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
