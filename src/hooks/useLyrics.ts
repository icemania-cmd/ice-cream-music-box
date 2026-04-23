"use client";

import { useEffect, useState, useRef } from "react";
import type { LrcLine } from "@/app/api/lyrics/[filename]/route";

export type { LrcLine };
export type LyricsStatus = "loading" | "ready" | "not_found" | "error";

export interface UseLyricsResult {
  lines: LrcLine[];
  currentIndex: number;
  status: LyricsStatus;
}

/**
 * filename: 拡張子なしのベース名 (例: "track001")
 * currentTime: 再生位置（秒）
 */
export function useLyrics(filename: string, currentTime: number): UseLyricsResult {
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [status, setStatus] = useState<LyricsStatus>("loading");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);

  // filenameが変わったらLRCを再取得
  useEffect(() => {
    if (!filename) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setLines([]);
    setCurrentIndex(-1);

    fetch(`/api/lyrics/${encodeURIComponent(filename)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) { setStatus("not_found"); return; }
        return res.json() as Promise<{ lines: LrcLine[] }>;
      })
      .then((data) => {
        if (!data) return;
        setLines(data.lines);
        setStatus("ready");
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [filename]);

  // currentTimeが変わるたびに現在行を更新
  useEffect(() => {
    if (status !== "ready" || lines.length === 0) return;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime) idx = i;
      else break;
    }
    setCurrentIndex(idx);
  }, [currentTime, lines, status]);

  return { lines, currentIndex, status };
}
