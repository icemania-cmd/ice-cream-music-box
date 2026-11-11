/**
 * MV動画をWeb向けに変換して Cloudflare R2 の mv/ にアップロードするスクリプト
 *
 * 使い方:
 *   node --env-file=.env.local scripts/upload-mv.mjs "<元動画のパス>" "<R2上のファイル名>.mp4"
 *
 * 例:
 *   node --env-file=.env.local scripts/upload-mv.mjs "C:\...\種類別：僕3.mp4" "種類別：僕.mp4"
 *
 * アップロード後、tracks-meta.json の該当曲に "mv": "<R2上のファイル名>.mp4" を書き、
 * npm run sync-r2 を実行すると、アプリでMVが表示される。
 *
 * 変換内容: H.264 / 720p / 音声なし（音はプレイヤーの音源を使う）/ faststart（再生開始を速く）
 * 元動画（HEVC・1080p など）はブラウザによって再生できず、容量も大きいため必ず変換する。
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const [inputPath, r2Name, coverPath] = process.argv.slice(2);
const SKIP_VIDEO = "-";
if (!inputPath || !r2Name || !r2Name.toLowerCase().endsWith(".mp4") || (inputPath === SKIP_VIDEO && !coverPath)) {
  console.error('❌ 使い方: node --env-file=.env.local scripts/upload-mv.mjs "<元動画 または ->" "<名前>.mp4" ["<カバー画像>"]');
  process.exit(1);
}
for (const p of [inputPath === SKIP_VIDEO ? null : inputPath, coverPath]) {
  if (p && !fs.existsSync(p)) {
    console.error(`❌ ファイルが見つかりません: ${p}`);
    process.exit(1);
  }
}

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("❌ .env.local に R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME を設定してください");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// 画質（数字が小さいほど高画質・大容量。23〜28 が目安）
const CRF = "25";
const HEIGHT = 720;
// カバー画像の画質（ffmpeg の -q:v。2〜5 が目安、小さいほど高画質）
const COVER_QUALITY = "3";

const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(1);

/** ffmpeg で変換したファイルを R2 にアップロードし、一時ファイルを消す */
async function convertAndUpload({ label, ffmpegArgs, ext, key, contentType }) {
  const tmp = path.join(os.tmpdir(), `icecream_mv_${Date.now()}${ext}`);
  console.log(`🎬 変換中: ${label}`);
  try {
    execFileSync("ffmpeg", ["-y", "-v", "error", ...ffmpegArgs, tmp], { stdio: "inherit" });
    console.log(`⬆️  アップロード: ${key} (${toMB(fs.statSync(tmp).size)}MB)`);
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fs.readFileSync(tmp),
      ContentType: contentType,
      CacheControl: "public, max-age=31536000",
    }));
    console.log(`✅ 完了: ${key}`);
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

async function main() {
  if (inputPath !== SKIP_VIDEO) {
    await convertAndUpload({
      label: `${path.basename(inputPath)} (${toMB(fs.statSync(inputPath).size)}MB) — 数分かかります`,
      ffmpegArgs: [
        "-i", inputPath,
        "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", CRF,
        "-vf", `scale=-2:${HEIGHT}`,
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
      ],
      ext: ".mp4",
      key: `mv/${r2Name}`,
      contentType: "video/mp4",
    });
  }
  if (coverPath) {
    await convertAndUpload({
      label: path.basename(coverPath),
      ffmpegArgs: ["-i", coverPath, "-vf", `scale=-2:${HEIGHT}`, "-q:v", COVER_QUALITY],
      ext: ".jpg",
      key: `mv/${r2Name.replace(/.mp4$/i, ".jpg")}`,
      contentType: "image/jpeg",
    });
  }
  console.log(`
次の手順（初回のみ）: tracks-meta.json の曲に "mv": "${r2Name}" を追加 → npm run sync-r2`);
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
