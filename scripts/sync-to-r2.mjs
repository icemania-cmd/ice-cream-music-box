/**
 * WAVファイルをCloudflare R2にアップロードするスクリプト
 *
 * 使い方:
 *   node --env-file=.env.local scripts/sync-to-r2.mjs
 *
 * 処理内容:
 *   1. DropboxフォルダのWAVファイルを一覧
 *   2. tracks-meta.json を読んでメタデータをマージ
 *   3. 各WAVを R2: audio/<filename> にアップロード
 *   4. tracks.json（曲リスト）を R2 にアップロード
 *   5. tracks-meta.json を R2 にアップロード（バックアップ）
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// ──────────────────────────────────────────────
// 設定
// ──────────────────────────────────────────────
const AUDIO_DIR =
  "C:\\Users\\iceman\\ICEMANIA Dropbox\\★日本アイスマニア協会\\a_アイスの歌\\AI-SONG\\w_wav\\b_BGM京都2026";
const META_FILE = path.join(AUDIO_DIR, "tracks-meta.json");

// 並列アップロード数（大きいファイルなので控えめに）
const CONCURRENCY = 3;

// プレイリストから除外するファイル名（R2には残るが曲一覧に表示しない）
const EXCLUDED_FILES = [
  "一日くらい大丈夫(Remastered_v5.5).wav",
];

// ──────────────────────────────────────────────
// R2クライアント
// ──────────────────────────────────────────────
const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
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
// ユーティリティ
// ──────────────────────────────────────────────
function colorFromFilename(filename) {
  const palette = [
    "#D65076", "#5DB89A", "#E8A0BF", "#FFB347", "#6A8FC9",
    "#FF8C94", "#B8A9C9", "#F5A623", "#87CEEB", "#FF69B4",
    "#F4A460", "#98FB98", "#B0E0E6", "#FFA07A", "#DDA0DD",
    "#DAA520", "#20B2AA", "#FF6347", "#708090", "#CD853F",
  ];
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    hash = filename.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.wav$/i, "")
    .replace(/\s*\([Vv]\d+(\.\d+)?\)/g, "")
    .replace(/\s*\(Remastered[^)]*\)/gi, "")
    .replace(/\s*_v\d+(\.\d+)?$/gi, "")
    .trim();
}

/** R2にオブジェクトが存在するか確認 */
async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** ファイルをR2にアップロード */
async function uploadFile(key, body, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

/** 並列数を制限してPromiseを実行 */
async function pLimit(tasks, limit) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ──────────────────────────────────────────────
// メイン処理
// ──────────────────────────────────────────────
async function main() {
  console.log("🍦 ICE CREAM MUSIC BOX — R2 アップロード開始\n");

  // 1. WAVファイル一覧
  if (!fs.existsSync(AUDIO_DIR)) {
    console.error(`❌ フォルダが見つかりません: ${AUDIO_DIR}`);
    process.exit(1);
  }
  const wavFiles = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .filter((f) => !EXCLUDED_FILES.includes(f))
    .sort((a, b) => a.localeCompare(b, "ja"));

  if (EXCLUDED_FILES.length > 0) {
    console.log(`🚫 除外ファイル: ${EXCLUDED_FILES.join(", ")}\n`);
  }
  console.log(`📂 WAVファイル: ${wavFiles.length}件\n`);

  // 2. tracks-meta.json 読み込み
  let meta = {};
  if (fs.existsSync(META_FILE)) {
    try {
      meta = JSON.parse(fs.readFileSync(META_FILE, "utf-8"));
    } catch {
      console.warn("⚠️  tracks-meta.json の読み込みに失敗しました。空で続行します。");
    }
  } else {
    console.warn("⚠️  tracks-meta.json が見つかりません。ファイル名からタイトルを生成します。");
  }

  // 3. Track[] を構築
  const tracks = wavFiles.map((filename, idx) => {
    const m = meta[filename] ?? {};
    return {
      id: idx + 1,
      title: m.title ?? titleFromFilename(filename),
      artist: m.artist ?? "AI-SONG",
      genre: m.genre ?? "BGM",
      plays: m.plays ?? 0,
      color: m.color ?? colorFromFilename(filename),
      filename,
    };
  });

  // 4. WAVファイルをR2にアップロード（既存はスキップ）
  console.log("🎵 WAVファイルをアップロード中...\n");
  let uploaded = 0;
  let skipped = 0;

  const uploadTasks = wavFiles.map((filename) => async () => {
    const key = `audio/${filename}`;
    const filePath = path.join(AUDIO_DIR, filename);
    const stat = fs.statSync(filePath);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);

    const exists = await existsInR2(key);
    if (exists) {
      console.log(`  ⏭️  スキップ: ${filename} (${sizeMB}MB) — R2に存在`);
      skipped++;
      return;
    }

    console.log(`  ⬆️  アップロード: ${filename} (${sizeMB}MB)...`);
    const body = fs.readFileSync(filePath);
    await uploadFile(key, body, "audio/wav");
    console.log(`  ✅ 完了: ${filename}`);
    uploaded++;
  });

  await pLimit(uploadTasks, CONCURRENCY);

  console.log(`\n📊 WAV: ${uploaded}件アップロード, ${skipped}件スキップ\n`);

  // 5. tracks.json をR2にアップロード
  console.log("📋 tracks.json をアップロード中...");
  await uploadFile(
    "tracks.json",
    Buffer.from(JSON.stringify(tracks, null, 2), "utf-8"),
    "application/json"
  );
  console.log("  ✅ tracks.json アップロード完了");

  // 6. tracks-meta.json をR2にアップロード（バックアップ）
  if (fs.existsSync(META_FILE)) {
    console.log("📋 tracks-meta.json をアップロード中...");
    await uploadFile(
      "tracks-meta.json",
      fs.readFileSync(META_FILE),
      "application/json"
    );
    console.log("  ✅ tracks-meta.json アップロード完了");
  }

  console.log("\n🎉 完了！R2への同期が終わりました。");
  console.log(`\n曲一覧: ${tracks.length}件`);
  tracks.forEach((t) => console.log(`  [${t.id}] ${t.title} — ${t.genre}`));
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
