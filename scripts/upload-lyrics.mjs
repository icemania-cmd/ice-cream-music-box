/**
 * lyrics/ フォルダのLRCファイルをCloudflare R2にアップロードするスクリプト
 *
 * 使い方:
 *   node --env-file=.env.local scripts/upload-lyrics.mjs
 *
 * lyrics/ フォルダにあるすべての .lrc ファイルを R2: lyrics/<filename>.lrc にアップロード。
 * すでにR2に存在するファイルも上書きします。
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LYRICS_DIR = path.join(__dirname, "../lyrics");

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("❌ .env.local に以下を設定してください:");
  console.error("   R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME");
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

async function main() {
  console.log("🎵 歌詞ファイル R2アップロード開始\n");

  if (!fs.existsSync(LYRICS_DIR)) {
    console.error(`❌ lyrics/ フォルダが見つかりません: ${LYRICS_DIR}`);
    process.exit(1);
  }

  const lrcFiles = fs.readdirSync(LYRICS_DIR).filter(f => f.endsWith(".lrc"));

  if (lrcFiles.length === 0) {
    console.log("⚠️  lyrics/ フォルダに .lrc ファイルがありません");
    return;
  }

  console.log(`📂 ${lrcFiles.length}件のLRCファイルをアップロードします\n`);

  let ok = 0;
  let fail = 0;

  for (const filename of lrcFiles) {
    const filePath = path.join(LYRICS_DIR, filename);
    const key = `lyrics/${filename}`;
    const body = fs.readFileSync(filePath);

    try {
      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: "text/plain; charset=utf-8",
      }));
      console.log(`  ✅ ${filename}`);
      ok++;
    } catch (err) {
      console.error(`  ❌ ${filename}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n完了: ${ok}件成功 / ${fail}件失敗`);

  // lyrics-index.json を更新（歌詞ありのベース名リスト）
  const uploadedNames = lrcFiles
    .filter(f => !fail)
    .map(f => f.replace(/\.lrc$/, ""));
  const indexPath = path.join(__dirname, "../public/lyrics-index.json");
  fs.writeFileSync(indexPath, JSON.stringify(uploadedNames, null, 2) + "\n", "utf-8");
  console.log(`\n📋 lyrics-index.json を更新しました (${uploadedNames.length}件)`);
}

main().catch(err => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
