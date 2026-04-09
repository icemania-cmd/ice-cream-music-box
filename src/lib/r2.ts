/**
 * Cloudflare R2 クライアント設定
 * 環境変数が揃っている場合のみ使用可能
 */
import { S3Client } from "@aws-sdk/client-s3";

/** R2 S3互換クライアント（サーバーサイド専用） */
export function createR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export const R2_BUCKET = (): string =>
  process.env.R2_BUCKET_NAME ?? "ice-cream-music";

/** R2パブリックURLが設定されているか（= 本番環境判定） */
export function isR2Enabled(): boolean {
  return !!process.env.NEXT_PUBLIC_R2_URL;
}

/** R2パブリックURLから音声ファイルのURLを返す */
export function getR2AudioUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_R2_URL ?? "";
  return `${base}/audio/${encodeURIComponent(filename)}`;
}
