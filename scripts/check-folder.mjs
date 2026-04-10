/**
 * フォルダのWAVファイルとtracks-meta.jsonを比較して
 * 新曲・変更曲・削除曲を表示するヘルパースクリプト
 */

import fs from "fs";
import path from "path";

const AUDIO_DIR =
  "C:\\Users\\iceman\\ICEMANIA Dropbox\\★日本アイスマニア協会\\a_アイスの歌\\AI-SONG\\w_wav\\b_BGM京都2026";
const META_FILE = path.join(AUDIO_DIR, "tracks-meta.json");

// フォルダのWAVファイル一覧
const wavFiles = fs
  .readdirSync(AUDIO_DIR)
  .filter((f) => f.toLowerCase().endsWith(".wav"))
  .sort((a, b) => a.localeCompare(b, "ja"));

// メタデータ読み込み
let meta = {};
if (fs.existsSync(META_FILE)) {
  meta = JSON.parse(fs.readFileSync(META_FILE, "utf-8"));
}

const metaKeys = new Set(Object.keys(meta));
const wavSet = new Set(wavFiles);

console.log("=== フォルダ内WAVファイル一覧 ===");
wavFiles.forEach((f, i) => {
  const inMeta = metaKeys.has(f) ? "✅" : "🆕";
  console.log(`${(i + 1).toString().padStart(2, "0")}. ${inMeta} ${f}`);
});

console.log(`\n合計: ${wavFiles.length}件\n`);

console.log("=== メタデータにあるがフォルダにないファイル ===");
let missing = 0;
for (const key of metaKeys) {
  if (!wavSet.has(key)) {
    console.log(`  ❌ ${key} → title: "${meta[key].title}"`);
    missing++;
  }
}
if (missing === 0) console.log("  なし");

console.log("\n=== 新ファイル（メタデータ未登録）===");
let newFiles = 0;
for (const f of wavFiles) {
  if (!metaKeys.has(f)) {
    console.log(`  🆕 ${f}`);
    newFiles++;
  }
}
if (newFiles === 0) console.log("  なし");
