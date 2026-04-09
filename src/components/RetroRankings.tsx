"use client";

import { Track } from "@/lib/tracks";

type Props = {
  tracks: Track[];
  playCounts: Record<number, number>;
  currentTrackId: number;
  onSelect: (idx: number) => void;
  allTracks: Track[];
};

export default function RetroRankings({
  tracks, playCounts, currentTrackId, onSelect, allTracks,
}: Props) {
  const ranked = [...tracks].sort(
    (a, b) => (playCounts[b.id] ?? b.plays) - (playCounts[a.id] ?? a.plays)
  );
  const maxPlays = playCounts[ranked[0]?.id] ?? ranked[0]?.plays ?? 1;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
      {ranked.map((t, rank) => {
        const plays = playCounts[t.id] ?? t.plays;
        const barWidth = (plays / maxPlays) * 100;
        const isActive = t.id === currentTrackId;
        const trackIdx = allTracks.findIndex((tr) => tr.id === t.id);

        return (
          <button
            key={t.id}
            onClick={() => onSelect(trackIdx)}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors"
            style={{
              background: isActive ? "#FFF8F0" : "transparent",
              borderLeft: isActive ? "3px solid #C8860A" : "3px solid transparent",
              borderBottom: "1px solid #F0E8DC",
            }}
          >
            {/* 順位 */}
            <div className="flex-shrink-0 text-center" style={{ width: 28 }}>
              {rank < 3 ? (
                <span style={{ fontSize: 18, lineHeight: 1 }}>{medals[rank]}</span>
              ) : (
                <span style={{
                  fontSize: 12,
                  color: isActive ? "#C8860A" : "#B09070",
                  fontFamily: "'Shippori Mincho', serif",
                }}>
                  {rank + 1}
                </span>
              )}
            </div>

            {/* カラードット */}
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: isActive ? "#C8860A" : t.color,
              flexShrink: 0,
              boxShadow: isActive ? "0 0 5px #C8860A" : "none",
            }} />

            {/* 曲情報 + バー */}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  color: isActive ? "#2A1208" : "#3D2010",
                  fontFamily: isActive ? "'Shippori Mincho', serif" : "inherit",
                  fontSize: 14, fontWeight: isActive ? 700 : 400,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {t.title}
              </p>
              {/* バー */}
              <div className="mt-1 rounded-sm overflow-hidden" style={{ height: 2, background: "#EDE0D0" }}>
                <div style={{
                  height: "100%",
                  width: `${barWidth}%`,
                  background: isActive
                    ? "linear-gradient(90deg, #C8860A, #E6A820)"
                    : t.color,
                  transition: "width 0.6s ease",
                  opacity: 0.8,
                }} />
              </div>
            </div>

          </button>
        );
      })}
    </div>
  );
}
