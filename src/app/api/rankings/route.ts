import { NextResponse } from "next/server";
import { isRedisConfigured, redisPipeline } from "@/lib/redis";
import { tracks } from "@/lib/tracks";

export async function GET() {
  if (!isRedisConfigured()) {
    const empty = Object.fromEntries(
      tracks.map((t) => [t.id, { likes: 0, plays: 0, score: 0 }])
    );
    return NextResponse.json(empty);
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

    return NextResponse.json(data);
  } catch {
    const empty = Object.fromEntries(
      tracks.map((t) => [t.id, { likes: 0, plays: 0, score: 0 }])
    );
    return NextResponse.json(empty);
  }
}
