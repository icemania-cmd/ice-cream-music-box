# 歌詞機能 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 各楽曲にLRC形式の歌詞を追加し、再生位置に同期してApple Musicスタイルで表示する

**Architecture:** R2の `lyrics/` フォルダに置いたLRCファイルをAPIルート経由で取得・パース。`useLyrics` フックを `MusicPlayer` で一度だけ呼び、取得済みの `lines/currentIndex/status` をボタン表示と `LyricsModal` の両方に props として渡す（二重フェッチを防ぐ）。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Cloudflare R2（公開URL経由fetch）

---

## ファイル構成

| 操作 | パス | 役割 |
|------|------|------|
| 新規作成 | `src/app/api/lyrics/[filename]/route.ts` | R2からLRC取得・パース・JSON返却 |
| 新規作成 | `src/hooks/useLyrics.ts` | LRC取得・再生位置同期フック |
| 新規作成 | `src/components/LyricsModal.tsx` | フルスクリーン歌詞モーダルUI（表示のみ、フェッチなし） |
| 修正 | `src/components/MusicPlayer.tsx` | useLyrics呼び出し・歌詞ボタン追加・LyricsModal組み込み |

---

## Task 1: 歌詞APIルート

**Files:**
- Create: `src/app/api/lyrics/[filename]/route.ts`

LRC形式: `[mm:ss.xx]歌詞テキスト`（例: `[00:12.34]好きなんだ〜`）

- [ ] **Step 1: ファイルを作成する**

`src/app/api/lyrics/[filename]/route.ts` を以下の内容で作成：

```typescript
import { NextRequest, NextResponse } from "next/server";

export interface LrcLine {
  time: number; // 秒（小数含む）
  text: string;
}

/** LRC文字列を {time, text}[] にパース */
function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const raw of lrc.split("\n")) {
    const match = raw.match(/^\[(\d{1,2}):(\d{2})\.(\d{1,3})\](.*)$/);
    if (!match) continue;
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const ms = parseInt(match[3].padEnd(3, "0"), 10);
    const text = match[4].trim();
    if (!text) continue;
    lines.push({ time: min * 60 + sec + ms / 1000, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const r2Base = process.env.NEXT_PUBLIC_R2_URL;

  if (!r2Base) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const lrcUrl = `${r2Base}/lyrics/${encodeURIComponent(decoded)}.lrc`;
  try {
    const res = await fetch(lrcUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const text = await res.text();
    const lines = parseLrc(text);
    if (lines.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ lines }, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
```

- [ ] **Step 2: ビルドが通ることを確認する**

```bash
npm run build
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/app/api/lyrics/[filename]/route.ts
git commit -m "feat: 歌詞APIルート追加 - R2からLRC取得・パース"
```

---

## Task 2: useLyricsフック

**Files:**
- Create: `src/hooks/useLyrics.ts`

- [ ] **Step 1: ファイルを作成する**

`src/hooks/useLyrics.ts` を以下の内容で作成：

```typescript
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
```

- [ ] **Step 2: ビルドが通ることを確認する**

```bash
npm run build
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/hooks/useLyrics.ts
git commit -m "feat: useLyricsフック追加 - LRC取得・再生位置同期"
```

---

## Task 3: LyricsModalコンポーネント

**Files:**
- Create: `src/components/LyricsModal.tsx`

このコンポーネントは**フェッチを行わない**。`lines/currentIndex/status` をすべて props で受け取り、表示に専念する。

- [ ] **Step 1: ファイルを作成する**

`src/components/LyricsModal.tsx` を以下の内容で作成：

