"use client";

import { Track } from "@/lib/tracks";
import VinylRecord from "./VinylRecord";
import { RepeatMode } from "@/hooks/useAudioEngine";
import {
  IconPlay, IconPause, IconNext, IconPrev, IconClose,
} from "./FlatIcons";
import ShareButtons from "./ShareButtons";

type Props = {
  track: Track;
  isPlaying: boolean;
  progress: number;
  duration: number;
  repeat: RepeatMode;
  shuffle: boolean;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  onClose: () => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (ratio: number) => void;
};

function fmt(secs: number): string {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function NowPlayingModal({
  track, isPlaying, progress, duration,
  onClose, onPlay, onPause, onNext, onPrev, onSeek,
}: Props) {
  const elapsed = progress * duration;
  const CREAM = "#F5E6C8";
  const GOLD = "#C8860A";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center now-playing-enter"
      style={{ background: "linear-gradient(180deg, #0A0503 0%, #160A04 50%, #0A0503 100%)" }}
    >
      {/* 木目ライン */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(87deg, transparent 0px, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 6px)",
      }} />

      {/* 上部: タイトル + 閉じるボタン */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <p style={{
          color: GOLD, fontSize: 11, letterSpacing: "0.3em",
          fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
        }}>
          NOW PLAYING
        </p>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full transition-all hover:brightness-125 active:scale-95"
          style={{
            width: 36, height: 36,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <IconClose size={14} color={CREAM} />
        </button>
      </div>

      {/* ゴールドライン */}
      <div className="absolute top-14 left-8 right-8" style={{ height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}55, transparent)` }} />

      {/* レコード */}
      <div className="relative mb-8" style={{ marginTop: 20 }}>
        {/* ターンテーブル台（シルバー） */}
        <div style={{
          position: "absolute",
          inset: -28,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #ECECEC 0%, #C8C8C8 40%, #A8A8A8 70%, #B8B8B8 100%)",
          border: "2px solid #D0D0D0",
          boxShadow: "0 12px 40px rgba(0,0,0,0.8), inset 0 2px 6px rgba(255,255,255,0.6), inset 0 -2px 6px rgba(0,0,0,0.3)",
        }} />
        <VinylRecord track={track} isPlaying={isPlaying} size={260} onClick={() => {}} />
      </div>

      {/* 曲情報 */}
      <div className="text-center px-8 mb-6 max-w-md w-full">
        <h2 style={{
          color: CREAM, fontSize: 22, fontWeight: 700,
          fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
          letterSpacing: "0.04em",
          lineHeight: 1.3,
          marginBottom: 4,
        }}>
          {track.title}
        </h2>
        <p style={{ color: "rgba(245,230,200,0.55)", fontSize: 13, letterSpacing: "0.12em" }}>
          {track.artist}
        </p>
        <span style={{
          display: "inline-block", marginTop: 8, fontSize: 10, padding: "3px 10px",
          background: "rgba(200,134,10,0.12)", border: "1px solid rgba(200,134,10,0.3)",
          color: GOLD, letterSpacing: "0.12em",
        }}>
          {track.genre}
        </span>
      </div>

      {/* シークバー */}
      <div className="w-full max-w-sm px-8 mb-5">
        <div className="relative flex items-center" style={{ height: 20 }}>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
            style={{ height: 3, background: "rgba(255,255,255,0.08)" }} />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{ height: 3, width: `${progress * 100}%`, background: `linear-gradient(90deg, ${GOLD}, #E6A820)`, zIndex: 1 }} />
          <input type="range" min={0} max={1} step={0.001} value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full absolute inset-0 opacity-0 cursor-pointer" style={{ zIndex: 2 }} />
          <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `calc(${progress * 100}% - 8px)`,
              width: 16, height: 16, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, #F0C84A, ${GOLD})`,
              boxShadow: "0 1px 6px rgba(0,0,0,0.5)",
              zIndex: 3,
            }} />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 11, color: "rgba(245,230,200,0.4)", fontVariantNumeric: "tabular-nums" as const }}>{fmt(elapsed)}</span>
          <span style={{ fontSize: 11, color: "rgba(245,230,200,0.4)", fontVariantNumeric: "tabular-nums" as const }}>{fmt(duration)}</span>
        </div>
      </div>

      {/* コントロール */}
      <div className="flex items-center gap-5">
        <button onClick={onPrev}
          className="flex items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95"
          style={{ width: 44, height: 44, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <IconPrev size={18} color={CREAM} />
        </button>

        <button onClick={isPlaying ? onPause : onPlay}
          className="flex items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95"
          style={{
            width: 68, height: 68,
            background: `radial-gradient(circle at 38% 35%, #F0C84A, ${GOLD} 55%, #8B5E00)`,
            boxShadow: `0 4px 20px rgba(200,134,10,0.5), inset 0 1px 0 rgba(255,255,255,0.3)`,
            border: "1.5px solid rgba(200,134,10,0.7)",
          }}>
          {isPlaying
            ? <IconPause size={26} color="#1C0E06" />
            : <div style={{ marginLeft: 3 }}><IconPlay size={26} color="#1C0E06" /></div>
          }
        </button>

        <button onClick={onNext}
          className="flex items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95"
          style={{ width: 44, height: 44, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <IconNext size={18} color={CREAM} />
        </button>
      </div>

      {/* シェアボタン */}
      <div className="w-full max-w-xs px-6 mt-6">
        <ShareButtons track={track} />
      </div>

      {/* 下部デコレーション */}
      <div className="flex items-center gap-3 mt-4">
        <div style={{ width: 36, height: 1, background: `${GOLD}44` }} />
        <span style={{ fontSize: 18 }}>🍦</span>
        <div style={{ width: 36, height: 1, background: `${GOLD}44` }} />
      </div>
    </div>
  );
}
