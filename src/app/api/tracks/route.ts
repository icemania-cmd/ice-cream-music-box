import { NextRequest, NextResponse } from "next/server";
import { loadTracksServer, writeTrackMeta, TrackMeta } from "@/lib/trackLoader";

/** GET /api/tracks — 環境に応じてR2またはローカルから曲一覧を返す */
export async function GET() {
  const tracks = await loadTracksServer();
  return NextResponse.json(tracks);
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
