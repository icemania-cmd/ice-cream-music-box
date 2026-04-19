import { NextRequest, NextResponse } from "next/server";
import { redis, isRedisConfigured } from "@/lib/redis";

const TTL_365_DAYS = 60 * 60 * 24 * 365;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ liked: false, count: 0 });
  }

  const { trackId } = await params;
  const id = parseInt(trackId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ liked: false, count: 0 }, { status: 400 });
  }

  const ip = getIp(req);
  const flagKey = `mbox:liked:${ip}:${id}`;
  const countKey = `mbox:likes:${id}`;

  try {
    const alreadyLiked = await redis<number>(["EXISTS", flagKey]);

    if (alreadyLiked) {
      await redis(["DECR", countKey]);
      await redis(["DEL", flagKey]);
      const count = Math.max(0, (await redis<number | null>(["GET", countKey])) ?? 0);
      return NextResponse.json({ liked: false, count });
    } else {
      await redis(["INCR", countKey]);
      await redis(["SET", flagKey, "1", "EX", TTL_365_DAYS]);
      const count = (await redis<number | null>(["GET", countKey])) ?? 0;
      return NextResponse.json({ liked: true, count: Number(count) });
    }
  } catch {
    return NextResponse.json({ liked: false, count: 0 });
  }
}
