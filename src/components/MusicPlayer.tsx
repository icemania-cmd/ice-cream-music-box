"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Track } from "@/lib/tracks";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useMediaSession } from "@/hooks/useMediaSession";
import VinylRecord from "./VinylRecord";
import RetroPlaylist from "./RetroPlaylist";
import RetroRankings from "./RetroRankings";
import NowPlayingModal from "./NowPlayingModal";
import Visualizer from "./Visualizer";
import ShareButtons from "./ShareButtons";
import InstallBanner from "./InstallBanner";
import LiveListeners from "./LiveListeners";
import {
  IconPlay, IconPause, IconNext, IconPrev,
  IconShuffle, IconRepeat, IconRepeatOne,
  IconExpand, IconList, IconTrophy,
} from "./FlatIcons";
import { Volume1, Volume2, VolumeX, Zap, ChevronDown } from "lucide-react";

type Tab = "playlist" | "ranking";

/** "AI-SONG" を表示用に変換 */
const displayArtist = (a: string) => a === "AI-SONG" ? "ICECREAM SONG" : a;

/**
 * 長い曲名を横スクロール（マーキー）で表示するコンポーネント
 * 短い曲名はそのまま中央揃えで表示
 */
function MarqueeTitle({ title, style }: { title: string; style: React.CSSProperties }) {
  const isLong = title.length > 14;
  if (!isLong) {
    return <p style={{ ...style, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>;
  }
  // タイトルを2回繰り返してシームレスループ
  const repeated = `${title}\u3000\u3000\u3000\u3000${title}\u3000\u3000\u3000\u3000`;
  return (
    <div className="marquee-container" style={{ textAlign: "left" }}>
      <span className="marquee-text" style={style}>{repeated}</span>
    </div>
  );
}

// トーンアーム
function ToneArm({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div style={{
      position: "absolute", top: "4%", right: "2%",
      width: 64, height: 96, zIndex: 10,
      transformOrigin: "12px 10px",
      transform: isPlaying ? "rotate(20deg)" : "rotate(-38deg)",
      transition: "transform 1.1s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <svg width="64" height="96" viewBox="0 0 64 96">
        <rect x="54" y="2" width="8" height="14" rx="2" fill="#2A1208" stroke="#8B5E00" strokeWidth="0.8" />
        <rect x="55" y="3" width="6" height="3" rx="1" fill="#C8860A" opacity="0.6" />
        <circle cx="12" cy="10" r="9" fill="#2A1208" stroke="#6B3E00" strokeWidth="1" />
        <circle cx="12" cy="10" r="7" fill="#1A0A04" stroke="#C8860A" strokeWidth="1.2" />
        <circle cx="12" cy="10" r="4" fill="#120804" />
        <circle cx="12" cy="10" r="2" fill="#C8860A" />
        <path d="M 12 10 L 17 17 L 54 78" fill="none" stroke="#4A2808" strokeWidth="4" strokeLinecap="round" />
        <path d="M 12 10 L 17 17 L 54 78" fill="none" stroke="#8B5E00" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 13 9 L 18 16 L 55 77" fill="none" stroke="#D4A020" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <rect x="48" y="73" width="14" height="18" rx="2" fill="#1A0A04" stroke="#8B5E00" strokeWidth="1" />
        <rect x="50" y="74" width="10" height="4" rx="1" fill="#C8860A" opacity="0.5" />
        <line x1="55" y1="91" x2="55" y2="97" stroke={isPlaying ? "#FF6B9D" : "#D65076"} strokeWidth="2" strokeLinecap="round" />
        <circle cx="55" cy="97" r={isPlaying ? "2.5" : "1.5"} fill={isPlaying ? "#FF6B9D" : "#D65076"} opacity={isPlaying ? 0.9 : 0.5} />
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// VolumeControl: 折りたたみ式ボリュームコントロール（誤タッチ防止）
// デフォルト非表示。アイコン/数値タップで展開。
// ──────────────────────────────────────────────────────────────
function VolumeControl({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isMuted = volume === 0;
  const isBoost = volume > 1;
  const pct = volume / 2;

  const VolumeIcon = () => {
    if (isMuted) return <VolumeX size={18} color="#8B6A4A" strokeWidth={1.8} />;
    if (isBoost)  return <Zap size={18} color="#D65076" strokeWidth={1.8} />;
    if (volume > 0.5) return <Volume2 size={18} color="#B8800A" strokeWidth={1.8} />;
    return <Volume1 size={18} color="#B8800A" strokeWidth={1.8} />;
  };

  const thumbBg = isBoost
    ? "radial-gradient(circle at 38% 35%, #F09BB8, #D65076 55%, #A83560)"
    : "radial-gradient(circle at 38% 35%, #F0C84A, #B8800A 55%, #8B5E00)";
  const thumbShadow = isBoost
    ? "0 2px 14px rgba(214,80,118,0.55), inset 0 1px 0 rgba(255,255,255,0.35)"
    : "0 2px 14px rgba(184,128,10,0.5), inset 0 1px 0 rgba(255,255,255,0.35)";
  const thumbLeft = `calc(${pct * 100}% + ${14 - pct * 28}px)`;

  const presets = [
    { label: "MUTE", value: 0, active: isMuted, boost: false },
    { label: "100%", value: 1, active: Math.abs(volume - 1) < 0.02, boost: false },
    { label: "MAX", value: 2, active: Math.abs(volume - 2) < 0.02, boost: true },
  ];

  return (
    <div className="w-full flex flex-col" style={{ gap: 0 }}>
      {/* ヘッダー行（常に表示） */}
      <div className="flex items-center w-full" style={{ gap: 6 }}>
        {/* ミュートトグルボタン */}
        <button
          onClick={() => onChange(isMuted ? 0.7 : 0)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 4px", display: "flex", alignItems: "center", borderRadius: 6, flexShrink: 0 }}
          title={isMuted ? "ミュート解除" : "ミュート"}
        >
          <VolumeIcon />
        </button>

        <span style={{
          fontSize: 9, color: "#8B6A4A", letterSpacing: "0.2em",
          fontFamily: "var(--font-mplus), sans-serif", flexShrink: 0,
        }}>VOLUME</span>

        {/* 展開トグルボタン（数値＋シェブロン） */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center transition-all active:opacity-70"
          style={{
            background: "none", border: "none", cursor: "pointer",
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            padding: "6px 4px", borderRadius: 6,
          }}
          title={expanded ? "ボリューム設定を閉じる" : "ボリューム設定を開く"}
        >
          {isBoost && (
            <span style={{
              fontSize: 8, padding: "1px 6px", borderRadius: 3,
              background: "rgba(214,80,118,0.12)", border: "1px solid rgba(214,80,118,0.35)",
              color: "#D65076", letterSpacing: "0.1em",
              fontFamily: "var(--font-mplus), sans-serif",
            }}>BOOST</span>
          )}
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: isBoost ? "#D65076" : "#B8800A",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "var(--font-mplus), sans-serif",
            minWidth: 44, textAlign: "right",
          }}>
            {Math.round(volume * 100)}%
          </span>
          <ChevronDown
            size={14} color="#8B6A4A" strokeWidth={1.8}
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s ease" }}
          />
        </button>
      </div>

      {/* 展開エリア（タップで開閉） */}
      {expanded && (
        <div style={{ paddingTop: 6, paddingBottom: 4 }}>
          {/* スライダー本体 */}
          <div className="relative w-full" style={{ height: 48 }}>
            <div style={{
              position: "absolute", left: 14, right: 14,
              top: "50%", transform: "translateY(-50%)",
              height: 8, borderRadius: 4,
              background: "rgba(60,30,10,0.08)",
              border: "1px solid rgba(60,30,10,0.05)",
            }} />
            <div style={{
              position: "absolute", left: 14,
              top: "50%", transform: "translateY(-50%)",
              height: 8,
              width: `calc(${Math.min(volume, 1) * 50}% - ${Math.min(volume, 1) * 14}px)`,
              background: "linear-gradient(90deg, #C8860A, #E6A820)",
              borderRadius: "4px 0 0 4px",
              pointerEvents: "none", zIndex: 1,
              transition: "width 0.05s",
            }} />
            <div style={{
              position: "absolute",
              left: "calc(50% + 0px)",
              top: "50%", transform: "translateY(-50%)",
              height: 8,
              width: `calc(${Math.max(0, volume - 1) * 50}% - ${Math.max(0, volume - 1) * 14}px)`,
              background: "linear-gradient(90deg, #E6A820, #D65076)",
              pointerEvents: "none", zIndex: 1,
              transition: "width 0.05s",
            }} />
            <div style={{
              position: "absolute", left: "50%",
              top: "50%", transform: "translate(-50%, -50%)",
              width: 2, height: 20, borderRadius: 1,
              background: isBoost ? "rgba(214,80,118,0.6)" : "rgba(139,106,74,0.25)",
              zIndex: 2, transition: "background 0.3s",
            }} />
            <div style={{
              position: "absolute", left: "50%", bottom: 2,
              transform: "translateX(-50%)",
              fontSize: 8, color: "rgba(139,106,74,0.45)",
              letterSpacing: "0.04em",
              fontFamily: "var(--font-mplus), sans-serif",
              pointerEvents: "none",
            }}>100%</div>
            {/* range input: touch-action: pan-y で縦スクロールは通過、横ドラッグのみ音量操作 */}
            <input
              type="range" min={0} max={2} step={0.01} value={volume}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="volume-range-input"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                opacity: 0, cursor: "pointer", zIndex: 4, margin: 0,
                touchAction: "pan-y",
              }}
            />
            <div style={{
              position: "absolute",
              left: thumbLeft,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 28, height: 28, borderRadius: "50%",
              background: thumbBg,
              boxShadow: thumbShadow,
              border: "2.5px solid rgba(255,255,255,0.85)",
              pointerEvents: "none", zIndex: 3,
              transition: "background 0.3s, box-shadow 0.3s",
            }} />
          </div>

          {/* プリセットボタン */}
          <div className="flex gap-2 w-full" style={{ marginTop: 6 }}>
            {presets.map(({ label, value, active, boost }) => (
              <button
                key={label}
                onClick={() => onChange(value)}
                className="flex-1 transition-all active:scale-95"
                style={{
                  padding: "7px 4px",
                  borderRadius: 8,
                  background: active
                    ? (boost ? "rgba(214,80,118,0.14)" : "rgba(184,128,10,0.14)")
                    : "rgba(60,30,10,0.04)",
                  border: active
                    ? `1.5px solid ${boost ? "rgba(214,80,118,0.5)" : "rgba(184,128,10,0.45)"}`
                    : "1.5px solid rgba(139,106,74,0.15)",
                  color: active
                    ? (boost ? "#D65076" : "#B8800A")
                    : "#8B6A4A",
                  fontSize: 10, fontWeight: active ? 700 : 400,
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-mplus), sans-serif",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                }}
              >
                {boost && <Zap size={9} strokeWidth={2} />}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SeekBar: つまみドラッグのみでシーク（誤タッチ完全防止）
// トラック部分はタッチ無効。つまみを掴んでドラッグした時のみシーク。
// ──────────────────────────────────────────────────────────────
function SeekBar({
  progress, onSeek, elapsed, duration, onSeekRelative,
}: {
  progress: number;
  onSeek: (r: number) => void;
  elapsed: number;
  duration: number;
  onSeekRelative: (delta: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);

  // ドラッグ中以外は外部progressに追従
  useEffect(() => {
    if (!isDragging) setLocalProgress(progress);
  }, [progress, isDragging]);

  const dp = isDragging ? localProgress : progress;

  // トラック上のX座標からシーク比率を計算
  const calcRatio = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const pad = 10; // つまみ半径分のパディング
    return Math.max(0, Math.min(1, (clientX - rect.left - pad) / (rect.width - pad * 2)));
  };

  // つまみのPointerイベント（setPointerCaptureで範囲外ドラッグも追跡）
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    setLocalProgress(calcRatio(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    onSeek(calcRatio(e.clientX));
  };

  const onPointerCancel = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // つまみ左位置: dp=0 → left=0, dp=1 → left=100%-20px
  const thumbLeft = `calc(${dp * 100}% - ${dp * 20}px)`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* シークトラック */}
      <div ref={trackRef} style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        {/* トラック背景（タッチ無効） */}
        <div style={{
          position: "absolute", left: 10, right: 10,
          height: 2, borderRadius: 1,
          background: "rgba(60,30,10,0.12)",
          pointerEvents: "none",
        }} />
        {/* 進捗フィル（タッチ無効） */}
        <div style={{
          position: "absolute", left: 10,
          height: 2, borderRadius: 1,
          width: `calc(${dp * 100}% - ${dp * 20}px)`,
          background: "linear-gradient(90deg, #B8800A, #D4A020)",
          pointerEvents: "none",
        }} />
        {/* つまみ（唯一の操作エリア。touch-action: none でPointerイベントを確実に受信） */}
        <div
          style={{
            position: "absolute",
            left: thumbLeft,
            top: "50%",
            transform: `translateY(-50%) scale(${isDragging ? 1.25 : 1})`,
            width: 20, height: 20, borderRadius: "50%",
            background: isDragging
              ? "radial-gradient(circle at 35% 35%, #FFD66A, #D4A020)"
              : "radial-gradient(circle at 35% 35%, #F0C84A, #B8800A)",
            boxShadow: isDragging
              ? "0 0 0 7px rgba(184,128,10,0.14), 0 2px 8px rgba(100,60,10,0.45)"
              : "0 1px 6px rgba(100,60,10,0.35)",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            zIndex: 3,
            transition: isDragging ? "none" : "transform 0.15s, box-shadow 0.15s",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      </div>

      {/* 時間表示 + ±15秒ボタン */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: "#8B6A4A", fontVariantNumeric: "tabular-nums" as const, minWidth: 30 }}>
          {fmt(elapsed)}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeekRelative(-15)}
            title="-15秒"
            className="flex items-center gap-0.5 transition-all active:scale-90"
            style={{
              padding: "3px 8px", borderRadius: 4,
              background: "rgba(61,43,26,0.06)",
              border: "1px solid rgba(139,106,74,0.25)",
              color: "#8B6A4A", fontSize: 9, letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" style={{ marginRight: 1 }}>
              <path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="#8B6A4A"/>
            </svg>
            15
          </button>
          <button
            onClick={() => onSeekRelative(15)}
            title="+15秒"
            className="flex items-center gap-0.5 transition-all active:scale-90"
            style={{
              padding: "3px 8px", borderRadius: 4,
              background: "rgba(61,43,26,0.06)",
              border: "1px solid rgba(139,106,74,0.25)",
              color: "#8B6A4A", fontSize: 9, letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            15
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 1 }}>
              <path d="M12 5V2l4 4-4 4V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="#8B6A4A"/>
            </svg>
          </button>
        </div>
        <span style={{ fontSize: 10, color: "#8B6A4A", fontVariantNumeric: "tabular-nums" as const, minWidth: 30, textAlign: "right" }}>
          {fmt(duration)}
        </span>
      </div>
    </div>
  );
}

function fmt(sec: number) {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayer({ initialTracks }: { initialTracks: Track[] }) {
  const engine = useAudioEngine(initialTracks);
  const [tab, setTab] = useState<Tab>("playlist");
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [reloadMsg, setReloadMsg] = useState<string | null>(null);
  const playlistRef = useRef<HTMLDivElement>(null);

  const {
    track, tracks: trackList, currentIndex, isPlaying,
    progress, duration, volume, shuffle, repeat, playCounts, analyserRef,
    play, pause, seek, changeVolume, selectTrack,
    next, prev, toggleShuffle, toggleRepeat, reloadTracks,
  } = engine;

  const elapsed = progress * duration;

  // 秒単位でシーク（±15秒など）
  const seekRelative = useCallback((delta: number) => {
    if (!duration) return;
    const newTime = Math.max(0, Math.min(elapsed + delta, duration));
    seek(newTime / duration);
  }, [elapsed, duration, seek]);

  // ロック画面・通知バーに再生コントロールを表示
  useMediaSession({
    track, isPlaying, duration, progress,
    onPlay: play, onPause: pause, onNext: next, onPrev: prev, onSeek: seek,
  });

  const handleReload = useCallback(async () => {
    setReloading(true);
    setReloadMsg(null);
    try {
      const res = await fetch("/api/tracks");
      if (!res.ok) throw new Error("fetch failed");
      const newTracks: Track[] = await res.json();
      reloadTracks(newTracks);
      setReloadMsg(`${newTracks.length}曲 読み込み完了`);
    } catch {
      setReloadMsg("読み込みに失敗しました");
    } finally {
      setReloading(false);
      setTimeout(() => setReloadMsg(null), 3000);
    }
  }, [reloadTracks]);

  const scrollToPlaylist = () => {
    playlistRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // シルバーターンテーブル台
  const SILVER_BG = "linear-gradient(145deg, #D4D4D4 0%, #ECECEC 25%, #B8B8B8 50%, #E0E0E0 75%, #C8C8C8 100%)";
  const SILVER_BORDER = "1.5px solid #A0A0A0";
  const SILVER_SHADOW = "inset 0 2px 6px rgba(255,255,255,0.75), inset 0 -2px 4px rgba(0,0,0,0.18), 0 6px 24px rgba(0,0,0,0.2)";

  return (
    <>
      {showNowPlaying && (
        <NowPlayingModal
          track={track} isPlaying={isPlaying} progress={progress}
          duration={duration} repeat={repeat} shuffle={shuffle}
          analyserRef={analyserRef}
          onClose={() => setShowNowPlaying(false)}
          onPlay={play} onPause={pause} onNext={next} onPrev={prev} onSeek={seek}
        />
      )}

      {/* 全画面ラッパー */}
      <div style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #FFF9F0 0%, #FFF3E0 50%, #FFF0D8 100%)",
        display: "flex",
        flexDirection: "column",
      }}>
        <div className="w-full flex-1 flex flex-col" style={{ maxWidth: 1040, margin: "0 auto" }}>

          {/* ─── ヘッダー ─── */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{
              background: "linear-gradient(180deg, #4A2510 0%, #3D1E0A 100%)",
              borderBottom: "3px solid #B8800A",
            }}>
            <div className="flex items-center gap-2.5">
              <span style={{ fontSize: 20 }}>🍦</span>
              <div>
                <h1 style={{
                  color: "#E6A820", fontSize: 13, fontWeight: 700,
                  letterSpacing: "0.22em", fontFamily: "'Shippori Mincho', serif", lineHeight: 1.3,
                }}>ICE CREAM<br />MUSIC BOX</h1>
                <p style={{ color: "rgba(200,134,10,0.5)", fontSize: 9, letterSpacing: "0.18em" }}>
                  あいぱく BGMプレイヤー
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 楽曲一覧ジャンプボタン（SPのみ表示） */}
              <button
                onClick={scrollToPlaylist}
                className="md:hidden flex items-center gap-1 transition-all active:scale-95"
                style={{
                  padding: "6px 10px",
                  background: "rgba(184,128,10,0.12)",
                  border: "1px solid rgba(184,128,10,0.35)",
                  borderRadius: 4, color: "#E6A820", fontSize: 10, letterSpacing: "0.08em",
                  fontFamily: "'Shippori Mincho', serif",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="#E6A820" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                曲一覧
              </button>

              {/* 曲更新 */}
              <div className="relative">
                <button onClick={handleReload} disabled={reloading}
                  className="flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                  style={{
                    padding: "6px 10px",
                    background: "rgba(107,175,150,0.15)",
                    border: "1px solid rgba(107,175,150,0.4)",
                    borderRadius: 4, color: "#5A9E84", fontSize: 11,
                    letterSpacing: "0.1em", fontFamily: "'Shippori Mincho', serif",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M23 4v6h-6" stroke="#5A9E84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 20v-6h6" stroke="#5A9E84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="#5A9E84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">{reloading ? "読込中…" : "曲を更新"}</span>
                </button>
                {reloadMsg && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "#FFF9F0", border: "1px solid rgba(107,175,150,0.4)",
                    color: "#5A9E84", fontSize: 10, padding: "4px 10px",
                    borderRadius: 4, whiteSpace: "nowrap", zIndex: 100,
                    boxShadow: "0 2px 8px rgba(61,43,26,0.12)",
                  }}>
                    {reloadMsg}
                  </div>
                )}
              </div>

              {/* NOW PLAYING ボタン（再生中はグロウ） */}
              <button
                onClick={() => setShowNowPlaying(true)}
                className={`flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95${isPlaying ? " now-playing-glow" : ""}`}
                style={{
                  padding: "6px 12px",
                  background: "rgba(184,128,10,0.15)",
                  border: "1px solid rgba(184,128,10,0.4)",
                  borderRadius: 4, color: "#E6A820", fontSize: 11,
                  letterSpacing: "0.15em", fontFamily: "'Shippori Mincho', serif",
                }}
              >
                <IconExpand size={12} color="#E6A820" />
                <span className="hidden sm:inline">NOW PLAYING</span>
                <span className="sm:hidden">▶</span>
              </button>
            </div>
          </div>

          {/* ─── リアルタイムリスナー数 ─── */}
          <LiveListeners />

          {/* ─── 本体 2カラム ─── */}
          <div className="flex flex-col md:flex-row flex-1">

            {/* ═══ 左: ターンテーブル + コントロール ═══ */}
            <div className="flex flex-col items-center gap-4 p-5 md:w-80 flex-shrink-0"
              style={{
                background: "linear-gradient(180deg, #FFF9F0 0%, #FFF5E6 100%)",
                borderRight: "1.5px solid #E8D5B0",
                borderBottom: "1.5px solid #E8D5B0",
              }}>

              {/* 仕切り装飾 */}
              <div className="w-full flex items-center gap-2">
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #D4A020)" }} />
                <span style={{ fontSize: 13 }}>🍦</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #D4A020, transparent)" }} />
              </div>

              {/* ターンテーブル台（シルバー） */}
              <div className="relative flex items-center justify-center"
                style={{
                  width: "min(260px, calc(100vw - 48px))",
                  height: "min(260px, calc(100vw - 48px))",
                  borderRadius: 12,
                  background: SILVER_BG,
                  border: SILVER_BORDER,
                  boxShadow: SILVER_SHADOW,
                }}>
                {/* ターンテーブルマット（丸い黒い台） */}
                <div style={{
                  position: "absolute",
                  width: "84%", height: "84%", borderRadius: "50%",
                  background: "radial-gradient(circle, #231008 0%, #160A04 100%)",
                  border: "1px solid rgba(74,40,8,0.4)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                }} />
                <div style={{ position: "relative", zIndex: 5 }}>
                  <VinylRecord track={track} isPlaying={isPlaying} size={200} onClick={() => setShowNowPlaying(true)} />
                </div>
                <ToneArm isPlaying={isPlaying} />
              </div>

              {/* 曲情報 */}
              <div className="text-center w-full">
                <MarqueeTitle
                  title={track.title}
                  style={{
                    color: "#3D2B1A", fontSize: 15, fontWeight: 700,
                    fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.04em",
                    lineHeight: 1.4, marginBottom: 2,
                    display: "block",
                  }}
                />
                <p style={{ color: "#8B6A4A", fontSize: 11, letterSpacing: "0.14em" }}>
                  {displayArtist(track.artist)}
                </p>
                <span style={{
                  display: "inline-block", marginTop: 6, padding: "2px 10px", fontSize: 10,
                  background: "rgba(184,128,10,0.08)", border: "1px solid rgba(184,128,10,0.3)",
                  color: "#B8800A", letterSpacing: "0.1em", borderRadius: 2,
                }}>
                  {track.genre}
                </span>
              </div>

              {/* ── シークバー（つまみドラッグ専用・誤タッチ防止） ── */}
              <SeekBar
                progress={progress}
                onSeek={seek}
                elapsed={elapsed}
                duration={duration}
                onSeekRelative={seekRelative}
              />

              {/* ── メインコントロール ── */}
              <div className="flex items-center justify-center gap-3 w-full">
                <button onClick={toggleShuffle} className="transition-all active:scale-90"
                  style={{
                    width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: shuffle ? "rgba(184,128,10,0.15)" : "transparent",
                    border: shuffle ? "1px solid rgba(184,128,10,0.4)" : "1px solid rgba(139,106,74,0.2)",
                  }}>
                  <IconShuffle size={16} color={shuffle ? "#B8800A" : "#8B6A4A"} active={shuffle} />
                </button>

                <button onClick={prev} className="flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{
                    width: 44, height: 44,
                    background: "#FFFDF5", border: "1.5px solid #C4A882",
                    boxShadow: "0 2px 8px rgba(61,43,26,0.15)",
                  }}>
                  <IconPrev size={18} color="#3D2B1A" />
                </button>

                <button onClick={isPlaying ? pause : play}
                  className="flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{
                    width: 60, height: 60,
                    background: "radial-gradient(circle at 38% 35%, #F0C84A, #B8800A 55%, #8B5E00)",
                    boxShadow: "0 4px 18px rgba(184,128,10,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
                    border: "1.5px solid rgba(184,128,10,0.7)",
                  }}>
                  {isPlaying
                    ? <IconPause size={22} color="#FFF9F0" />
                    : <div style={{ marginLeft: 3 }}><IconPlay size={22} color="#FFF9F0" /></div>
                  }
                </button>

                <button onClick={next} className="flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{
                    width: 44, height: 44,
                    background: "#FFFDF5", border: "1.5px solid #C4A882",
                    boxShadow: "0 2px 8px rgba(61,43,26,0.15)",
                  }}>
                  <IconNext size={18} color="#3D2B1A" />
                </button>

                <button onClick={toggleRepeat} className="transition-all active:scale-90"
                  style={{
                    width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: repeat !== "none" ? "rgba(184,128,10,0.15)" : "transparent",
                    border: repeat !== "none" ? "1px solid rgba(184,128,10,0.4)" : "1px solid rgba(139,106,74,0.2)",
                  }}>
                  {repeat === "one"
                    ? <IconRepeatOne size={16} color="#B8800A" />
                    : <IconRepeat size={16} color={repeat !== "none" ? "#B8800A" : "#8B6A4A"} active={repeat !== "none"} />
                  }
                </button>
              </div>

              {/* ── ボリューム（リデザイン） ── */}
              <VolumeControl volume={volume} onChange={changeVolume} />

              {/* 仕切り */}
              <div className="w-full flex items-center gap-2">
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #D4A020)" }} />
                <span style={{ fontSize: 13 }}>🍦</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #D4A020, transparent)" }} />
              </div>

              {/* シェアボタン */}
              <div className="w-full">
                <ShareButtons track={track} />
              </div>
            </div>

            {/* ═══ 右: ビジュアライザー + プレイリスト ═══ */}
            <div className="flex-1 flex flex-col min-w-0" ref={playlistRef}>

              {/* グラフィックイコライザー */}
              <div style={{
                background: "linear-gradient(180deg, #3D1E0A 0%, #2A1208 100%)",
                borderBottom: "1.5px solid #5A2E12",
                padding: "10px 16px 8px",
              }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 9, color: "rgba(230,168,32,0.5)", letterSpacing: "0.2em", fontFamily: "'Shippori Mincho', serif" }}>
                    GRAPHIC EQUALIZER
                  </span>
                  {isPlaying && (
                    <span style={{ fontSize: 9, color: "#6BAF96", letterSpacing: "0.15em" }}>● LIVE</span>
                  )}
                </div>
                <Visualizer analyserRef={analyserRef} isPlaying={isPlaying} barCount={52} height={60} colorTop="#D4A020" colorBot="#7A4E00" />
              </div>

              {/* タブバー */}
              <div className="flex" style={{ borderBottom: "1.5px solid #E8D5B0", background: "#FFF9F0" }}>
                {(["playlist", "ranking"] as Tab[]).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs transition-all"
                    style={{
                      color: tab === t ? "#B8800A" : "#8B6A4A",
                      borderBottom: tab === t ? "2.5px solid #B8800A" : "2.5px solid transparent",
                      background: "transparent", fontWeight: tab === t ? 700 : 400,
                      fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.1em",
                    }}>
                    {t === "playlist"
                      ? <><IconList size={13} color={tab === t ? "#B8800A" : "#8B6A4A"} /> プレイリスト</>
                      : <><IconTrophy size={13} color={tab === t ? "#B8800A" : "#8B6A4A"} /> 人気ランキング</>
                    }
                  </button>
                ))}
                <span className="ml-auto flex items-center px-4" style={{ color: "#B8A080", fontSize: 10 }}>
                  {trackList.length}曲
                </span>
              </div>

              {/* リスト */}
              <div style={{ background: "#FFFDF8", flex: 1 }}>
                {tab === "playlist"
                  ? <RetroPlaylist tracks={trackList} currentIndex={currentIndex} isPlaying={isPlaying} playCounts={playCounts} onSelect={selectTrack} />
                  : <RetroRankings tracks={trackList} playCounts={playCounts} currentTrackId={track.id} onSelect={selectTrack} allTracks={trackList} />
                }
              </div>
            </div>
          </div>

          {/* ─── About セクション ─── */}
          <div style={{
            background: "linear-gradient(180deg, #FFF5E0 0%, #FFF0D0 100%)",
            borderTop: "1px solid #E8D5B0",
            padding: "20px 24px",
          }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ flex: 0, width: 2, height: 16, background: "#B8800A", borderRadius: 1 }} />
              <h3 style={{
                color: "#B8800A", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.2em", fontFamily: "'Shippori Mincho', serif",
              }}>
                ICE CREAM MUSIC BOX とは
              </h3>
            </div>
            <p style={{
              color: "#6B4E38", fontSize: 12, lineHeight: 1.9,
              letterSpacing: "0.05em", maxWidth: 680,
            }}>
              ICE CREAM MUSIC BOXは、楽曲の歌詞の中にすべてアイスクリームに関する内容の歌だけを集めたアイスクリーム特化型ミュージックボックスです。あいぱく会場のBGMで流れているアイスクリームミュージックが気軽に楽しめます。
            </p>
          </div>

          {/* ─── インストールバナー ─── */}
          <InstallBanner />

          {/* ─── フッター ─── */}
          <div className="flex items-center justify-center px-5 py-3"
            style={{
              background: "linear-gradient(180deg, #3D1E0A 0%, #2A1208 100%)",
              borderTop: "2px solid #B8800A",
            }}>
            <p style={{
              color: "rgba(230,168,32,0.55)", fontSize: 10,
              fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.2em",
            }}>
              🍦 ICECREAM MUSIC by あいぱく®
            </p>
          </div>

        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #B8800A; border: 2px solid #FFF9F0;
          box-shadow: 0 1px 4px rgba(184,128,10,0.5);
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #B8800A; border: 2px solid #FFF9F0; cursor: pointer;
        }
        /* ボリュームスライダーはカスタムつまみを使うので非表示 */
        .volume-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px; height: 28px; opacity: 0;
        }
        .volume-range-input::-moz-range-thumb {
          width: 28px; height: 28px; opacity: 0; border: none;
        }
      `}</style>
    </>
  );
}
