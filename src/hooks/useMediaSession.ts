"use client";

import { useEffect, useRef } from "react";
import { Track } from "@/lib/tracks";

type Props = {
  track: Track;
  isPlaying: boolean;
  duration: number;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (ratio: number) => void;
};

const displayArtist = (a: string) => a === "AI-SONG" ? "ICECREAM SONG" : a;

/**
 * MediaSession API を使ってロック画面・通知バーに再生コントロールを表示する
 * iOS 15+ / Android Chrome で有効
 */
export function useMediaSession({
  track, isPlaying, duration, progress,
  onPlay, onPause, onNext, onPrev, onSeek,
}: Props) {
  // stale closure防止: ハンドラーはrefで保持
  const onPlayRef  = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onNextRef  = useRef(onNext);
  const onPrevRef  = useRef(onPrev);
  const onSeekRef  = useRef(onSeek);
  const durationRef = useRef(duration);

  onPlayRef.current   = onPlay;
  onPauseRef.current  = onPause;
  onNextRef.current   = onNext;
  onPrevRef.current   = onPrev;
  onSeekRef.current   = onSeek;
  durationRef.current = duration;

  // 曲が変わったらロック画面のメタデータを更新
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  track.title,
      artist: displayArtist(track.artist),
      album:  "ICE CREAM MUSIC BOX",
      artwork: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  }, [track]);

  // 再生状態をOSに通知
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // シークバーの位置をOSに通知（ロック画面のプログレスバー）
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!duration || !isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(progress * duration, duration),
      });
    } catch {
      // setPositionState 未対応環境は無視
    }
  }, [progress, duration]);

  // アクションハンドラー登録（マウント時1回）
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play",          () => onPlayRef.current()],
      ["pause",         () => onPauseRef.current()],
      ["nexttrack",     () => onNextRef.current()],
      ["previoustrack", () => onPrevRef.current()],
      ["seekto", (details) => {
        if (details.seekTime != null && durationRef.current > 0) {
          onSeekRef.current(details.seekTime / durationRef.current);
        }
      }],
    ];

    handlers.forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* 未対応は無視 */ }
    });

    return () => {
      handlers.forEach(([action]) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch { /* 無視 */ }
      });
    };
  }, []);
}