```typescript
"use client";

import { useEffect, useRef } from "react";
import type { LrcLine, LyricsStatus } from "@/hooks/useLyrics";

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  lines: LrcLine[];
  currentIndex: number;
  status: LyricsStatus;
  currentTime: number; // 秒
  duration: number;    // 秒
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LyricsModal({
  isOpen, onClose, trackTitle,
  lines, currentIndex, status,
  currentTime, duration,
}: LyricsModalProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  // 現在行が変わったら中央にスクロール
  useEffect(() => {
    if (!isOpen || currentIndex < 0) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex, isOpen]);

  // ESCキーで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "linear-gradient(160deg, #0a0a14 0%, #12060e 100%)",
        display: "flex", flexDirection: "column",
        fontFamily: "var(--font-mplus), 'M PLUS Rounded 1c', sans-serif",
      }}
    >
      {/* ヘッダー */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid rgba(214,80,118,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ color: "#D65076", fontSize: 10, letterSpacing: "0.2em", marginBottom: 2 }}>
            ♪ LYRICS
          </p>
          <p style={{
            color: "#ddd", fontSize: 13, fontWeight: 700,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {trackTitle}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: "50%", width: 32, height: 32,
            color: "#aaa", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 12,
          }}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>

      {/* 歌詞エリア */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1, overflowY: "auto",
          padding: "40px 24px",
          scrollbarWidth: "none",
        }}
      >
        {status === "loading" && (
          <div style={{ textAlign: "center", color: "#444", paddingTop: 60 }}>
            <p style={{ fontSize: 14 }}>読み込み中…</p>
          </div>
        )}

        {(status === "not_found" || status === "error") && (
          <div style={{
            textAlign: "center", paddingTop: 60,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>🎵</span>
            <p style={{ fontSize: 14, color: "#555" }}>歌詞準備中</p>
            <p style={{ fontSize: 12, color: "#333" }}>もうしばらくお待ちください</p>
          </div>
        )}

        {status === "ready" && (
          <>
            {/* 上フェード */}
            <div style={{
              position: "sticky", top: 0, height: 60, pointerEvents: "none",
              background: "linear-gradient(180deg, #0a0a14, transparent)",
              marginBottom: -60, zIndex: 1,
            }} />

            {lines.map((line, i) => {
              const isActive = i === currentIndex;
              const isPast = i < currentIndex;
              return (
                <div
                  key={i}
                  ref={isActive ? activeRef : undefined}
                  style={{
                    textAlign: "center",
                    padding: isActive ? "12px 0" : "5px 0",
                    fontSize: isActive ? 22 : isPast ? 13 : 14,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#ffffff" : isPast ? "#3a3a3a" : "#555",
                    textShadow: isActive
                      ? "0 0 24px rgba(214,80,118,0.7), 0 0 48px rgba(214,80,118,0.3)"
                      : "none",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    lineHeight: 1.6,
                  }}
                >
                  {line.text}
                </div>
              );
            })}

            {/* 下フェード */}
            <div style={{
              position: "sticky", bottom: 0, height: 60, pointerEvents: "none",
              background: "linear-gradient(0deg, #12060e, transparent)",
              marginTop: -60, zIndex: 1,
            }} />
          </>
        )}
      </div>

      {/* フッター: プログレスバー */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "12px 20px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          borderTop: "1px solid rgba(214,80,118,0.1)",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: "#666", minWidth: 32, fontVariantNumeric: "tabular-nums" }}>
          {fmt(currentTime)}
        </span>
        <div style={{ flex: 1, height: 3, background: "#222", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #D65076, #ff80a0)",
            transition: "width 0.4s linear",
          }} />
        </div>
        <span style={{ fontSize: 11, color: "#666", minWidth: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {fmt(duration)}
        </span>
      </div>

      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
```

- [ ] **Step 2: ビルドが通ることを確認する**

```bash
npm run build
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/components/LyricsModal.tsx
git commit -m "feat: LyricsModalコンポーネント追加 - Apple Musicスタイル歌詞表示"
```

---

## Task 4: MusicPlayerに歌詞ボタン・モーダルを統合

**Files:**
- Modify: `src/components/MusicPlayer.tsx`

`useLyrics` を1回だけ呼び出し、その結果をボタンと `LyricsModal` の両方に渡す。

- [ ] **Step 1: importを2行追加する**

`MusicPlayer.tsx` 先頭の既存import群末尾に追記：

