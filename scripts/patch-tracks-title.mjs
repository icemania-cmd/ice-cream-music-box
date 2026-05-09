/**
 * R2 の tracks.json 内の特定曲のタイトルをパッチするスクリプト
 *
 * 使い方:
 *   node --env-file=.env.local scripts/patch-tracks-title.mjs
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  NEXT_PUBLIC_R2_URL,
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("❌ .env.local に R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME を設定してください");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = R2_BUCKET_NAME;

// ──────────────────────────────────────────────
// タイトル修正マップ: filename → 正しいタイトル
// ──────────────────────────────────────────────
const TITLE_FIXES = {
  "flavor forever.mp3": "Flavor Forever",
};

async function main() {
  // 1. R2 から tracks.json を取得
  console.log("📥 tracks.json を R2 から取得中...");
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: "tracks.json" }));
  const body = await res.Body.transformToString("utf-8");
  const tracks = JSON.parse(body);
  console.log(`  取得完了: ${tracks.length} 曲`);

  // 2. パッチ適用
  let patchCount = 0;
  for (const track of tracks) {
    const fix = TITLE_FIXES[track.filename];
    if (fix && track.title !== fix) {
      console.log(`  🔧 [${track.id}] "${track.title}" → "${fix}"`);
      track.title = fix;
      patchCount++;
    }
  }

  if (patchCount === 0) {
    console.log("✅ 修正箇所なし（すでに最新）");
    return;
  }

  // 3. R2 に上書きアップロード
  console.log(`\n📤 tracks.json をアップロード中 (${patchCount}件修正)...`);
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: "tracks.json",
    Body: Buffer.from(JSON.stringify(tracks, null, 2), "utf-8"),
    ContentType: "application/json",
  }));
  console.log("✅ tracks.json アップロード完了");
  console.log("\n曲一覧 (修正分):");
  for (const track of tracks) {
    if (TITLE_FIXES[track.filename]) {
      console.log(`  [${track.id}] ${track.title} — ${track.filename}`);
    }
  }
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
