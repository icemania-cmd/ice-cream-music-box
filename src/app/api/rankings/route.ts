import { NextResponse } from "next/server";
import { isRedisConfigured, redisPipeline } from "@/lib/redis";
import { loadTracksServer } from "@/lib/trackLoader";

// 常に最新Redisデータを返す（ISRやEdgeキャッシュを許可しない）
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // 本番R2 / 開発ローカルから動的に取得（静的tracks.tsだとid 34以降が欠落する）
  const tracks = await loadTracksServer();

  if (!isRedisConfigured()) {
    const empty = Object.fromEntries(
      tracks.map((t) => [t.id, { likes: 0, plays: 0, score: 0 }])
    );
    return NextResponse.json(empty, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  try {
    const likeKeys = tracks.map((t) => ["GET", `mbox:likes:${t.id}`]);
    const playKeys = tracks.map((t) => ["GET", `mbox:plays:${t.id}`]);
    const results = await redisPipeline([...likeKeys, ...playKeys]);

    const half = tracks.length;
    const data: Record<number, { likes: number; plays: number; score: number }> = {};
    tracks.forEach((t, i) => {
      const likes = Number(results[i] ?? 0);
      const plays = Number(results[half + i] ?? 0);
      data[t.id] = { likes, plays, score: likes * 5 + plays };
    });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    const empty = Object.fromEntries(
      tracks.map((t) => [t.id, { likes: 0, plays: 0, score: 0 }])
    );
    return NextResponse.json(empty, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
