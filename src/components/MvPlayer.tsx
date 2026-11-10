"use client";

import { useEffect, useRef } from "react";

/** 音声とのズレがこれ（秒）を超えたら動画の再生位置を合わせ直す */
const MAX_DRIFT_SEC = 0.3;

type Props = {
  src: string;
  isPlaying: boolean;
  elapsed: number; // 音声の再生位置（秒）
  onClick: () => void;
};

/**
 * MV表示。音はプレイヤー（useAudioEngine）が鳴らすので動画は常にミュートし、
 * 再生・一時停止・再生位置を音声に追従させる。
 */
export default function MvPlayer({ src, isPlaying, elapsed, onClick }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 再生・一時停止を音声に合わせる
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      // 自動再生がブロックされても音声側は動くので、失敗は無視してよい
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [isPlaying, src]);

  // 再生位置のズレを補正（シーク・曲頭への戻り・バッファ待ちの後など）
  useEffect(() => {
    const v = videoRef.current;
    if (!v || v.readyState < HTMLMediaElement.HAVE_METADATA) return;
    if (Math.abs(v.currentTime - elapsed) > MAX_DRIFT_SEC) {
      v.currentTime = Math.min(elapsed, v.duration || elapsed);
    }
  }, [elapsed]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="MVを表示中（タップで再生画面を開く）"
      style={{
        position: "relative",
        width: "min(520px, calc(100vw - 32px))",
        aspectRatio: "16 / 9",
        borderRadius: 10,
        overflow: "hidden",
        background: "#000",
        border: "2px solid rgba(255,220,150,0.35)",
        boxShadow: "0 6px 24px rgba(0,0,0,0.55)",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onLoadedMetadata={(e) => {
          // 読み込み完了時点の音声位置に合わせる
          e.currentTarget.currentTime = elapsed;
          if (isPlaying) e.currentTarget.play().catch(() => {});
        }}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
      <span style={{
        position: "absolute", top: 8, left: 8,
        fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
        color: "#fff", background: "rgba(214,80,118,0.9)",
        padding: "2px 8px", borderRadius: 4,
      }}>
        MV
      </span>
    </button>
  );
}
