"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { RepeatMode } from "@/hooks/useAudioEngine";

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

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerControls({
  isPlaying,
  shuffle,
  repeat,
  progress,
  volume,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onSeek,
  onVolume,
  onToggleShuffle,
  onToggleRepeat,
}: Props) {
  const elapsed = progress * duration;
  const pink = "#D65076";
  const mint = "#5DB89A";
  const choco = "#5C3A2E";
  const active = "opacity-100";
  const inactive = "opacity-30";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Seek bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs tabular-nums" style={{ color: choco, opacity: 0.6, minWidth: 36 }}>
          {formatTime(elapsed)}
        </span>
        <div className="relative flex-1 flex items-center">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none"
            style={{
              width: `${progress * 100}%`,
              background: pink,
              zIndex: 1,
            }}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full relative"
            style={{ zIndex: 2, background: "transparent" }}
          />
        </div>
        <span className="text-xs tabular-nums" style={{ color: choco, opacity: 0.6, minWidth: 36, textAlign: "right" }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className={`transition-all ${shuffle ? active : inactive} hover:opacity-80`}
          title="シャッフル"
        >
          <Shuffle size={20} strokeWidth={1.5} color={shuffle ? mint : choco} />
        </button>

        {/* Prev */}
        <button
          onClick={onPrev}
          className="hover:scale-110 transition-transform"
          title="前の曲"
        >
          <SkipBack size={28} strokeWidth={1.5} color={choco} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="flex items-center justify-center rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95"
          style={{
            width: 64,
            height: 64,
            background: `linear-gradient(135deg, ${pink} 0%, #b83d60 100%)`,
            boxShadow: `0 4px 16px ${pink}66`,
          }}
          title={isPlaying ? "一時停止" : "再生"}
        >
          {isPlaying ? (
            <Pause size={28} strokeWidth={1.5} fill="white" color="white" />
          ) : (
            <Play size={28} strokeWidth={1.5} fill="white" color="white" style={{ marginLeft: 3 }} />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="hover:scale-110 transition-transform"
          title="次の曲"
        >
          <SkipForward size={28} strokeWidth={1.5} color={choco} />
        </button>

        {/* Repeat */}
        <button
          onClick={onToggleRepeat}
          className={`transition-all ${repeat !== "none" ? active : inactive} hover:opacity-80`}
          title="リピート"
        >
          {repeat === "one" ? (
            <Repeat1 size={20} strokeWidth={1.5} color={mint} />
          ) : (
            <Repeat size={20} strokeWidth={1.5} color={repeat === "all" ? mint : choco} />
          )}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 justify-center">
        <button onClick={() => onVolume(volume > 0 ? 0 : 0.7)}>
          {volume === 0 ? (
            <VolumeX size={16} strokeWidth={1.5} color={choco} style={{ opacity: 0.5 }} />
          ) : (
            <Volume2 size={16} strokeWidth={1.5} color={choco} style={{ opacity: 0.6 }} />
          )}
        </button>
        <div className="relative flex items-center" style={{ width: 100 }}>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none"
            style={{ width: `${volume * 100}%`, background: "#c8a090" }}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            style={{ width: 100, background: "transparent" }}
          />
        </div>
      </div>
    </div>
  );
}
