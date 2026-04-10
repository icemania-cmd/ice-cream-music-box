"use client";

import { useEffect, useRef } from "react";

type Props = {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  // 後方互換のため残すが使用しない
  colorTop?: string;
  colorBot?: string;
};

// セグメント1個の高さ（px）
const SEG_H = 3;
// セグメント間の隙間（px）
const SEG_GAP = 1;
// セグメント1ユニットの高さ合計
const SEG_UNIT = SEG_H + SEG_GAP;

export default function Visualizer({
  analyserRef,
  isPlaying,
  barCount = 52,
  height = 60,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const heightsRef = useRef<Float32Array>(new Float32Array(barCount));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const totalSegments = Math.floor(H / SEG_UNIT);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      const analyser = analyserRef.current;
      const totalBarW = W / barCount;
      // バー幅：隙間を確保してセグメントを際立たせる
      const barW = Math.max(2, totalBarW * 0.72);
      const gap = totalBarW - barW;

      if (!analyser || !isPlaying) {
        // アイドル：低い波打ち
        for (let i = 0; i < barCount; i++) {
          const idleH = 3 + Math.sin(Date.now() * 0.002 + i * 0.4) * 1.5;
          heightsRef.current[i] += (idleH - heightsRef.current[i]) * 0.12;
          const barH = heightsRef.current[i];
          const x = gap / 2 + i * totalBarW;
          const segs = Math.floor(barH / SEG_UNIT);
          for (let s = 0; s < segs; s++) {
            const y = H - (s + 1) * SEG_UNIT;
            ctx.fillStyle = "rgba(0, 180, 220, 0.25)";
            ctx.fillRect(x, y, barW, SEG_H);
          }
        }
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const step = Math.floor(bufferLength * 0.7 / barCount);

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        const start = Math.floor(i * (bufferLength * 0.75 / barCount));
        for (let j = 0; j < Math.max(1, step); j++) {
          sum += dataArray[Math.min(start + j, bufferLength - 1)] ?? 0;
        }
        const avg = sum / Math.max(1, step);
        const rawH = Math.pow(avg / 255, 0.7) * H * 0.92;
        const targetH = Math.max(SEG_UNIT, rawH);
        const ease = rawH > heightsRef.current[i] ? 0.38 : 0.10;
        heightsRef.current[i] += (targetH - heightsRef.current[i]) * ease;
        const barH = heightsRef.current[i];

        const x = gap / 2 + i * totalBarW;
        const activeSeg = Math.floor(barH / SEG_UNIT);

        for (let s = 0; s < activeSeg && s < totalSegments; s++) {
          // セグメントのy位置（下から積み上げ）
          const y = H - (s + 1) * SEG_UNIT;
          // 0=底面, 1=頂点
          const ratio = s / Math.max(1, activeSeg - 1);

          // 水色グラデーション：底は深い水色、上にいくほど明るい水色→白みがかった水色
          let r: number, g: number, b: number, a: number;
          if (ratio < 0.6) {
            // 底〜中間：#0080CC → #00C8FF
            const t = ratio / 0.6;
            r = Math.round(0 + 0 * t);
            g = Math.round(128 + (200 - 128) * t);
            b = Math.round(204 + (255 - 204) * t);
            a = 0.75 + 0.15 * t;
          } else {
            // 中間〜頂点：#00C8FF → #80EEFF（白みがかった水色）
            const t = (ratio - 0.6) / 0.4;
            r = Math.round(0 + 128 * t);
            g = Math.round(200 + (238 - 200) * t);
            b = Math.round(255);
            a = 0.90 + 0.10 * t;
          }

          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fillRect(x, y, barW, SEG_H);

          // 頂点付近のセグメントにハイライト（白い光）
          if (s >= activeSeg - 2 && activeSeg > 3) {
            ctx.fillStyle = `rgba(255,255,255,${0.28 * (s === activeSeg - 1 ? 1 : 0.5)})`;
            ctx.fillRect(x, y, barW, SEG_H);
          }
        }
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef, isPlaying, barCount, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: `${height}px`, display: "block" }}
    />
  );
}
