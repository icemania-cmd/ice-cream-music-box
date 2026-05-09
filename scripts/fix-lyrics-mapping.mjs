/**
 * 公開URLからtracks.jsonを取得し、LRCとのファイル名マッピングを修正する。
 * R2のList権限不要。
 *
 * 使い方:
 *   node --env-file=.env.local scripts/fix-lyrics-mapping.mjs
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LYRICS_DIR = path.join(__dirname, "../lyrics");
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, NEXT_PUBLIC_R2_URL } = process.env;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

// U+301C = WAVE DASH, U+FF5E = FULLWIDTH TILDE  - 両方に対応
const WAVE_BLOCK = /[〜～][^〜～]+[〜～]/g;
const VER = /\s*[（(][Vv]\d+[^）)]*[）)]/g;
const REMASTER = /\s*[（(](Remastered|Re-?Recording)[^）)]*[）)]/gi;

function normalize(name) {
  return name
    .replace(WAVE_BLOCK, "")
    .replace(VER, "")
    .replace(REMASTER, "")
    .replace(/\s*_v\d+(\.\d+)?$/gi, "")
    .trim();
}

async function main() {
  const r2Base = NEXT_PUBLIC_R2_URL;
  if (!r2Base) { console.error("NEXT_PUBLIC_R2_URL が未設定です"); process.exit(1); }

  console.log("tracks.json を取得中...");
  const tracks = await fetchJson(`${r2Base}/tracks.json`);
  console.log(`  → ${tracks.length}曲取得しました\n`);

  // LRCファイルを列挙
  const lrcFiles = fs.readdirSync(LYRICS_DIR).filter(f => f.endsWith(".lrc"));
  console.log("ローカルのLRCファイル:");
  lrcFiles.forEach(f => console.log(`  ${f}  (normalize: "${normalize(f.replace(/\.lrc$/, ""))}")`));
  console.log();

  const indexNames = new Set(lrcFiles.map(f => f.replace(/\.lrc$/, "")));

  for (const lrcFile of lrcFiles) {
    const lrcBase = lrcFile.replace(/\.lrc$/, "");
    const lrcNorm = normalize(lrcBase);

    // tracks.json からマッチする曲を探す
    const matched = tracks.filter(t => {
      const base = t.filename.replace(/\.[^.]+$/, "");
      return normalize(base) === lrcNorm;
    });

    console.log(`🎵 "${lrcBase}" (norm: "${lrcNorm}") にマッチするトラック:`);

    if (matched.length === 0) {
      console.log("  ⚠️  マッチなし");
      // デバッグ: 大丈夫を含む全トラックを表示
      const candidates = tracks.filter(t => t.filename.includes("大丈夫") || t.title.includes("大丈夫"));
      if (candidates.length > 0) {
        console.log("  「大丈夫」を含むトラック:");
        candidates.forEach(t => {
          const base = t.filename.replace(/\.[^.]+$/, "");
          const baseChars = [...base].map(c => `${c}(U+${c.charCodeAt(0).toString(16).toUpperCase()})`).join("");
          console.log(`    title: "${t.title}"`);
          console.log(`    filename: "${t.filename}"`);
          console.log(`    filename chars: ${baseChars}`);
          console.log(`    normalize: "${normalize(base)}"`);
        });
      }
      console.log();
      continue;
    }

    const lrcContent = fs.readFileSync(path.join(LYRICS_DIR, lrcFile));

    for (const t of matched) {
      const mp3Base = t.filename.replace(/\.[^.]+$/, "");
      indexNames.add(mp3Base);

      // R2にアップロード
      const key = `lyrics/${mp3Base}.lrc`;
      try {
        await r2.send(new PutObjectCommand({
          Bucket: R2_BUCKET_NAME, Key: key,
          Body: lrcContent, ContentType: "text/plain; charset=utf-8",
        }));
        console.log(`  ✅ アップロード完了: "${key}"`);
      } catch (e) {
        console.log(`  ❌ アップロード失敗: ${e.message}`);
      }
    }
    console.log();
  }

  const indexArr = [...indexNames].sort();
  const indexPath = path.join(__dirname, "../public/lyrics-index.json");
  fs.writeFileSync(indexPath, JSON.stringify(indexArr, null, 2) + "\n", "utf-8");
  console.log("lyrics-index.json 更新完了:");
  indexArr.forEach(n => console.log(`  "${n}"`));
  console.log("\n次: git add public/lyrics-index.json && git commit -m 'fix: lyrics-index' && git push");
}

main().catch(err => { console.error("エラー:", err); process.exit(1); });
