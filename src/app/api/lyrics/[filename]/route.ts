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
