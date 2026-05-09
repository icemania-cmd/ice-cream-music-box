import { NextRequest, NextResponse } from "next/server";
import { loadTracksServer, writeTrackMeta, TrackMeta } from "@/lib/trackLoader";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createR2Client, R2_BUCKET, isR2Enabled } from "@/lib/r2";

/** ファイル名からバージョン・サブタイトルを除いた正規化名を返す */
function normalizeName(name: string): string {
  return name
    .replace(/〜[^〜]+〜/g, "")
    .replace(/\s*（[Vv]\d+[^）]*）/g, "")
    .replace(/\s*\([Vv]\d+[^)]*\)/g, "")
    .replace(/\s*_v\d+(\.\d+)?$/gi, "")
    .trim();
}

/** R2の lyrics/ フォルダにある LRC ファイルの正規化名セットを取得 */
async function getLyricsNormalizedSet(): Promise<Set<string>> {
  if (!isR2Enabled()) return new Set();
  try {
    const s3 = createR2Client();
    const result = await s3.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET(), Prefix: "lyrics/" })
    );
    const names = (result.Contents ?? [])
      .map((o) => o.Key ?? "")
      .filter((k) => k.endsWith(".lrc"))
      .map((k) => normalizeName(k.replace(/^lyrics\//, "").replace(/\.lrc$/, "")));
    return new Set(names);
  } catch {
    return new Set();
  }
}

/** GET /api/tracks — 環境に応じてR2またはローカルから曲一覧を返す */
export async function GET() {
  const [tracks, lyricsSet] = await Promise.all([
    loadTracksServer(),
    getLyricsNormalizedSet(),
  ]);

  const result = tracks.map((t) => ({
    ...t,
    hasLyrics:
      lyricsSet.size > 0
        ? lyricsSet.has(normalizeName(t.filename.replace(/\.[^.]+$/, "")))
        : undefined,
  }));

  return NextResponse.json(result);
}

/** PATCH /api/tracks — 1曲分のメタデータを更新（ローカル開発専用） */
export async function PATCH(req: NextRequest) {
  // 本番環境ではローカルファイルシステムが存在しないため無効
  if (process.env.NEXT_PUBLIC_R2_URL) {
    return NextResponse.json(
      { error: "Metadata editing is not available in production" },
      { status: 403 }
    );
  }

  const body = await req.json() as { filename: string } & Partial<TrackMeta>;
  const { filename, ...data } = body;
  if (!filename) {
    return NextResponse.json({ error: "filename required" }, { status: 400 });
  }
  writeTrackMeta(filename, data);
  return NextResponse.json({ ok: true });
}
