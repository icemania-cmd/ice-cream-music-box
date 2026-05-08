import { NextRequest, NextResponse } from "next/server";

export interface LrcLine {
  time: number; // 秒（小数含む）
  text: string;
}

/** LRC文字列を {time, text}[] にパース */
function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
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

/** ファイル名を正規化してバリエーションリストを返す（マッチ優先度順） */
function lrcCandidates(name: string): string[] {
  const seen = new Set<string>();
  const add = (s: string) => { const t = s.trim(); if (t) seen.add(t); };

  add(name);
  // 〜サブタイトル〜 を除去
  const noSub = name.replace(/〜[^〜]+〜/g, "").trim();
  add(noSub);
  // （V5）など全角バージョン表記を除去
  const noVer = name.replace(/\s*（[Vv]\d+[^）]*）/g, "").trim();
  add(noVer);
  // 半角 (V5) も除去
  const noVerH = name.replace(/\s*\([Vv]\d+[^)]*\)/g, "").trim();
  add(noVerH);
  // 両方除去
  const bare = name.replace(/〜[^〜]+〜/g, "").replace(/\s*（[Vv]\d+[^）]*）/g, "").replace(/\s*\([Vv]\d+[^)]*\)/g, "").trim();
  add(bare);

  return [...seen];
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

  // 候補ファイル名を順番に試す
  for (const candidate of lrcCandidates(decoded)) {
    const lrcUrl = `${r2Base}/lyrics/${encodeURIComponent(candidate)}.lrc`;
    try {
      const res = await fetch(lrcUrl, { cache: "no-store" });
      if (!res.ok) continue;
      const text = await res.text();
      const lines = parseLrc(text);
      if (lines.length === 0) continue;
      return NextResponse.json({ lines }, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
