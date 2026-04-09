"use client";

import { Track } from "@/lib/tracks";

type Props = {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  playCounts: Record<number, number>;
  onSelect: (idx: number) => void;
};

export default function RetroPlaylist({
  tracks, currentIndex, isPlaying, playCounts, onSelect,
}: Props) {
  return (
    <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
      {tracks.map((t, idx) => {
        const isCurrent = idx === currentIndex;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(idx)}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors"
            style={{
              background: isCurrent ? "#FFF8F0" : "transparent",
              borderLeft: isCurrent ? "3px solid #C8860A" : "3px solid transparent",
              borderBottom: "1px solid #F0E8DC",
            }}
          >
            {/* 番号 */}
            <span
              className="tabular-nums flex-shrink-0 text-right"
              style={{
                fontSize: 11,
                width: 20,
                color: isCurrent ? "#C8860A" : "#B09070",
                fontFamily: "'Shippori Mincho', serif",
              }}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>

            {/* イコライザー / ドット */}
            <div className="flex-shrink-0 flex items-end gap-0.5" style={{ width: 18, height: 18 }}>
              {isCurrent && isPlaying ? (
                <>
                  <div className="eq-bar1 rounded-sm" style={{ width: 3.5, background: "#C8860A", borderRadius: 1 }} />
                  <div className="eq-bar2 rounded-sm" style={{ width: 3.5, background: "#D4961A", borderRadius: 1 }} />
                  <div className="eq-bar3 rounded-sm" style={{ width: 3.5, background: "#C8860A", borderRadius: 1 }} />
                </>
              ) : (
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: isCurrent ? "#C8860A" : t.color,
                  opacity: isCurrent ? 1 : 0.7,
                  marginBottom: 1,
                }} />
              )}
            </div>

            {/* 曲情報 */}
            <div className="flex-1 min-w-0">
              <p
                className="truncate font-500 text-sm"
                style={{
                  color: isCurrent ? "#2A1208" : "#3D2010",
                  fontFamily: isCurrent ? "'Shippori Mincho', serif" : "inherit",
                  letterSpacing: isCurrent ? "0.02em" : "normal",
                }}
              >
                {t.title}
              </p>
              <p className="text-xs truncate" style={{ color: "#9B7A58", fontSize: 10 }}>
                {t.genre}
              </p>
            </div>

          </button>
        );
      })}
    </div>
  );
}
