import { NextRequest, NextResponse } from "next/server";
import { redis, isRedisConfigured } from "@/lib/redis";

/**
 * Sorted Set "listeners" を使って現在の接続数を管理する
 *   ZADD listeners <now_ms> <sessionId>  → セッション登録（スコア=タイムスタンプ）
 *   ZREMRANGEBYSCORE listeners 0 <60秒前> → 古いセッションを削除
 *   ZCARD listeners                       → 現在のカウントを取得
 */
async function getCurrentCount(): Promise<number> {
  const sixtySecsAgo = Date.now() - 60_000;
  await redis(["ZREMRANGEBYSCORE", "listeners", 0, sixtySecsAgo]);
  return await redis<number>(["ZCARD", "listeners"]);
}

/** GET: 現在のリスナー数を返す */
export async function GET() {
  if (!isRedisConfigured()) {
    return NextResponse.json({ count: 0 });
  }
  try {
    const count = await getCurrentCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

/** POST: セッションの生存確認（30秒ごとにクライアントから送信） */
export async function POST(req: NextRequest) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ count: 0 });
  }
  try {
    const { sessionId } = await req.json() as { sessionId: string };
    if (!sessionId) return NextResponse.json({ count: 0 });

    await redis(["ZADD", "listeners", Date.now(), sessionId]);
    const count = await getCurrentCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
