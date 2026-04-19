"use client";

import { Heart, Play } from "lucide-react";
import { Track } from "@/lib/tracks";

const FONT = "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif";
const BRAND = "#D65076";

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

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="playlist-scroll">
      {ranked.map((t, rank) => {
        const entry = rankingData[t.id] ?? { likes: 0, plays: 0, score: 0 };
        const isActive = t.id === currentTrackId;
        const liked = likedByMe.has(t.id);
        const trackIdx = allTracks.findIndex((tr) => tr.id === t.id);

        return (
          <button
            key={t.id}
            onClick={() => onSelect(trackIdx)}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors"
            style={{
              background: isActive ? "#FFF8F0" : "transparent",
              borderLeft: isActive ? "3px solid #C8860A" : "3px solid transparent",
              borderBottom: "1px solid #F0E8DC",
            }}
          >
            {/* 順位 */}
            <div className="flex-shrink-0 text-center" style={{ width: 24 }}>
              {rank < 3 ? (
                <span style={{ fontSize: 16, lineHeight: 1 }}>{medals[rank]}</span>
              ) : (
                <span style={{
                  fontSize: 12,
                  color: isActive ? "#C8860A" : "#B09070",
                  fontFamily: FONT,
                }}>
                  {rank + 1}
                </span>
              )}
            </div>

            {/* カラードット */}
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isActive ? "#C8860A" : t.color,
              flexShrink: 0,
              boxShadow: isActive ? "0 0 5px #C8860A" : "none",
            }} />

            {/* 曲情報 */}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  color: isActive ? "#2A1208" : "#3D2010",
                  fontFamily: isActive ? FONT : "inherit",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 400,
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
          </button>
        );
      })}
    </div>
  );
}
