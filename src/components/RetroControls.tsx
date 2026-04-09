"use client";

import { RepeatMode } from "@/hooks/useAudioEngine";
import {
  IconPlay, IconPause, IconNext, IconPrev,
  IconShuffle, IconRepeat, IconRepeatOne,
  IconVolume, IconMute,
} from "./FlatIcons";

type Props = {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  progress: number;
  volume: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (ratio: number) => void;
  onVolume: (v: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
};

function fmt(secs: number): string {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RetroControls({
  isPlaying, shuffle, repeat, progress, volume, duration,
  onPlay, onPause, onNext, onPrev, onSeek, onVolume,
  onToggleShuffle, onToggleRepeat,
}: Props) {
  const elapsed = progress * duration;
  const CREAM = "#F5E6C8";
  const GOLD = "#C8860A";
  const MUTED = "rgba(245,230,200,0.4)";

  return (
    <div className="flex flex-col gap-4">

      {/* シークバー */}
      <div>
        <div className="relative flex items-center" style={{ height: 20 }}>
          {/* トラック背景 */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
            style={{ height: 3, background: "rgba(255,255,255,0.1)" }} />
          {/* 進捗 */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              height: 3,
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${GOLD}, #E6A820)`,
              zIndex: 1,
            }} />
          <input
            type="range" min={0} max={1} step={0.001} value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full absolute inset-0 opacity-0 cursor-pointer"
            style={{ zIndex: 2 }}
          />
          {/* サム */}
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `calc(${progress * 100}% - 7px)`,
              width: 14, height: 14,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, #F0C84A, ${GOLD})`,
              boxShadow: `0 1px 4px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(200,134,10,0.6)`,
              zIndex: 3,
            }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-xs tabular-nums" style={{ color: MUTED, fontSize: 10 }}>{fmt(elapsed)}</span>
          <span className="text-xs tabular-nums" style={{ color: MUTED, fontSize: 10 }}>{fmt(duration)}</span>
        </div>
      </div>

      {/* 主要コントロール */}
      <div className="flex items-center justify-center gap-3">
        {/* シャッフル */}
        <button onClick={onToggleShuffle} className="transition-all hover:scale-110 active:scale-95">
          <IconShuffle size={20} color={shuffle ? "#5DB89A" : CREAM} active={shuffle} />
        </button>

        {/* 前の曲 */}
        <button
          onClick={onPrev}
          className="flex items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95"
          style={{
            width: 40, height: 40,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <IconPrev size={16} color={CREAM} />
        </button>

        {/* 再生/停止 */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="flex items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95"
          style={{
            width: 60, height: 60,
            background: `radial-gradient(circle at 38% 35%, #F0C84A, ${GOLD} 55%, #8B5E00)`,
            boxShadow: `0 4px 16px rgba(200,134,10,0.5), inset 0 1px 0 rgba(255,255,255,0.3)`,
            border: "1.5px solid rgba(200,134,10,0.7)",
          }}
        >
          {isPlaying
            ? <IconPause size={22} color="#1C0E06" />
            : <div style={{ marginLeft: 3 }}><IconPlay size={22} color="#1C0E06" /></div>
          }
        </button>

        {/* 次の曲 */}
        <button
          onClick={onNext}
          className="flex items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95"
          style={{
            width: 40, height: 40,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <IconNext size={16} color={CREAM} />
        </button>

        {/* リピート */}
        <button onClick={onToggleRepeat} className="transition-all hover:scale-110 active:scale-95">
          {repeat === "one"
            ? <IconRepeatOne size={20} color="#5DB89A" />
            : <IconRepeat size={20} color={repeat === "all" ? "#5DB89A" : CREAM} active={repeat === "all"} />
          }
        </button>
      </div>

      {/* ボリューム */}
      <div className="flex items-center gap-2 justify-center">
        <button onClick={() => onVolume(volume > 0 ? 0 : 0.7)} className="flex-shrink-0">
          {volume === 0
            ? <IconMute size={16} color={MUTED} />
            : <IconVolume size={16} color={MUTED} />
          }
        </button>
        <div className="relative flex items-center flex-1" style={{ maxWidth: 100 }}>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
            style={{ height: 2, background: "rgba(255,255,255,0.08)" }} />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{ height: 2, width: `${volume * 100}%`, background: "rgba(200,134,10,0.5)" }} />
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            className="w-full absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
