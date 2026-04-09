/**
 * maskable PWAアイコン生成スクリプト
 *
 * maskableアイコンの要件：
 * - セーフゾーン = 中央80%の円内にコンテンツが収まること
 * - 背景はキャンバス全体（端まで）を塗りつぶすこと
 *
 * 生成ファイル：
 * - public/icon-512-maskable.png (512x512)
 * - public/icon-192-maskable.png (192x192)
 */

const sharp = require("sharp");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "../public");
const BG_COLOR = "#1B0A04"; // manifest.jsonのbackground_colorに合わせる

async function generateMaskableIcon(size) {
  const safezone = Math.floor(size * 0.8); // セーフゾーン = 80%
  const padding = Math.floor((size - safezone) / 2);

  const inputFile = path.join(PUBLIC_DIR, "icon-512.png");
  const outputFile = path.join(PUBLIC_DIR, `icon-${size}-maskable.png`);

  // 元のアイコンをセーフゾーンサイズにリサイズしてから
  // 背景色付きの大きなキャンバスに合成する
  const resizedIcon = await sharp(inputFile)
    .resize(safezone, safezone, { fit: "contain", background: BG_COLOR })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BG_COLOR,
    },
  })
    .composite([
      {
        input: resizedIcon,
        top: padding,
        left: padding,
      },
    ])
    .png()
    .toFile(outputFile);

  console.log(`生成完了: ${outputFile} (${size}x${size}, padding=${padding}px)`);
}

async function main() {
  console.log("maskableアイコンを生成中...");
  console.log(`背景色: ${BG_COLOR}`);
  console.log(`セーフゾーン: 80% (コンテンツが丸マスクでも切れない)`);
  console.log();

  await generateMaskableIcon(512);
  await generateMaskableIcon(192);

  console.log("\n完了しました。manifest.jsonを更新してください。");
}

main().catch(console.error);
