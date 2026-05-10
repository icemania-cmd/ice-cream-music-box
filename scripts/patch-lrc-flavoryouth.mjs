/**
 * Flavor of Youth.lrc の歌詞テキストを修正して R2 に再アップロード
 * 使い方: node scripts/patch-lrc-flavoryouth.mjs
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local を手動パース
const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME ?? "ice-cream-music";
const KEY = "lyrics/Flavor of Youth.lrc";

const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
const original = await res.Body.transformToString("utf-8");

const patched = original.replace(
  "選ぶ度 新しい世界が見える",
  "選ぶ度 新しい世界見える"
);

if (original === patched) {
  console.log("⚠️  置換対象が見つかりませんでした（すでに修正済み？）");
  console.log(original);
} else {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
    Body: patched,
    ContentType: "text/plain; charset=utf-8",
  }));
  console.log("✅ Flavor of Youth.lrc を更新しました");
  console.log(patched);
}
