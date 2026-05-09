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

/**
 * 〜 には U+301C (WAVE DASH) と U+FF5E (FULLWIDTH TILDE) の2種類が存在する。
 * 見た目は同じでも別文字なので、両方にマッチするよう明示的に指定する。
 */
// U+301C = 〜, U+FF5E = ～
const WAVE_RE = /[〜～][^〜～]+[〜～]/g;
const WAVE_SEARCH = /[〜～]/;
// （ = U+FF08, ） = U+FF09
const VER_FULL = /\s*[（(][Vv]\d+[^）)]*[）)]/g;
const REMASTER_RE = /\s*[（(](Remastered|Re-?Recording)[^）)]*[）)]/gi;
// 末尾の括弧サフィックスを全除去（（he-v5.5）等の汎用パターン）
const PAREN_SUFFIX = /\s*[（(][^）)]+[）)]\s*$/g;

function stripWave(s: string): string {
  return s.replace(WAVE_RE, "").trim();
}
function stripVer(s: string): string {
  return s.replace(VER_FULL, "").trim();
}
function stripRemaster(s: string): string {
  return s.replace(REMASTER_RE, "").trim();
}
/** 末尾の（...）や(...)サフィックスをすべて除去 */
function stripParenSuffix(s: string): string {
  let prev = "";
  let cur = s;
  while (cur !== prev) { prev = cur; cur = cur.replace(PAREN_SUFFIX, "").trim(); }
  return cur;
}

/** 各単語の先頭を大文字化（Title Case） */
function toTitleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** ファイル名バリエーションを生成（優先度順） */
function lrcCandidates(name: string): string[] {
  const seen = new Set<string>();
  // 元の文字列 + Title Case 版の両方を登録
  const add = (s: string) => {
    const t = s.trim();
    if (!t) return;
    seen.add(t);
    seen.add(toTitleCase(t));
  };

  // macOS NFD（べ=へ+゛）→ NFC（べ=べ）に統一してから候補生成
  name = name.normalize("NFC");
  add(name);
  add(stripWave(name));
  add(stripVer(name));
  add(stripRemaster(name));
  add(stripParenSuffix(name));
  add(stripVer(stripWave(name)));
  add(stripWave(stripVer(name)));
  add(stripRemaster(stripWave(name)));
  add(stripParenSuffix(stripWave(name)));
  add(stripVer(stripRemaster(name)));
  add(stripRemaster(stripVer(name)));
  add(stripVer(stripRemaster(stripWave(name))));
  add(stripRemaster(stripVer(stripWave(name))));
  add(stripParenSuffix(stripWave(name)));

  // 〜 以降を全カット（末尾サブタイトルパターン）
  const waveIdx = name.search(WAVE_SEARCH);
  if (waveIdx > 0) {
    const prefix = name.slice(0, waveIdx).trim();
    add(prefix);
    add(stripVer(prefix));
    add(stripRemaster(prefix));
    add(stripParenSuffix(prefix));
    add(stripVer(stripRemaster(prefix)));
  }

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
