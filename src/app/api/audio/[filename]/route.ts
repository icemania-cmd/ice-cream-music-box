import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const AUDIO_DIR =
  "C:\\Users\\iceman\\ICEMANIA Dropbox\\★日本アイスマニア協会\\a_アイスの歌\\AI-SONG\\w_wav\\b_BGM京都2026";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);

  // 本番環境（R2）: R2からプロキシして同一オリジンで返す
  const r2Base = process.env.NEXT_PUBLIC_R2_URL;
  if (r2Base) {
    const r2Url = `${r2Base}/audio/${encodeURIComponent(decoded)}`;
    const rangeHeader = req.headers.get("range");

    const fetchHeaders: Record<string, string> = {};
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    try {
      const r2Res = await fetch(r2Url, { headers: fetchHeaders });
      const resHeaders: Record<string, string> = {
        "Content-Type": "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      };
      const contentLength = r2Res.headers.get("content-length");
      const contentRange = r2Res.headers.get("content-range");
      if (contentLength) resHeaders["Content-Length"] = contentLength;
      if (contentRange) resHeaders["Content-Range"] = contentRange;

      return new NextResponse(r2Res.body, {
        status: r2Res.status,
        headers: resHeaders,
      });
    } catch {
      return new NextResponse("Failed to fetch from R2", { status: 502 });
    }
  }

  // 開発環境: ローカルファイルシステムから直接ストリーム
  const filePath = path.join(AUDIO_DIR, decoded);

  // パストラバーサル対策
  if (!filePath.startsWith(AUDIO_DIR)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const rangeHeader = req.headers.get("range");

  const headers: Record<string, string> = {
    "Content-Type": "audio/wav",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
    "Access-Control-Allow-Origin": "*",
  };

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    headers["Content-Range"] = `bytes ${start}-${end}/${fileSize}`;
    headers["Content-Length"] = String(chunkSize);

    const stream = fs.createReadStream(filePath, { start, end });
    return new NextResponse(stream as unknown as ReadableStream, {
      status: 206,
      headers,
    });
  }

  headers["Content-Length"] = String(fileSize);
  const stream = fs.createReadStream(filePath);
  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers,
  });
}
