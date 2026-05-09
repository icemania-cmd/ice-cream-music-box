/**
 * GET /api/lyrics-index
 * R2 の lyrics/ フォルダを動的にリストし、利用可能なLRCファイルのベース名を返す。
 * 静的な lyrics-index.json の代わりに使用することで、
 * トラックファイル名と LRC ファイル名が多少異なっても正規化マッチができる。
 */
import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createR2Client, R2_BUCKET, isR2Enabled } from "@/lib/r2";

/** ファイル名から バージョン番号・サブタイトルを除いた正規化名を返す */
export function normalizeLyricsName(name: string): string {
  return name
    .replace(/[〜～][^〜～]+[〜～]/g, "")                    // 〜サブタイトル〜（U+301C/U+FF5E 両対応）
    .replace(/\s*[（(][Vv]\d+[^）)]*[）)]/g, "")             // （V5）/ (V5) 等
    .replace(/\s*[（(](Remastered|Re-?Recording)[^）)]*[）)]/gi, "") // (Remastered_v5.5) 等
    .replace(/\s*_v\d+(\.\d+)?$/gi, "")                     // _v5 末尾
    .trim();
}

export async function GET() {
  // R2 が使えない場合は空配列（ローカル開発時は lyrics-index.json を使う）
  if (!isR2Enabled()) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const s3 = createR2Client();
    const cmd = new ListObjectsV2Command({
      Bucket: R2_BUCKET(),
      Prefix: "lyrics/",
    });
    const result = await s3.send(cmd);

    // "lyrics/ファイル名.lrc" → "ファイル名" を取り出す
    const basenames = (result.Contents ?? [])
      .map((obj) => obj.Key ?? "")
      .filter((key) => key.endsWith(".lrc"))
      .map((key) => key.replace(/^lyrics\//, "").replace(/\.lrc$/, ""));

    return NextResponse.json(basenames, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    console.error("lyrics-index: R2 list failed", e);
    return NextResponse.json([], { status: 500 });
  }
}
