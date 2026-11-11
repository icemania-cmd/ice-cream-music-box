"use client";

import { useEffect, useRef, useState } from "react";

/** 音声とのズレがこれ（秒）を超えたら動画の再生位置を合わせ直す */
const MAX_DRIFT_SEC = 0.3;
/** 再生位置がこれ（秒）未満で停止中なら「再生前」とみなしてカバーを出す */
const COVER_UNTIL_SEC = 0.5;
const PLAY_BUTTON_SIZE = 64;

type Props = {
  src: string;
  coverSrc: string | null; // キービジュアル（再生前に表示）
  isPlaying: boolean;
  elapsed: number; // 音声の再生位置（秒）
  onClick: () => void; // 動画部分タップ（再生画面を開く）
  onPlay: () => void; // カバー上の再生ボタン
};

/**
 * MV表示。音はプレイヤー（useAudioEngine）が鳴らすので動画は常にミュートし、
 * 再生・一時停止・再生位置を音声に追従させる。
 * 再生前はキービジュアルと再生ボタンを重ねて表示する。
 */
export default function MvPlayer({ src, coverSrc, isPlaying, elapsed, onClick, onPlay }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = !isPlaying && elapsed < COVER_UNTIL_SEC;
  const hasCover = !!coverSrc && !coverFailed;

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
    <div
      style={{
        position: "relative",
        width: "min(520px, calc(100vw - 32px))",
        aspectRatio: "16 / 9",
        borderRadius: 10,
        overflow: "hidden",
        background: "#000",
        border: "2px solid rgba(255,220,150,0.35)",
        boxShadow: "0 6px 24px rgba(0,0,0,0.55)",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="MVを表示中（タップで再生画面を開く）"
        style={{ display: "block", width: "100%", height: "100%", padding: 0, border: 0, background: "transparent", cursor: "pointer" }}
      >
        <video
          ref={videoRef}
          src={src}
          poster={hasCover ? coverSrc : undefined}
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
      </button>

      {/* キービジュアル（再生が始まるとフェードアウト） */}
      {hasCover && (
        // eslint-disable-next-line @next/next/no-img-element -- R2 の外部画像を1枚出すだけなので next/image は使わない
        <img
          src={coverSrc}
          alt="MVのキービジュアル"
          onError={() => setCoverFailed(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", pointerEvents: "none",
            opacity: showCover ? 1 : 0, transition: "opacity 0.6s ease",
          }}
        />
      )}

      {showCover && (
        <button
          type="button"
          onClick={onPlay}
          aria-label="MVを再生"
          className="transition-transform hover:scale-110 active:scale-95"
          style={{
            position: "absolute", top: "50%", left: "50%",
            width: PLAY_BUTTON_SIZE, height: PLAY_BUTTON_SIZE,
            marginTop: -PLAY_BUTTON_SIZE / 2, marginLeft: -PLAY_BUTTON_SIZE / 2,
            borderRadius: "50%", border: "2px solid rgba(255,255,255,0.9)",
            background: "rgba(214,80,118,0.88)",
            boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" style={{ marginLeft: 4 }}>
            <path d="M6 4l14 8-14 8z" fill="#fff" />
          </svg>
        </button>
      )}

      <span style={{
        position: "absolute", top: 8, left: 8, pointerEvents: "none",
        fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
        color: "#fff", background: "rgba(214,80,118,0.9)",
        padding: "2px 8px", borderRadius: 4,
      }}>
        MV
      </span>
    </div>
  );
}
