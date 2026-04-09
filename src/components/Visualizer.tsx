"use client";

import { useEffect, useRef } from "react";

type Props = {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  colorTop?: string;
  colorBot?: string;
};

export default function Visualizer({
  analyserRef,
  isPlaying,
  barCount = 48,
  height = 72,
  colorTop = "#C8860A",
  colorBot = "#8B5E00",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  // 各バーの現在の高さ（スムージング用）
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

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      const analyser = analyserRef.current;
      const totalBarW = W / barCount;
      const barW = Math.max(2, totalBarW * 0.65);
      const gap = totalBarW - barW;

      if (!analyser || !isPlaying) {
        // アイドル状態：小さな波打つバー
        for (let i = 0; i < barCount; i++) {
          const idleH = 3 + Math.sin(Date.now() * 0.002 + i * 0.4) * 1.5;
          heightsRef.current[i] += (idleH - heightsRef.current[i]) * 0.12;
          const h = heightsRef.current[i];
          const x = gap / 2 + i * totalBarW;
          ctx.fillStyle = colorBot + "55";
          ctx.beginPath();
          ctx.roundRect(x, H - h, barW, h, 1);
          ctx.fill();
        }
        return;
      }

      const bufferLength = analyser.frequencyBinCount; // fftSize/2 = 64
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // 低域〜中域を重点的にマッピング（高域は聴感上少なめ）
      const step = Math.floor(bufferLength * 0.7 / barCount);

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        const start = Math.floor(i * (bufferLength * 0.75 / barCount));
        for (let j = 0; j < Math.max(1, step); j++) {
          sum += dataArray[Math.min(start + j, bufferLength - 1)] ?? 0;
        }
        const avg = sum / Math.max(1, step);
        // 感度ブースト：低い値でもバーが立つように
        const rawH = Math.pow(avg / 255, 0.7) * H * 0.9;
        const targetH = Math.max(3, rawH);
        // 上がるのは速く、下がるのはゆっくり（リアルVU動作）
        const ease = rawH > heightsRef.current[i] ? 0.35 : 0.1;
        heightsRef.current[i] += (targetH - heightsRef.current[i]) * ease;
        const barH = heightsRef.current[i];

        const x = gap / 2 + i * totalBarW;

        // グラデーションバー
        const grad = ctx.createLinearGradient(0, H - barH, 0, H);
        grad.addColorStop(0, colorTop + "EE");
        grad.addColorStop(0.6, colorBot + "CC");
        grad.addColorStop(1, colorBot + "66");
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.roundRect(x, H - barH, barW, barH, [2, 2, 1, 1]);
        ctx.fill();

        // ハイライト（バー頂点の白い光）
        if (barH > 10) {
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.beginPath();
          ctx.roundRect(x, H - barH, barW, Math.min(4, barH * 0.2), [2, 2, 0, 0]);
          ctx.fill();
        }
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef, isPlaying, barCount, height, colorTop, colorBot]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: `${height}px`, display: "block" }}
    />
  );
}
