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

  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const ctxRef        = useRef<AudioContext | null>(null);
  const analyserRef   = useRef<AnalyserNode | null>(null);
  const gainNodeRef   = useRef<GainNode | null>(null);
  const volumeRef     = useRef(0.7); // GainNode作成前のボリューム値を保持
  const sourceConnectedRef = useRef(false);
  const shuffleOrderRef    = useRef<number[]>([]);

  // 毎レンダーで最新値を保持するref群
  const currentIndexRef = useRef(currentIndex);
  const shuffleRef      = useRef(shuffle);
  const repeatRef       = useRef(repeat);
  const tracksRef       = useRef(tracks);

  currentIndexRef.current = currentIndex;
  shuffleRef.current      = shuffle;
  repeatRef.current       = repeat;
  tracksRef.current       = tracks;

  /**
   * ユーザーの「再生したい」意図を追跡するref
   * true  = ユーザーはpause状態を望んでいる（初期値）
   * false = ユーザーはplay状態を望んでいる
   *
   * play()/pause()で同期的に書き換えることで、
   * Promiseの非同期コールバックから参照したときに
   * 最新の意図を取得できる
   */
  const wantsPausedRef = useRef(true);

  /**
   * 現在保留中の audio.play() Promise
   * pause()から「play()解決後にpause()する」ために参照する
   * （Chromeのバグ: play()解決前にpause()を呼んでも効かないことがある）
   */
  const pendingPlayRef = useRef<Promise<void> | null>(null);

  // ──────────────────────────────────────────
  // 内部ヘルパー: audio.play()を安全に実行
  // ──────────────────────────────────────────
  const startPlay = useCallback((audio: HTMLAudioElement) => {
    wantsPausedRef.current = false;
    const promise = audio.play();
    pendingPlayRef.current = promise;
    promise
      .then(() => {
        pendingPlayRef.current = null;
        if (wantsPausedRef.current) {
          // play()が解決した時点でユーザーはpauseを望んでいた → 即座にpause
          audio.pause();
        } else {
          setIsPlaying(true);
        }
      })
      .catch(() => {
        pendingPlayRef.current = null;
      });
  }, []);

  // ──────────────────────────────────────────
  // 内部ヘルパー: audio.pause()を安全に実行
  // ──────────────────────────────────────────
  const stopPlay = useCallback((audio: HTMLAudioElement) => {
    wantsPausedRef.current = true;
    setIsPlaying(false);

    if (pendingPlayRef.current) {
      // play()がまだ解決していない場合、解決後にpauseする
      // （play()解決前のpause()呼び出しはChromeで無視されることがある）
      pendingPlayRef.current.then(() => {
        if (wantsPausedRef.current) audio.pause();
      }).catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  // ──────────────────────────────────────────
  // AudioContext の自動再開（スクロール等で停止した場合）
  // ──────────────────────────────────────────
  const resumeCtx = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }, []);

  /**
   * iOS / Android でバックグラウンド（画面ロック・アプリ切替）から復帰した際に
   * AudioContext と audio 要素を再開する
   */
  const resumeOnForeground = useCallback(() => {
    resumeCtx();
    const audio = audioRef.current;
    // AudioContextの停止に引っ張られてaudio自体が止まっていたら再開
    if (audio && !wantsPausedRef.current && audio.paused) {
      const p = audio.play();
      if (p) {
        pendingPlayRef.current = p;
        p.then(() => {
          pendingPlayRef.current = null;
          if (!wantsPausedRef.current) setIsPlaying(true);
          else audio.pause();
        }).catch(() => { pendingPlayRef.current = null; });
      }
    }
  }, [resumeCtx]);

  // ──────────────────────────────────────────
  // AnalyserNode 遅延初期化
  // ──────────────────────────────────────────
  const ensureAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceConnectedRef.current) return;

    // iOS Safari: Web Audio API を使うと画面ロック時に音声が止まる
    // iOSではAudioContextをスキップしてHTML5 audioで直接再生
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) return;

    try {
      type WinWithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };
      const AC = window.AudioContext || (window as WinWithWebkit).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();

      // スクロールや画面操作でブラウザがAudioContextを自動停止した場合に即再開
      ctx.onstatechange = () => {
        if (ctx.state === "suspended" && !wantsPausedRef.current) {
          ctx.resume().catch(() => {});
        }
      };

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      const gain = ctx.createGain();
      // 既にボリュームがブースト状態なら即適用
      gain.gain.value = Math.max(1, volumeRef.current);
      const source = ctx.createMediaElementSource(audio);
      source.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current        = ctx;
      analyserRef.current   = analyser;
      gainNodeRef.current   = gain;
      sourceConnectedRef.current = true;
    } catch {
      // 失敗しても再生は続ける
    }
  }, []);

  // ──────────────────────────────────────────
  // Audio要素の初期化（マウント時1回）
  // ──────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.volume    = 0.7;
    audio.preload   = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);

    const onEnded = () => {
      // ユーザーがpause状態を望んでいれば次曲へ進まない
      if (wantsPausedRef.current) {
        setProgress(1);
        return;
      }

      const currentTracks = tracksRef.current;
      const ci = currentIndexRef.current;
      const nextIdx = getNextIndex(
        ci, currentTracks.length,
        shuffleRef.current, repeatRef.current, shuffleOrderRef.current
      );

      // 次曲なし（repeatなし・最終曲）
      if (nextIdx === null) {
        wantsPausedRef.current = true;
        setIsPlaying(false);
        setProgress(1);
        return;
      }

      setCurrentIndex(nextIdx);
      currentIndexRef.current = nextIdx;
      const nextTrack = currentTracks[nextIdx];
      audio.src = getAudioUrl(nextTrack.filename);
      audio.currentTime = 0;
      setProgress(0);
      setPlayCounts((prev) => ({ ...prev, [nextTrack.id]: (prev[nextTrack.id] ?? 0) + 1 }));

      // まだplay意図があるなら再生
      if (!wantsPausedRef.current) {
        startPlay(audio);
      }
    };

    audio.addEventListener("timeupdate",    onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended",          onEnded);
    audio.src = getAudioUrl(tracksRef.current[0].filename);

    // ─────────────────────────────────────────────────────
    // スクロール・タッチ・画面復帰時にAudioContextを再開する
    // モバイルブラウザはスクロール中にAudioContextを自動停止することがある
    // ─────────────────────────────────────────────────────
    // playsInline: iOS Safariでバックグラウンド再生を許可
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("x-webkit-airplay", "allow");

    const handleResume = () => resumeCtx();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // フォアグラウンド復帰時: AudioContext + audio を再開
        resumeOnForeground();
      }
    };

    document.addEventListener("scroll",           handleResume,     { passive: true });
    document.addEventListener("touchstart",        handleResume,     { passive: true });
    document.addEventListener("touchend",          handleResume,     { passive: true });
    document.addEventListener("visibilitychange",  handleVisibility);

    return () => {
      audio.removeEventListener("timeupdate",    onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended",          onEnded);
      audio.pause();
      audio.src = "";
      ctxRef.current?.close();

      document.removeEventListener("scroll",           handleResume);
      document.removeEventListener("touchstart",        handleResume);
      document.removeEventListener("touchend",          handleResume);
      document.removeEventListener("visibilitychange",  handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const track = tracks[currentIndex];

  // ──────────────────────────────────────────
  // 公開API
  // ──────────────────────────────────────────
  const play = useCallback(() => {
    ensureAnalyser();
    const audio = audioRef.current;
    if (!audio) return;
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    startPlay(audio);
  }, [ensureAnalyser, startPlay]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    stopPlay(audio);
  }, [stopPlay]);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }, []);

  const changeVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(v, 2));
    setVolume(clamped);
    volumeRef.current = clamped;
    if (audioRef.current) {
      // HTML5 audio.volume は 0-1 の範囲。1を超える分はGainNodeで増幅
      audioRef.current.volume = Math.min(clamped, 1);
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.max(1, clamped);
    }
  }, []);

  const selectTrack = useCallback(
    (idx: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      setCurrentIndex(idx);
      currentIndexRef.current = idx;
      const t = tracks[idx];

      // 新しいsrcをセットする前にpending playを無効化
      wantsPausedRef.current = true;
      if (pendingPlayRef.current) {
        pendingPlayRef.current.then(() => audio.pause()).catch(() => {});
      }

      audio.src = getAudioUrl(t.filename);
      audio.currentTime = 0;
      setProgress(0);
      setDuration(0);

      // 曲を選択したら常に再生開始（停止中でも同様）
      ensureAnalyser();
      if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
      startPlay(audio);
      setPlayCounts((prev) => ({ ...prev, [t.id]: (prev[t.id] ?? 0) + 1 }));
    },
    [tracks, ensureAnalyser, startPlay]
  );

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

  const next = useCallback(() => {
    const ci = currentIndexRef.current;
    const nextIdx = getNextIndex(
      ci, tracksRef.current.length,
      shuffleRef.current, repeatRef.current, shuffleOrderRef.current
    );
    if (nextIdx !== null) selectTrack(nextIdx);
  }, [selectTrack]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; setProgress(0); return; }
    const prevIdx = getPrevIndex(
      currentIndexRef.current, tracksRef.current.length,
      shuffleRef.current, shuffleOrderRef.current
    );
    selectTrack(prevIdx);
  }, [selectTrack]);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      const n = !s;
      if (n) buildShuffleOrder(currentIndexRef.current);
      return n;
    });
  }, [buildShuffleOrder]);

  const toggleRepeat = useCallback(() => {
    setRepeat((r) => r === "none" ? "all" : r === "all" ? "one" : "none");
  }, []);

  const reloadTracks = useCallback((newTracks: Track[]) => {
    if (newTracks.length === 0) return;
    setTracks(newTracks);
    const currentFilename = tracksRef.current[currentIndexRef.current]?.filename;
    const newIdx = newTracks.findIndex((t) => t.filename === currentFilename);
    if (newIdx >= 0) {
      setCurrentIndex(newIdx);
      currentIndexRef.current = newIdx;
    } else {
      const audio = audioRef.current;
      if (audio) {
        wantsPausedRef.current = true;
        audio.src = getAudioUrl(newTracks[0].filename);
        audio.currentTime = 0;
      }
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setProgress(0);
      setIsPlaying(false);
    }
  }, []);

  return {
    track, tracks, currentIndex, isPlaying, progress, duration,
    volume, shuffle, repeat, playCounts, analyserRef,
    play, pause, seek, changeVolume, selectTrack, next, prev,
    toggleShuffle, toggleRepeat, reloadTracks,
  };
}

function getNextIndex(
  current: number, total: number,
  shuffle: boolean, repeat: RepeatMode, shuffleOrder: number[]
): number | null {
  if (repeat === "one") return current;
  if (shuffle && shuffleOrder.length > 0) {
    const pos  = shuffleOrder.indexOf(current);
    const next = pos + 1;
    return next >= shuffleOrder.length
      ? (repeat === "all" ? shuffleOrder[0] : null)
      : shuffleOrder[next];
  }
  const next = current + 1;
  return next >= total ? (repeat === "all" ? 0 : null) : next;
}

function getPrevIndex(
  current: number, total: number,
  shuffle: boolean, shuffleOrder: number[]
): number {
  if (shuffle && shuffleOrder.length > 0) {
    const pos = shuffleOrder.indexOf(current);
    return pos <= 0 ? shuffleOrder[shuffleOrder.length - 1] : shuffleOrder[pos - 1];
  }
  return (current - 1 + total) % total;
}
