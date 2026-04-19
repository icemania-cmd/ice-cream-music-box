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
import AppShareButtons from "./AppShareButtons";

import LiveListeners from "./LiveListeners";
import TotalLikes from "./TotalLikes";
import {
  IconPlay, IconPause, IconNext, IconPrev,
  IconShuffle, IconRepeat, IconRepeatOne,
  IconExpand, IconList, IconTrophy,
} from "./FlatIcons";
import { Volume1, Volume2, VolumeX, Zap, RotateCcw, RotateCw } from "lucide-react";

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
      width: 37, height: 55, zIndex: 10,
      transformOrigin: "7px 6px",
      transform: isPlaying ? "rotate(20deg)" : "rotate(-38deg)",
      transition: "transform 1.1s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <svg width="37" height="55" viewBox="0 0 64 96">
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
// VolumeControl: おしゃれな大型ボリュームコントロール
// ──────────────────────────────────────────────────────────────
function VolumeControl({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
  const isMuted = volume === 0;
  const isBoost = volume > 1;
  const pct = volume / 2; // スライダー上の位置（0-1）

  // 音量アイコン: ミュート→Volume1→Volume2→ブースト(Zap)
  const VolumeIcon = () => {
    if (isMuted) return <VolumeX size={18} color="#8B6A4A" strokeWidth={1.8} />;
    if (isBoost)  return <Zap size={18} color="#D65076" strokeWidth={1.8} />;
    if (volume > 0.5) return <Volume2 size={18} color="#B8800A" strokeWidth={1.8} />;
    return <Volume1 size={18} color="#B8800A" strokeWidth={1.8} />;
  };

  // つまみのスタイル
  const thumbBg = isBoost
    ? "radial-gradient(circle at 38% 35%, #F09BB8, #D65076 55%, #A83560)"
    : "radial-gradient(circle at 38% 35%, #F0C84A, #B8800A 55%, #8B5E00)";
  const thumbShadow = isBoost
    ? "0 2px 14px rgba(214,80,118,0.55), inset 0 1px 0 rgba(255,255,255,0.35)"
    : "0 2px 14px rgba(184,128,10,0.5), inset 0 1px 0 rgba(255,255,255,0.35)";

  // つまみ位置: calc(pct * 100% + (14 - pct * 28)px) = 左端14px、右端calc(100%-14px)
  const thumbLeft = `calc(${pct * 100}% + ${14 - pct * 28}px)`;

  const presets = [
    { label: "MUTE", value: 0, active: isMuted, boost: false },
    { label: "100%", value: 1, active: Math.abs(volume - 1) < 0.02, boost: false },
    { label: "MAX", value: 2, active: Math.abs(volume - 2) < 0.02, boost: true },
  ];

  return (
    <div className="w-full flex flex-col" style={{ gap: 10 }}>
      {/* ヘッダー行: アイコン＋VOLUME＋数値 */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(isMuted ? 0.7 : 0)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", borderRadius: 4 }}
            title={isMuted ? "ミュート解除" : "ミュート"}
          >
            <VolumeIcon />
          </button>
          <span style={{
            fontSize: 9, color: "#8B6A4A", letterSpacing: "0.2em",
            fontFamily: "var(--font-nunito), var(--font-mplus), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
          }}>VOLUME</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isBoost && (
            <span style={{
              fontSize: 8, padding: "1px 6px", borderRadius: 3,
              background: "rgba(214,80,118,0.12)", border: "1px solid rgba(214,80,118,0.35)",
              color: "#D65076", letterSpacing: "0.1em",
              fontFamily: "var(--font-nunito), var(--font-mplus), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
            }}>BOOST</span>
          )}
          <span style={{
            fontSize: 16, fontWeight: 700,
            color: isBoost ? "#D65076" : "#B8800A",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "var(--font-nunito), var(--font-mplus), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
            textShadow: isBoost ? "0 0 10px rgba(214,80,118,0.35)" : "none",
            transition: "color 0.3s, text-shadow 0.3s",
            minWidth: 48, textAlign: "right",
          }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* スライダー本体 */}
      <div className="relative w-full" style={{ height: 48 }}>
        {/* トラック背景（全体） */}
        <div style={{
          position: "absolute", left: 14, right: 14,
          top: "50%", transform: "translateY(-50%)",
          height: 8, borderRadius: 4,
          background: "rgba(60,30,10,0.08)",
          border: "1px solid rgba(60,30,10,0.05)",
        }} />

        {/* 通常ゾーンフィル (0→100%) */}
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

        {/* ブーストゾーンフィル (100%→200%) */}
        <div style={{
          position: "absolute",
          left: `calc(50% + 0px)`,
          top: "50%", transform: "translateY(-50%)",
          height: 8,
          width: `calc(${Math.max(0, volume - 1) * 50}% - ${Math.max(0, volume - 1) * 14}px)`,
          background: "linear-gradient(90deg, #E6A820, #D65076)",
          pointerEvents: "none", zIndex: 1,
          transition: "width 0.05s",
        }} />

        {/* 100%区切りライン */}
        <div style={{
          position: "absolute", left: "50%",
          top: "50%", transform: "translate(-50%, -50%)",
          width: 2, height: 20, borderRadius: 1,
          background: isBoost ? "rgba(214,80,118,0.6)" : "rgba(139,106,74,0.25)",
          zIndex: 2, transition: "background 0.3s",
        }} />

        {/* 100%ラベル */}
        <div style={{
          position: "absolute", left: "50%", bottom: 2,
          transform: "translateX(-50%)",
          fontSize: 8, color: "rgba(139,106,74,0.45)",
          letterSpacing: "0.04em",
          fontFamily: "var(--font-nunito), var(--font-mplus), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
          pointerEvents: "none",
        }}>100%</div>

        {/* range input（透明・クリック受付） */}
        <input
          type="range" min={0} max={2} step={0.01} value={volume}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="volume-range-input"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", zIndex: 4, margin: 0,
          }}
        />

        {/* カスタムつまみ */}
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
      <div className="flex gap-2 w-full">
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
              fontFamily: "var(--font-nunito), var(--font-mplus), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
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
  const [rankingData, setRankingData] = useState<
    Record<number, { likes: number; plays: number; score: number }>
  >({});
  const [likedByMe, setLikedByMe] = useState<Set<number>>(new Set());
  const lastPlayedIdRef = useRef<number | null>(null);

  const {
    track, tracks: trackList, currentIndex, isPlaying,
    progress, duration, volume, shuffle, repeat, playCounts, analyserRef,
    play, pause, seek, changeVolume, selectTrack,
    next, prev, toggleShuffle, toggleRepeat, reloadTracks,
  } = engine;

  const elapsed = progress * duration;

  // 起動時: URLの ?track=<id> を読んで該当曲を選択
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get("track");
    if (!trackId) return;
    const idx = trackList.findIndex((t) => String(t.id) === trackId);
    if (idx >= 0 && idx !== currentIndex) {
      selectTrack(idx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時1回のみ

  // 再生中の曲が変わったらURLを更新（ブラウザ履歴には残さない）
  useEffect(() => {
    if (typeof window === "undefined" || !track) return;
    const url = new URL(window.location.href);
    url.searchParams.set("track", String(track.id));
    window.history.replaceState(null, "", url.toString());
  }, [track]);

  // マウント時: ランキングデータ取得 + localStorageからいいね済みリスト読込
  useEffect(() => {
    fetch("/api/rankings")
      .then((r) => r.json())
      .then((data) => setRankingData(data))
      .catch(() => {});
    try {
      const stored = JSON.parse(
        localStorage.getItem("mbox:liked") ?? "[]"
      ) as number[];
      setLikedByMe(new Set(stored));
    } catch {}
  }, []);

  // 再生カウント: セッション内で同じ曲の重複を防ぐ
  useEffect(() => {
    if (!isPlaying || !track) return;
    if (track.id === lastPlayedIdRef.current) return;
    lastPlayedIdRef.current = track.id;
    fetch(`/api/play/${track.id}`, { method: "POST" }).catch(() => {});
  }, [track?.id, isPlaying]);

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

  const toggleLike = useCallback(
    (trackId: number) => {
      const wasLiked = likedByMe.has(trackId);
      setLikedByMe((prev) => {
        const next = new Set(prev);
        wasLiked ? next.delete(trackId) : next.add(trackId);
        return next;
      });
      setRankingData((prev) => {
        const entry = prev[trackId] ?? { likes: 0, plays: 0, score: 0 };
        const likes = Math.max(0, entry.likes + (wasLiked ? -1 : 1));
        return { ...prev, [trackId]: { ...entry, likes, score: likes * 5 + entry.plays } };
      });
      try {
        const stored = JSON.parse(localStorage.getItem("mbox:liked") ?? "[]") as number[];
        const next = wasLiked
          ? stored.filter((id) => id !== trackId)
          : [...stored, trackId];
        localStorage.setItem("mbox:liked", JSON.stringify(next));
      } catch {}
      fetch(`/api/like/${trackId}`, { method: "POST" })
        .then((r) => r.json())
        .then((data: { liked: boolean; count: number }) => {
          setRankingData((prev) => ({
            ...prev,
            [trackId]: {
              ...prev[trackId],
              likes: data.count,
              score: data.count * 5 + (prev[trackId]?.plays ?? 0),
            },
          }));
        })
        .catch(() => {});
    },
    [likedByMe]
  );

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
              <img src="/icon-192.png" width={56} height={56} alt="Ice Cream Music Box" style={{ borderRadius: "50%" }} />
              <div>
                <h1 style={{
                  color: "#E6A820", fontSize: 13, fontWeight: 700,
                  letterSpacing: "0.22em", fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif", lineHeight: 1.3,
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
                  fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
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
                    letterSpacing: "0.1em", fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
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
                  letterSpacing: "0.15em", fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
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

          {/* ─── 累計いいね数 ─── */}
          <TotalLikes rankingData={rankingData} />

          {/* ─── フルワイド ターンテーブルセクション ─── */}
          <div style={{
            position: "relative",
            width: "100vw",
            left: "50%",
            transform: "translateX(-50%)",
            background: [
              "repeating-linear-gradient(0deg, transparent 0px, rgba(0,0,0,0.045) 1px, transparent 2px, rgba(0,0,0,0.02) 4px, transparent 6px)",
              "repeating-linear-gradient(90deg, transparent 0px, rgba(255,180,60,0.012) 25px, transparent 50px)",
              "linear-gradient(178deg, #5C2C0A 0%, #7B3E10 7%, #6A3010 14%, #8B4A1A 21%, #6B3010 28%, #7A3C0E 35%, #5C2C0A 42%, #8B4A1A 49%, #6B3010 56%, #7B3E10 63%, #5C2A08 70%, #8A481A 77%, #6B3010 84%, #7B3E10 91%, #5C2C0A 100%)"
            ].join(", "),
            padding: "20px 0 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            boxShadow: "inset 0 -6px 20px rgba(0,0,0,0.35), inset 0 2px 8px rgba(0,0,0,0.2)",
          }}>
            {/* ターンテーブル台（シルバー）+ レコード + アーム */}
            <div className="relative flex items-center justify-center"
              style={{
                width: "min(160px, calc(100vw - 40px))",
                height: "min(160px, calc(100vw - 40px))",
                borderRadius: 10,
                background: SILVER_BG,
                border: SILVER_BORDER,
                boxShadow: "0 4px 20px rgba(0,0,0,0.45), " + SILVER_SHADOW,
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
                <VinylRecord track={track} isPlaying={isPlaying} size={130} onClick={() => setShowNowPlaying(true)} />
              </div>
              <ToneArm isPlaying={isPlaying} />
            </div>

            {/* 曲情報（木目背景の上） */}
            <div className="text-center" style={{ maxWidth: "min(160px, calc(100vw - 40px))" }}>
              <MarqueeTitle
                title={track.title}
                style={{
                  color: "#FFF9F0", fontSize: 12, fontWeight: 700,
                  fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif", letterSpacing: "0.04em",
                  lineHeight: 1.4, marginBottom: 4,
                  display: "block",
                  textShadow: "0 1px 6px rgba(0,0,0,0.7)",
                }}
              />
              <p style={{ color: "rgba(255,235,180,0.85)", fontSize: 11, letterSpacing: "0.14em", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                {displayArtist(track.artist)}
              </p>
              <span style={{
                display: "inline-block", marginTop: 6, padding: "2px 10px", fontSize: 10,
                background: "rgba(255,200,50,0.1)", border: "1px solid rgba(255,200,80,0.3)",
                color: "rgba(255,220,120,0.9)", letterSpacing: "0.1em", borderRadius: 2,
              }}>
                {track.genre}
              </span>
            </div>
          </div>

          {/* ─── 本体 2カラム ─── */}
          <div className="flex flex-col md:flex-row flex-1">

            {/* ═══ 左: コントロール ═══ */}
            <div className="flex flex-col items-center gap-4 p-5 md:w-80 flex-shrink-0"
              style={{
                background: "linear-gradient(180deg, #FFF9F0 0%, #FFF5E6 100%)",
                borderRight: "1.5px solid #E8D5B0",
                borderBottom: "1.5px solid #E8D5B0",
              }}>

              {/* ── シークバー（プログレスバー表示のみ） ── */}
              <div className="w-full flex flex-col gap-1.5">
                {/* プログレスバー */}
                <div className="relative w-full" style={{ height: 6, borderRadius: 3, background: "rgba(60,30,10,0.12)", overflow: "hidden" }}>
                  <div className="absolute left-0 top-0 h-full"
                    style={{
                      width: `${progress * 100}%`,
                      background: "linear-gradient(90deg, #B8800A, #D4A020)",
                      borderRadius: 3,
                      transition: "width 0.4s linear",
                    }} />
                </div>
                {/* 時間表示 */}
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 10, color: "#8B6A4A", fontVariantNumeric: "tabular-nums" as const, minWidth: 30 }}>{fmt(elapsed)}</span>
                  <span style={{ fontSize: 10, color: "#8B6A4A", fontVariantNumeric: "tabular-nums" as const, minWidth: 30, textAlign: "right" }}>{fmt(duration)}</span>
                </div>
              </div>

              {/* ── グラフィックイコライザー ── */}
              <div className="w-full" style={{
                borderRadius: 8,
                background: "linear-gradient(180deg, #2A1208 0%, #1E0D06 100%)",
                border: "1px solid rgba(90,46,18,0.5)",
                padding: "8px 12px 6px",
              }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 8, color: "rgba(230,168,32,0.45)", letterSpacing: "0.2em", fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif" }}>
                    GRAPHIC EQ
                  </span>
                  {isPlaying && (
                    <span style={{ fontSize: 8, color: "#6BAF96", letterSpacing: "0.15em" }}>● LIVE</span>
                  )}
                </div>
                <Visualizer analyserRef={analyserRef} isPlaying={isPlaying} barCount={40} height={48} colorTop="#D4A020" colorBot="#7A4E00" />
              </div>

              {/* ── シャッフル / リピート行 ── */}
              <div className="flex items-center justify-center gap-6 w-full">
                <button onClick={toggleShuffle} className="flex items-center gap-1.5 transition-all active:scale-90"
                  style={{
                    padding: "6px 14px", borderRadius: 20,
                    background: shuffle ? "rgba(184,128,10,0.15)" : "rgba(61,43,26,0.04)",
                    border: shuffle ? "1px solid rgba(184,128,10,0.45)" : "1px solid rgba(139,106,74,0.2)",
                  }}>
                  <IconShuffle size={14} color={shuffle ? "#B8800A" : "#8B6A4A"} active={shuffle} />
                  <span style={{ fontSize: 9, color: shuffle ? "#B8800A" : "#8B6A4A", letterSpacing: "0.1em", fontFamily: "var(--font-nunito), 'Nunito', sans-serif" }}>SHUFFLE</span>
                </button>

                <button onClick={toggleRepeat} className="flex items-center gap-1.5 transition-all active:scale-90"
                  style={{
                    padding: "6px 14px", borderRadius: 20,
                    background: repeat !== "none" ? "rgba(184,128,10,0.15)" : "rgba(61,43,26,0.04)",
                    border: repeat !== "none" ? "1px solid rgba(184,128,10,0.45)" : "1px solid rgba(139,106,74,0.2)",
                  }}>
                  {repeat === "one"
                    ? <IconRepeatOne size={14} color="#B8800A" />
                    : <IconRepeat size={14} color={repeat !== "none" ? "#B8800A" : "#8B6A4A"} active={repeat !== "none"} />
                  }
                  <span style={{ fontSize: 9, color: repeat !== "none" ? "#B8800A" : "#8B6A4A", letterSpacing: "0.1em", fontFamily: "var(--font-nunito), 'Nunito', sans-serif" }}>
                    {repeat === "one" ? "REPEAT 1" : "REPEAT"}
                  </span>
                </button>
              </div>

              {/* ── メインコントロール行: ◀◀ | ⏪15 | ▶ | 15⏩ | ▶▶ ── */}
              <div className="flex items-center justify-center gap-2 w-full">
                {/* 前の曲 */}
                <button onClick={prev}
                  className="flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{
                    width: 44, height: 44,
                    background: "#FFFDF5", border: "1.5px solid #C4A882",
                    boxShadow: "0 2px 8px rgba(61,43,26,0.12)",
                  }}>
                  <IconPrev size={18} color="#3D2B1A" />
                </button>

                {/* -15秒 */}
                <button onClick={() => seekRelative(-15)} title="-15秒"
                  className="flex flex-col items-center justify-center transition-all active:scale-90"
                  style={{
                    width: 50, height: 50, borderRadius: 12,
                    background: "rgba(61,43,26,0.05)",
                    border: "1.5px solid rgba(139,106,74,0.25)",
                    gap: 2, cursor: "pointer",
                  }}>
                  <RotateCcw size={20} strokeWidth={1.5} color="#8B6A4A" />
                  <span style={{ fontSize: 8, color: "#8B6A4A", fontWeight: 600, letterSpacing: "0.04em", lineHeight: 1 }}>15</span>
                </button>

                {/* 再生/一時停止（大きい） */}
                <button onClick={isPlaying ? pause : play}
                  className="flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{
                    width: 64, height: 64,
                    background: "radial-gradient(circle at 38% 35%, #F0C84A, #B8800A 55%, #8B5E00)",
                    boxShadow: "0 4px 20px rgba(184,128,10,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
                    border: "1.5px solid rgba(184,128,10,0.7)",
                  }}>
                  {isPlaying
                    ? <IconPause size={24} color="#FFF9F0" />
                    : <div style={{ marginLeft: 3 }}><IconPlay size={24} color="#FFF9F0" /></div>
                  }
                </button>

                {/* +15秒 */}
                <button onClick={() => seekRelative(15)} title="+15秒"
                  className="flex flex-col items-center justify-center transition-all active:scale-90"
                  style={{
                    width: 50, height: 50, borderRadius: 12,
                    background: "rgba(61,43,26,0.05)",
                    border: "1.5px solid rgba(139,106,74,0.25)",
                    gap: 2, cursor: "pointer",
                  }}>
                  <RotateCw size={20} strokeWidth={1.5} color="#8B6A4A" />
                  <span style={{ fontSize: 8, color: "#8B6A4A", fontWeight: 600, letterSpacing: "0.04em", lineHeight: 1 }}>15</span>
                </button>

                {/* 次の曲 */}
                <button onClick={next}
                  className="flex items-center justify-center rounded-full transition-all active:scale-90"
                  style={{
                    width: 44, height: 44,
                    background: "#FFFDF5", border: "1.5px solid #C4A882",
                    boxShadow: "0 2px 8px rgba(61,43,26,0.12)",
                  }}>
                  <IconNext size={18} color="#3D2B1A" />
                </button>
              </div>

              {/* ── ボリューム（リデザイン） ── */}
              <VolumeControl volume={volume} onChange={changeVolume} />

              {/* シェアボタン */}
              <div className="w-full">
                <ShareButtons track={track} />
              </div>
            </div>

            {/* ═══ 右: プレイリスト ═══ */}
            <div className="flex-1 flex flex-col min-w-0" ref={playlistRef}>

              {/* タブバー */}
              <div className="flex" style={{ borderBottom: "1.5px solid #E8D5B0", background: "#FFF9F0" }}>
                {(["playlist", "ranking"] as Tab[]).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs transition-all"
                    style={{
                      color: tab === t ? "#B8800A" : "#8B6A4A",
                      borderBottom: tab === t ? "2.5px solid #B8800A" : "2.5px solid transparent",
                      background: "transparent", fontWeight: tab === t ? 700 : 400,
                      fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif", letterSpacing: "0.1em",
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
                  ? <RetroPlaylist tracks={trackList} currentIndex={currentIndex} isPlaying={isPlaying} playCounts={playCounts} onSelect={selectTrack} likedByMe={likedByMe} onToggleLike={toggleLike} />
                  : <RetroRankings tracks={trackList} playCounts={playCounts} currentTrackId={track.id} onSelect={selectTrack} allTracks={trackList} rankingData={rankingData} likedByMe={likedByMe} onToggleLike={toggleLike} />
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
                letterSpacing: "0.2em", fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
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

          {/* ─── アプリシェア ─── */}
          <div style={{
            background: "linear-gradient(180deg, #FFF5E0 0%, #FFF0D0 100%)",
            borderTop: "1px solid #E8D5B0",
            padding: "16px 24px",
          }}>
            <AppShareButtons />
          </div>

          {/* ─── フッター ─── */}
          <div className="flex items-center justify-center px-5 py-3"
            style={{
              background: "linear-gradient(180deg, #3D1E0A 0%, #2A1208 100%)",
              borderTop: "2px solid #B8800A",
            }}>
            <p style={{
              color: "rgba(230,168,32,0.55)", fontSize: 10,
              fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif", letterSpacing: "0.2em",
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
