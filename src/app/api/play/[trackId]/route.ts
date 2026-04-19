import { NextRequest, NextResponse } from "next/server";
import { redis, isRedisConfigured } from "@/lib/redis";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ count: 0 });
  }

  const { trackId } = await params;
  const id = parseInt(trackId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ count: 0 }, { status: 400 });
  }

  try {
    const count = await redis<number>(["INCR", `mbox:plays:${id}`]);
    return NextResponse.json({ count: Number(count) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
