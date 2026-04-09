"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Track, getAudioUrl } from "@/lib/tracks";

export type RepeatMode = "none" | "all" | "one";

export function useAudioEngine(initialTracks: Track[]) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const [playCounts, setPlayCounts] = useState<Record<number, number>>(
    Object.fromEntries(initialTracks.map((t) => [t.id, t.plays]))
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceConnectedRef = useRef(false);
  const shuffleOrderRef = useRef<number[]>([]);
  const currentIndexRef = useRef(currentIndex);
  const isPlayingRef = useRef(isPlaying);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);

  currentIndexRef.current = currentIndex;
  isPlayingRef.current = isPlaying;
  shuffleRef.current = shuffle;
  repeatRef.current = repeat;

  const buildShuffleOrder = useCallback(
    (currentIdx: number) => {
      const arr = tracks.map((_, i) => i).filter((i) => i !== currentIdx);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      arr.unshift(currentIdx);
      shuffleOrderRef.current = arr;
    },
    [tracks]
  );

  // AnalyserNode を遅延初期化（ユーザー操作後に呼ぶ）
  const ensureAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceConnectedRef.current) return;
    try {
      type WinWithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };
      const AC = window.AudioContext || (window as WinWithWebkit).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;       // 64 bins
      analyser.smoothingTimeConstant = 0.78;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      sourceConnectedRef.current = true;
    } catch {
      // 失敗しても再生は続ける
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = "metadata";
    // crossOrigin="anonymous" はR2公開URLがCORSヘッダーを返す場合のみ有効
    // r2.devドメインではCORSが効かないため設定しない（音楽再生を優先）
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      const ci = currentIndexRef.current;
      const nextIdx = getNextIndex(
        ci, tracks.length,
        shuffleRef.current, repeatRef.current, shuffleOrderRef.current
      );
      if (nextIdx === null) { setIsPlaying(false); setProgress(1); return; }
      setCurrentIndex(nextIdx);
      currentIndexRef.current = nextIdx;
      const nextTrack = tracks[nextIdx];
      audio.src = getAudioUrl(nextTrack.filename);
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setProgress(0);
      setPlayCounts((prev) => ({ ...prev, [nextTrack.id]: (prev[nextTrack.id] ?? 0) + 1 }));
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.src = getAudioUrl(tracks[0].filename);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      ctxRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const track = tracks[currentIndex];

  const play = useCallback(() => {
    ensureAnalyser();
    const audio = audioRef.current;
    if (!audio) return;
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [ensureAnalyser]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const selectTrack = useCallback(
    (idx: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const wasPlaying = isPlayingRef.current;
      setCurrentIndex(idx);
      currentIndexRef.current = idx;
      const t = tracks[idx];
      audio.src = getAudioUrl(t.filename);
      audio.currentTime = 0;
      setProgress(0);
      setDuration(0);
      if (wasPlaying) {
        ensureAnalyser();
        if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
        setPlayCounts((prev) => ({ ...prev, [t.id]: (prev[t.id] ?? 0) + 1 }));
      }
    },
    [tracks, ensureAnalyser]
  );

  const next = useCallback(() => {
    const ci = currentIndexRef.current;
    const nextIdx = getNextIndex(ci, tracks.length, shuffleRef.current, repeatRef.current, shuffleOrderRef.current);
    if (nextIdx !== null) selectTrack(nextIdx);
  }, [tracks.length, selectTrack]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; setProgress(0); return; }
    const prevIdx = getPrevIndex(currentIndexRef.current, tracks.length, shuffleRef.current, shuffleOrderRef.current);
    selectTrack(prevIdx);
  }, [tracks.length, selectTrack]);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => { const n = !s; if (n) buildShuffleOrder(currentIndexRef.current); return n; });
  }, [buildShuffleOrder]);

  const toggleRepeat = useCallback(() => {
    setRepeat((r) => r === "none" ? "all" : r === "all" ? "one" : "none");
  }, []);

  /**
   * 曲リストをまるごと入れ替える（フォルダ再スキャン後に呼ぶ）
   * 再生中の曲が新リストに残っていれば継続、なければ先頭に移動
   */
  const reloadTracks = useCallback(
    (newTracks: Track[]) => {
      if (newTracks.length === 0) return;
      setTracks(newTracks);
      // 現在の曲が新リストに存在するか確認
      const currentFilename = tracks[currentIndexRef.current]?.filename;
      const newIdx = newTracks.findIndex((t) => t.filename === currentFilename);
      if (newIdx >= 0) {
        setCurrentIndex(newIdx);
        currentIndexRef.current = newIdx;
      } else {
        // 現在曲が消えた → 先頭へ
        const audio = audioRef.current;
        if (audio) {
          audio.src = getAudioUrl(newTracks[0].filename);
          audio.currentTime = 0;
        }
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        setProgress(0);
        setIsPlaying(false);
      }
    },
    [tracks]
  );

  return {
    track, tracks, currentIndex, isPlaying, progress, duration,
    volume, shuffle, repeat, playCounts, analyserRef,
    play, pause, seek, changeVolume, selectTrack, next, prev,
    toggleShuffle, toggleRepeat, reloadTracks,
  };
}

function getNextIndex(current: number, total: number, shuffle: boolean, repeat: RepeatMode, shuffleOrder: number[]): number | null {
  if (repeat === "one") return current;
  if (shuffle && shuffleOrder.length > 0) {
    const pos = shuffleOrder.indexOf(current);
    const next = pos + 1;
    return next >= shuffleOrder.length ? (repeat === "all" ? shuffleOrder[0] : null) : shuffleOrder[next];
  }
  const next = current + 1;
  return next >= total ? (repeat === "all" ? 0 : null) : next;
}

function getPrevIndex(current: number, total: number, shuffle: boolean, shuffleOrder: number[]): number {
  if (shuffle && shuffleOrder.length > 0) {
    const pos = shuffleOrder.indexOf(current);
    return pos <= 0 ? shuffleOrder[shuffleOrder.length - 1] : shuffleOrder[pos - 1];
  }
  return (current - 1 + total) % total;
}
