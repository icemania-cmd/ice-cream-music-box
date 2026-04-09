"use client";

import { Music } from "lucide-react";
import { Track } from "@/lib/tracks";

type Props = {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  playCounts: Record<number, number>;
  onSelect: (idx: number) => void;
};

export default function Playlist({
  tracks,
  currentIndex,
  isPlaying,
  playCounts,
  onSelect,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <h2
        className="text-sm font-700 mb-2 flex items-center gap-1.5"
        style={{ color: "#5C3A2E", opacity: 0.7 }}
      >
        <Music size={14} strokeWidth={1.5} />
        プレイリスト
      </h2>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1" style={{ maxHeight: 380 }}>
        {tracks.map((t, idx) => {
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(idx)}
              className="w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all hover:scale-[1.01]"
              style={{
                background: isCurrent
                  ? `linear-gradient(135deg, #D65076 0%, #b83d60 100%)`
                  : "rgba(255,255,255,0.7)",
                boxShadow: isCurrent ? "0 2px 8px rgba(214,80,118,0.3)" : "none",
                border: isCurrent ? "none" : "1px solid rgba(92,58,46,0.08)",
              }}
            >
              {/* Color dot / playing indicator */}
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isCurrent ? "rgba(255,255,255,0.25)" : t.color + "33",
                }}
              >
                {isCurrent && isPlaying ? (
                  <div className="flex gap-0.5 items-end" style={{ height: 14 }}>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="playing-dot"
                        style={{
                          width: 3,
                          background: "white",
                          borderRadius: 2,
                          height: i === 2 ? 14 : i === 1 ? 10 : 12,
                          animationDelay: `${(i - 1) * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: isCurrent ? "white" : t.color,
                    }}
                  />
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-500 truncate"
                  style={{ color: isCurrent ? "white" : "#5C3A2E" }}
                >
                  {t.title}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: isCurrent ? "rgba(255,255,255,0.75)" : "rgba(92,58,46,0.55)" }}
                >
                  {t.artist} · {t.genre}
                </p>
              </div>

              {/* Plays */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span
                  className="text-xs tabular-nums"
                  style={{ color: isCurrent ? "rgba(255,255,255,0.65)" : "rgba(92,58,46,0.35)", fontSize: 10 }}
                >
                  {(playCounts[t.id] ?? t.plays).toLocaleString()}回
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
