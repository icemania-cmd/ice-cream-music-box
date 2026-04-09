"use client";

import { useState, useCallback, useRef } from "react";
import { Track } from "@/lib/tracks";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import VinylRecord from "./VinylRecord";
import RetroPlaylist from "./RetroPlaylist";
import RetroRankings from "./RetroRankings";
import NowPlayingModal from "./NowPlayingModal";
import Visualizer from "./Visualizer";
import ShareButtons from "./ShareButtons";
import InstallBanner from "./InstallBanner";
import {
  IconPlay, IconPause, IconNext, IconPrev,
  IconShuffle, IconRepeat, IconRepeatOne,
  IconVolume, IconMute,
  IconExpand, IconList, IconTrophy,
} from "./FlatIcons";

type Tab = "playlist" | "ranking";

/** "AI-SONG" を表示用に変換 */
const displayArtist = (a: string) => a === "AI-SONG" ? "ICECREAM SONG" : a;

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
  const isMuted = volume === 0;

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
                <p style={{
                  color: "#3D2B1A", fontSize: 15, fontWeight: 700,
                  fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.04em",
                  lineHeight: 1.4, marginBottom: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {track.title}
                </p>
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

              {/* ── シークバー ── */}
              <div className="w-full flex flex-col gap-1">
                <div className="relative flex items-center" style={{ height: 24 }}>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
                    style={{ height: 4, background: "rgba(60,30,10,0.12)" }} />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                    style={{
                      height: 4, width: `${progress * 100}%`,
                      background: "linear-gradient(90deg, #B8800A, #D4A020)", zIndex: 1,
                    }} />
                  <input type="range" min={0} max={1} step={0.001} value={progress}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="w-full absolute inset-0 opacity-0 cursor-pointer" style={{ zIndex: 2 }} />
                  <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      left: `calc(${progress * 100}% - 8px)`,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "radial-gradient(circle at 35% 35%, #F0C84A, #B8800A)",
                      boxShadow: "0 1px 6px rgba(100,60,10,0.4)", zIndex: 3,
                    }} />
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: 10, color: "#8B6A4A", fontVariantNumeric: "tabular-nums" as const }}>{fmt(elapsed)}</span>
                  <span style={{ fontSize: 10, color: "#8B6A4A", fontVariantNumeric: "tabular-nums" as const }}>{fmt(duration)}</span>
                </div>
              </div>

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

              {/* ── ボリューム ── */}
              <div className="flex items-center gap-2 w-full" style={{ maxWidth: 200 }}>
                <button onClick={() => changeVolume(isMuted ? 0.7 : 0)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                  {isMuted ? <IconMute size={16} color="#8B6A4A" /> : <IconVolume size={16} color="#8B6A4A" />}
                </button>
                <div className="relative flex items-center flex-1" style={{ height: 20 }}>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
                    style={{ height: 3, background: "rgba(60,30,10,0.1)" }} />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                    style={{ height: 3, width: `${volume * 100}%`, background: "rgba(184,128,10,0.45)" }} />
                  <input type="range" min={0} max={1} step={0.01} value={volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-full absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

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
      `}</style>
    </>
  );
}