```typescript
import LyricsModal from "./LyricsModal";
import { useLyrics } from "@/hooks/useLyrics";
```

- [ ] **Step 2: stateとフック呼び出しを追加する**

`MusicPlayer` 内の `const [showNowPlaying, setShowNowPlaying] = useState(false);` の直下に追加：

```typescript
const [showLyrics, setShowLyrics] = useState(false);
const lyricsFilename = track.filename.replace(/\.[^.]+$/, "");
const { lines: lyricsLines, currentIndex: lyricsIndex, status: lyricsStatus } = useLyrics(lyricsFilename, elapsed);
```

- [ ] **Step 3: 歌詞ボタンをUIに追加する**

`MusicPlayer.tsx` 内の `{/* シェアボタン */}` コメントの**直上**に追加：

```typescript
{/* 歌詞ボタン */}
<button
  onClick={() => setShowLyrics(true)}
  style={{
    width: "100%",
    padding: "9px 0",
    borderRadius: 20,
    border: lyricsStatus === "ready"
      ? "1.5px solid rgba(214,80,118,0.5)"
      : "1.5px solid rgba(139,106,74,0.2)",
    background: lyricsStatus === "ready"
      ? "linear-gradient(135deg, #D65076, #c04068)"
      : "rgba(61,43,26,0.04)",
    color: lyricsStatus === "ready" ? "#fff" : "#8B6A4A",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    boxShadow: lyricsStatus === "ready"
      ? "0 3px 12px rgba(214,80,118,0.35)"
      : "none",
    transition: "all 0.3s ease",
    fontFamily: "var(--font-mplus), 'M PLUS Rounded 1c', sans-serif",
  }}
>
  ♪ {lyricsStatus === "ready" ? "歌詞" : "歌詞準備中"}
</button>
```

- [ ] **Step 4: LyricsModalをJSXに追加する**

`return (` の直後にある `{showNowPlaying && <NowPlayingModal .../>}` の**直下**に追加：

```typescript
<LyricsModal
  isOpen={showLyrics}
  onClose={() => setShowLyrics(false)}
  trackTitle={track.title}
  lines={lyricsLines}
  currentIndex={lyricsIndex}
  status={lyricsStatus}
  currentTime={elapsed}
  duration={duration}
/>
```

- [ ] **Step 5: ビルドが通ることを確認する**

```bash
npm run build
```

期待: エラーなし

- [ ] **Step 6: コミットしてプッシュする**

```bash
git add src/components/MusicPlayer.tsx
git commit -m "feat: 歌詞ボタンをMusicPlayerに追加・LyricsModal統合"
git push origin main
```

---

## Task 5: 本番動作確認

- [ ] **Step 1: 開発環境でモーダル動作を確認する**

```bash
npm run dev
```

確認項目:
1. `http://localhost:3000` を開く
2. 歌詞ボタンが「♪ 歌詞準備中」（グレー）で表示されること（開発環境はR2未接続のため正常）
3. ボタンをタップ → モーダルが開き「歌詞準備中」表示されること
4. × ボタンまたは背景タップでモーダルが閉じること
5. ESCキーで閉じること
6. 曲を切り替えてもボタンが正常表示されること

- [ ] **Step 2: R2にサンプルLRCをアップロードして本番確認する**

R2バケットの `lyrics/` フォルダに1曲分のLRCをアップロード（ファイル名は音声ファイルと同じベース名 + `.lrc`）：

```
[00:00.00]（イントロ）
[00:12.34]アイスクリームが好きなんだ
[00:15.80]溶けちゃう前に食べなきゃね
[00:19.20]🍦 夏の日のアイスクリーム
[00:22.50]君と食べるのが一番さ
```

Vercelデプロイ後に確認:
1. 該当曲でボタンがピンク「♪ 歌詞」に変わること
2. タップ → モーダル開くこと
3. 再生位置に合わせて現在行がハイライト・スクロールすること
4. LRCなし曲は「♪ 歌詞準備中」グレーのままであること
