"use client";

import { useState, useCallback } from "react";
import { Track } from "@/lib/tracks";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import VinylRecord from "./VinylRecord";
import RetroControls from "./RetroControls";
import RetroPlaylist from "./RetroPlaylist";
import RetroRankings from "./RetroRankings";
import NowPlayingModal from "./NowPlayingModal";
import Visualizer from "./Visualizer";
import { IconExpand, IconList, IconTrophy } from "./FlatIcons";
import ShareButtons from "./ShareButtons";

type Tab = "playlist" | "ranking";

// トーンアーム SVG
// 回転の正方向（CW）= 時計回り = 針がレコード方向（左下）へ
// pivot: SVG (12,10) を transformOrigin に合わせてピクセル指定
// 非再生: rotate(-38deg) → 右側のアームレストに退避
// 再生中: rotate(20deg)  → レコード外溝に針が当たる位置
function ToneArm({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div style={{
      position: "absolute",
      top: "4%",
      right: "2%",
      width: 64,
      height: 96,
      zIndex: 10,
      transformOrigin: "12px 10px",   // SVGのピボット座標と一致
      transform: isPlaying ? "rotate(20deg)" : "rotate(-38deg)",
      transition: "transform 1.1s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <svg width="64" height="96" viewBox="0 0 64 96">
        {/* アームレスト柱（非再生時に針が乗る土台） */}
        <rect x="54" y="2" width="8" height="14" rx="2"
          fill="#2A1208" stroke="#8B5E00" strokeWidth="0.8" />
        <rect x="55" y="3" width="6" height="3" rx="1"
          fill="#C8860A" opacity="0.6" />

        {/* ピボット台座 */}
        <circle cx="12" cy="10" r="9" fill="#2A1208" stroke="#6B3E00" strokeWidth="1" />
        <circle cx="12" cy="10" r="7" fill="#1A0A04" stroke="#C8860A" strokeWidth="1.2" />
        <circle cx="12" cy="10" r="4" fill="#120804" />
        <circle cx="12" cy="10" r="2" fill="#C8860A" />

        {/* アーム本体（太め＋細ハイライト） */}
        <path d="M 12 10 L 17 17 L 54 78"
          fill="none" stroke="#4A2808" strokeWidth="4" strokeLinecap="round" />
        <path d="M 12 10 L 17 17 L 54 78"
          fill="none" stroke="#8B5E00" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 13 9 L 18 16 L 55 77"
          fill="none" stroke="#D4A020" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

        {/* カートリッジ（針ヘッド） */}
        <rect x="48" y="73" width="14" height="18" rx="2"
          fill="#1A0A04" stroke="#8B5E00" strokeWidth="1" />
        <rect x="50" y="74" width="10" height="4" rx="1"
          fill="#C8860A" opacity="0.5" />

        {/* 針先（再生中に光る） */}
        <line x1="55" y1="91" x2="55" y2="97"
          stroke={isPlaying ? "#FF6B9D" : "#D65076"}
          strokeWidth="2" strokeLinecap="round" />
        <circle cx="55" cy="97" r={isPlaying ? "2.5" : "1.5"}
          fill={isPlaying ? "#FF6B9D" : "#D65076"}
          opacity={isPlaying ? 0.9 : 0.5} />
      </svg>
    </div>
  );
}

export default function MusicPlayer({ initialTracks }: { initialTracks: Track[] }) {
  const engine = useAudioEngine(initialTracks);
  const [tab, setTab] = useState<Tab>("playlist");
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [reloadMsg, setReloadMsg] = useState<string | null>(null);

  const {
    track, tracks: trackList, currentIndex, isPlaying,
    progress, duration, volume, shuffle, repeat, playCounts, analyserRef,
    play, pause, seek, changeVolume, selectTrack,
    next, prev, toggleShuffle, toggleRepeat, reloadTracks,
  } = engine;

  /** フォルダを再スキャンして曲リストを更新 */
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

      {/* ページ背景 */}
      <div className="min-h-screen flex items-center justify-center p-3 md:p-5"
        style={{ background: "#0A0503" }}>

        {/* キャビネット */}
        <div className="w-full overflow-hidden"
          style={{
            maxWidth: 1000,
            borderRadius: 16,
            background: "#1C0E06",
            border: "2px solid #3B1A0A",
            boxShadow: "0 24px 64px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.7)",
          }}>

          {/* 上部ゴールドライン */}
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #C8860A 30%, #E6A820 50%, #C8860A 70%, transparent)" }} />

          {/* ヘッダー */}
          <div className="flex items-center justify-between px-5 py-3"
            style={{ background: "linear-gradient(180deg, #2E1508 0%, #1C0E06 100%)", borderBottom: "1.5px solid #3B1A0A" }}>
            <div className="flex items-center gap-2.5">
              <span style={{ fontSize: 20 }}>🍦</span>
              <div>
                <h1 style={{
                  color: "#E6A820",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  fontFamily: "'Shippori Mincho', serif",
                  lineHeight: 1.2,
                }}>ICE CREAM MUSIC BOX</h1>
                <p style={{ color: "rgba(200,134,10,0.45)", fontSize: 9, letterSpacing: "0.18em" }}>
                  あいぱく BGMプレイヤー
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* フォルダ再スキャン */}
              <div className="relative">
                <button
                  onClick={handleReload}
                  disabled={reloading}
                  title="フォルダを再スキャンして曲リストを更新"
                  className="flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                  style={{
                    padding: "6px 12px",
                    background: "rgba(93,184,154,0.1)",
                    border: "1px solid rgba(93,184,154,0.35)",
                    borderRadius: 4,
                    color: "#5DB89A",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    fontFamily: "'Shippori Mincho', serif",
                    cursor: reloading ? "not-allowed" : "pointer",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M23 4v6h-6" stroke="#5DB89A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 20v-6h6" stroke="#5DB89A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="#5DB89A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {reloading ? "読込中…" : "曲を更新"}
                </button>
                {/* トースト */}
                {reloadMsg && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "#1C0E06", border: "1px solid rgba(93,184,154,0.4)",
                    color: "#5DB89A", fontSize: 10, padding: "4px 10px",
                    borderRadius: 4, whiteSpace: "nowrap", zIndex: 100,
                    letterSpacing: "0.08em",
                  }}>
                    {reloadMsg}
                  </div>
                )}
              </div>

              {/* NOW PLAYING ボタン */}
              <button
                onClick={() => setShowNowPlaying(true)}
                className="flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95"
                style={{
                  padding: "6px 14px",
                  background: "rgba(200,134,10,0.1)",
                  border: "1px solid rgba(200,134,10,0.35)",
                  borderRadius: 4,
                  color: "#C8860A",
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  fontFamily: "'Shippori Mincho', serif",
                }}
              >
                <IconExpand size={12} color="#C8860A" />
                NOW PLAYING
              </button>
            </div>
          </div>

          {/* 本体 2カラム */}
          <div className="flex flex-col md:flex-row">

            {/* ===== 左: 暗いプレイヤーパネル ===== */}
            <div className="flex flex-col items-center gap-4 p-5"
              style={{
                width: "100%",
                maxWidth: 320,
                background: "#160B04",
                borderRight: "2px solid #3B1A0A",
                flexShrink: 0,
              }}>

              {/* ターンテーブル台 */}
              <div className="relative flex items-center justify-center"
                style={{
                  width: 260,
                  height: 260,
                  borderRadius: 8,
                  background: "radial-gradient(circle at 50% 50%, #2A1208 0%, #160A04 60%, #0F0704 100%)",
                  border: "1.5px solid #3B1A0A",
                  boxShadow: "inset 0 4px 12px rgba(0,0,0,0.7)",
                }}>
                {/* ターンテーブルマット */}
                <div style={{
                  position: "absolute",
                  width: "83%", height: "83%", borderRadius: "50%",
                  background: "radial-gradient(circle, #261008 0%, #160A04 100%)",
                  border: "1px solid rgba(59,26,10,0.5)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }} />
                {/* レコード */}
                <div style={{ position: "relative", zIndex: 5 }}>
                  <VinylRecord
                    track={track} isPlaying={isPlaying} size={216}
                    onClick={() => setShowNowPlaying(true)}
                  />
                </div>
                {/* トーンアーム */}
                <ToneArm isPlaying={isPlaying} />
              </div>

              {/* 曲情報 */}
              <div className="text-center w-full">
                <p style={{
                  color: "#F5E6C8",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "'Shippori Mincho', serif",
                  letterSpacing: "0.04em",
                  lineHeight: 1.4,
                  marginBottom: 2,
                  // 長い曲名は省略
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}>
                  {track.title}
                </p>
                <p style={{ color: "rgba(245,230,200,0.45)", fontSize: 11, letterSpacing: "0.14em" }}>
                  {track.artist}
                </p>
                <span style={{
                  display: "inline-block", marginTop: 6,
                  padding: "2px 10px", fontSize: 10,
                  background: "rgba(200,134,10,0.1)",
                  border: "1px solid rgba(200,134,10,0.25)",
                  color: "#C8860A", letterSpacing: "0.1em",
                }}>
                  {track.genre}
                </span>
              </div>

              {/* コントロール */}
              <div className="w-full">
                <RetroControls
                  isPlaying={isPlaying} shuffle={shuffle} repeat={repeat}
                  progress={progress} volume={volume} duration={duration}
                  onPlay={play} onPause={pause} onNext={next} onPrev={prev}
                  onSeek={seek} onVolume={changeVolume}
                  onToggleShuffle={toggleShuffle} onToggleRepeat={toggleRepeat}
                />
              </div>

              {/* シェアボタン */}
              <div className="w-full" style={{ borderTop: "1px solid rgba(59,26,10,0.6)", paddingTop: 12 }}>
                <ShareButtons track={track} />
              </div>
            </div>

            {/* ===== 右: 白いトラックリストパネル ===== */}
            <div className="flex-1 flex flex-col min-w-0"
              style={{ background: "#FAF7F2" }}>

              {/* グラフィックイコライザー */}
              <div style={{
                background: "#1C0E06",
                borderBottom: "1.5px solid #3B1A0A",
                padding: "10px 16px 8px",
              }}>
                {/* イコライザーラベル */}
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 9, color: "rgba(200,134,10,0.5)", letterSpacing: "0.2em", fontFamily: "'Shippori Mincho', serif" }}>
                    GRAPHIC EQUALIZER
                  </span>
                  {isPlaying && (
                    <span style={{ fontSize: 9, color: "#5DB89A", letterSpacing: "0.15em" }}>
                      ● REC
                    </span>
                  )}
                </div>
                <Visualizer
                  analyserRef={analyserRef}
                  isPlaying={isPlaying}
                  barCount={52}
                  height={64}
                  colorTop="#C8860A"
                  colorBot="#6B3E00"
                />
              </div>

              {/* タブバー */}
              <div className="flex"
                style={{ borderBottom: "1.5px solid #E8DDD0", background: "#FAF7F2" }}>
                {(["playlist", "ranking"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs transition-all"
                    style={{
                      color: tab === t ? "#C8860A" : "#9B7A58",
                      borderBottom: tab === t ? "2px solid #C8860A" : "2px solid transparent",
                      background: "transparent",
                      fontWeight: tab === t ? 700 : 400,
                      fontFamily: "'Shippori Mincho', serif",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {t === "playlist"
                      ? <><IconList size={13} color={tab === t ? "#C8860A" : "#9B7A58"} /> プレイリスト</>
                      : <><IconTrophy size={13} color={tab === t ? "#C8860A" : "#9B7A58"} /> 人気ランキング</>
                    }
                  </button>
                ))}
                <span className="ml-auto flex items-center px-4 text-xs"
                  style={{ color: "#C8A880", fontSize: 10 }}>
                  {trackList.length}曲
                </span>
              </div>

              {/* リスト */}
              <div style={{ background: "#FAF7F2", flex: 1 }}>
                {tab === "playlist" ? (
                  <RetroPlaylist
                    tracks={trackList} currentIndex={currentIndex}
                    isPlaying={isPlaying} playCounts={playCounts} onSelect={selectTrack}
                  />
                ) : (
                  <RetroRankings
                    tracks={trackList} playCounts={playCounts}
                    currentTrackId={track.id} onSelect={selectTrack} allTracks={trackList}
                  />
                )}
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="flex items-center justify-between px-5 py-2"
            style={{ background: "#120805", borderTop: "1.5px solid #3B1A0A" }}>
            <div className="flex items-center gap-2">
              {["#D65076", "#5DB89A", "#F5E6C8"].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: i < 2 ? `0 0 5px ${c}` : "none", opacity: i === 2 ? 0.5 : 1 }} />
              ))}
            </div>
            <p style={{
              color: "rgba(200,134,10,0.35)", fontSize: 9,
              fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.18em",
            }}>
              🍦 あいぱく BGM — 昭和レトロ × アイスクリーム
            </p>
            <div className="flex items-center gap-2">
              {["#F5E6C8", "#5DB89A", "#D65076"].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: i > 0 ? `0 0 5px ${c}` : "none", opacity: i === 0 ? 0.5 : 1 }} />
              ))}
            </div>
          </div>

          {/* 下部ゴールドライン */}
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #C8860A 30%, #E6A820 50%, #C8860A 70%, transparent)" }} />
        </div>
      </div>
    </>
  );
}
