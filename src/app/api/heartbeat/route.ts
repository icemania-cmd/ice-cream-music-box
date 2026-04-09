import { NextRequest, NextResponse } from "next/server";

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** Upstash Redis REST API を呼ぶ薄いラッパー */
async function redis<T = unknown>(command: unknown[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = await res.json();
  return json.result as T;
}

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

/** GET: 現在のリスナー数を返す（デバッグ情報付き） */
export async function GET() {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return NextResponse.json({ count: 0, debug: "env_missing" });
  }
  try {
    const count = await getCurrentCount();
    return NextResponse.json({ count, debug: "ok" });
  } catch (e) {
    return NextResponse.json({ count: 0, debug: "redis_error", error: String(e) });
  }
}

/** POST: セッションの生存確認（30秒ごとにクライアントから送信） */
export async function POST(req: NextRequest) {
  if (!REDIS_URL || !REDIS_TOKEN) {
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
