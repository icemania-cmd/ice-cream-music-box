"use client";

import { Trophy } from "lucide-react";
import { Track } from "@/lib/tracks";

type Props = {
  tracks: Track[];
  playCounts: Record<number, number>;
  currentTrackId: number;
  onSelect: (idx: number) => void;
  allTracks: Track[];
};

const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function Rankings({
  tracks,
  playCounts,
  currentTrackId,
  onSelect,
  allTracks,
}: Props) {
  const ranked = [...tracks].sort(
    (a, b) => (playCounts[b.id] ?? b.plays) - (playCounts[a.id] ?? a.plays)
  );
  const maxPlays = playCounts[ranked[0]?.id] ?? ranked[0]?.plays ?? 1;

  return (
    <div className="flex flex-col h-full">
      <h2
        className="text-sm font-700 mb-2 flex items-center gap-1.5"
        style={{ color: "#5C3A2E", opacity: 0.7 }}
      >
        <Trophy size={14} strokeWidth={1.5} />
        人気ランキング
      </h2>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight: 380 }}>
        {ranked.map((t, rank) => {
          const plays = playCounts[t.id] ?? t.plays;
          const barWidth = (plays / maxPlays) * 100;
          const isActive = t.id === currentTrackId;
          const medalColor = rankColors[rank] ?? null;
          const trackIdx = allTracks.findIndex((tr) => tr.id === t.id);

          return (
            <button
              key={t.id}
              onClick={() => onSelect(trackIdx)}
              className="w-full text-left rounded-xl px-3 py-2 transition-all hover:scale-[1.01]"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, #D65076 0%, #b83d60 100%)"
                  : "rgba(255,255,255,0.7)",
                boxShadow: isActive ? "0 2px 8px rgba(214,80,118,0.3)" : "none",
                border: isActive ? "none" : "1px solid rgba(92,58,46,0.08)",
              }}
            >
              <div className="flex items-center gap-2.5">
                {/* Rank badge */}
                <div
                  className="flex-shrink-0 flex items-center justify-center text-xs font-800 rounded-full"
                  style={{
                    width: 24,
                    height: 24,
                    background: medalColor
                      ? medalColor
                      : isActive
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(92,58,46,0.08)",
                    color: medalColor ? "#5C3A2E" : isActive ? "white" : "rgba(92,58,46,0.45)",
                    fontSize: 11,
                  }}
                >
                  {rank + 1}
                </div>

                {/* Color dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isActive ? "rgba(255,255,255,0.8)" : t.color,
                    flexShrink: 0,
                  }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-500 truncate"
                    style={{ color: isActive ? "white" : "#5C3A2E" }}
                  >
                    {t.title}
                  </p>
                  {/* Progress bar */}
                  <div
                    className="mt-1 rounded-full overflow-hidden"
                    style={{
                      height: 3,
                      background: isActive ? "rgba(255,255,255,0.2)" : "rgba(92,58,46,0.1)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barWidth}%`,
                        background: isActive ? "rgba(255,255,255,0.7)" : t.color,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Play count */}
                <span
                  className="text-xs tabular-nums flex-shrink-0"
                  style={{
                    color: isActive ? "rgba(255,255,255,0.85)" : "rgba(92,58,46,0.5)",
                  }}
                >
                  {plays.toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
