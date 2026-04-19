/**
 * compute-gains.mjs
 *
 * WAV（またはffmpeg利用可能ならMP3）ファイルを解析してRMSゲイン値を計算する。
 * 出力されたgain値はtracks.tsの各トラックに設定する。
 *
 * 使い方:
 *   node scripts/compute-gains.mjs
 *
 * MP3対応: ffmpegがインストール済みなら自動的にMP3も読める。
 * ffmpegなし: WAVファイルを純Node.jsで直接解析（MP3変換後のRMS差は<0.5dBで無視できる）。
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const WAV_DIR =
  "C:/Users/iceman/ICEMANIA Dropbox/★日本アイスマニア協会/a_アイスの歌/AI-SONG/w_wav/b_BGM京都2026";

const MP3_DIR =
  "C:/Users/iceman/ICEMANIA Dropbox/★日本アイスマニア協会/a_アイスの歌/AI-SONG/w_wav/変換/mp3";

const TARGET_DBFS = -16;

// tracks.tsのfilenameが実際のファイルと異なる場合のフォールバックマッピング
// (v5.5差し替えなどでファイル名が変わった場合に更新する)
const FILENAME_FALLBACK_MAP = {
  "Welcome to Aipaku.wav": "Welcome to Aipaku!!(Remastered_v5.5).wav",
  "icecream holic.wav": "icecream holic(v5.5).wav",
  "Ice cream paradise.wav": "Ice cream paradise (v5.5).wav",
  "Hurry! Hurry! Hurry! .wav": "Hurry! Hurry! Hurry!(v5.5).wav",
  "アイスだらけのcameraroll.wav": "アイスだらけのcameraroll(v4).wav",
  "クラフトソフトクリーム.wav": "クラフトソフトクリーム (Remastered_v5.5).wav",
  "一日くらい大丈夫（V5）.wav": "一日くらい大丈夫(Remastered_v5.5).wav",
};

const TRACKS = [
  { id: 1, filename: "Welcome to Aipaku.wav" },
  { id: 2, filename: "Ice Cream Wonderland.wav" },
  { id: 3, filename: "アイ・アイ・I LOVE ICE CREAM.wav" },
  { id: 4, filename: "おいしい呪文.wav" },
  { id: 5, filename: "Ice Cream Syndrome.wav" },
  { id: 6, filename: "icecream holic.wav" },
  { id: 7, filename: "Melting in our hearts.wav" },
  { id: 8, filename: "8月の花火と君とアイス (Remastered_v4.5).wav" },
  { id: 9, filename: "チョコミン党(V5).wav" },
  { id: 10, filename: "Heat Shock ～溶けない約束～(v5).wav" },
  { id: 11, filename: "Scoop Me Up.wav" },
  { id: 12, filename: "Ice Cream Virtual City（v5）.wav" },
  { id: 13, filename: "flavor forever.wav" },
  { id: 14, filename: "La La La Love ice cream.wav" },
  { id: 15, filename: "アイスクリームと黄昏の街（v5）.wav" },
  { id: 16, filename: "I am ice cream（she-v5）.wav" },
  { id: 17, filename: "Foolish man.wav" },
  { id: 18, filename: "Ice cream paradise.wav" },
  { id: 19, filename: "Glorious Winter Ice.wav" },
  { id: 20, filename: "アイスクリームくっそ食べたい（V5）.wav" },
  { id: 21, filename: "Hurry! Hurry! Hurry! .wav" },
  { id: 22, filename: "Ice Cream and One Story(V5).wav" },
  { id: 23, filename: "アイスクリーム総選挙.wav" },
  { id: 24, filename: "3秒ルール.wav" },
  { id: 25, filename: "アイスだらけのcameraroll.wav" },
  { id: 26, filename: "クラフトソフトクリーム.wav" },
  { id: 27, filename: "ペンギンの告白 -Ice Cream Love-.wav" },
  { id: 28, filename: "アイス食べさせてクレメンス.wav" },
  { id: 29, filename: "一日くらい大丈夫（V5）.wav" },
  { id: 30, filename: "アイスクリームの恨みは怖いのよ (V5).wav" },
  { id: 31, filename: "思い出のアイスキャンディー.wav" },
  { id: 32, filename: "レイガシノミチ.wav" },
  { id: 33, filename: "僕は冬のアイスです.wav" },
];

// WAVヘッダーを解析してフォーマット情報とdataチャンク位置を返す
function parseWavHeader(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF")
    throw new Error("Not a RIFF file");
  if (buffer.toString("ascii", 8, 12) !== "WAVE")
    throw new Error("Not a WAVE file");

  let channels, bitsPerSample, sampleRate;
  let dataOffset = -1,
    dataSize = -1;
  let offset = 12;

  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === "fmt ") {
      channels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      bitsPerSample = buffer.readUInt16LE(offset + 22);
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++; // ワード境界アライン
  }

  if (dataOffset === -1) throw new Error("No data chunk found");
  return { channels, bitsPerSample, sampleRate, dataOffset, dataSize };
}

// PCMサンプルからRMS（実効値）を計算する
function computeRmsFromWav(buffer) {
  const info = parseWavHeader(buffer);
  const { bitsPerSample, dataOffset, dataSize } = info;
  const bytesPerSample = Math.ceil(bitsPerSample / 8);
  const numSamples = Math.floor(dataSize / bytesPerSample);

  // 大きいファイルは10サンプルおきにサンプリング（精度は保ちつつ高速化）
  const stride = numSamples > 1_000_000 ? 10 : 1;
  let sumSquares = 0;
  let count = 0;

  for (let i = 0; i < numSamples; i += stride) {
    const byteOffset = dataOffset + i * bytesPerSample;
    if (byteOffset + bytesPerSample > buffer.length) break;

    let sample;
    if (bitsPerSample === 16) {
      sample = buffer.readInt16LE(byteOffset) / 32768;
    } else if (bitsPerSample === 24) {
      const b0 = buffer[byteOffset];
      const b1 = buffer[byteOffset + 1];
      const b2 = buffer[byteOffset + 2];
      let val = (b2 << 16) | (b1 << 8) | b0;
      if (val >= 0x800000) val -= 0x1000000;
      sample = val / 8388608;
    } else if (bitsPerSample === 32) {
      sample = buffer.readInt32LE(byteOffset) / 2147483648;
    } else {
      throw new Error(`Unsupported bits per sample: ${bitsPerSample}`);
    }

    sumSquares += sample * sample;
    count++;
  }

  if (count === 0) throw new Error("No samples found");
  return Math.sqrt(sumSquares / count);
}

// ffmpegでMP3/WAVのmean_volume(dBFS)を取得する
function getDbfsViaFfmpeg(filePath) {
  const result = execSync(
    `ffmpeg -i "${filePath}" -af "volumedetect" -f null /dev/null 2>&1`,
    { encoding: "utf8" }
  );
  const match = result.match(/mean_volume:\s*([-\d.]+)\s*dB/);
  if (!match) throw new Error("Could not parse ffmpeg output");
  return parseFloat(match[1]);
}

// ffmpegが利用可能かチェック
function hasFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// gain = 10^((target - dbfs) / 20), 小数点2桁に丸め
function dbfsToGain(dbfs) {
  const raw = Math.pow(10, (TARGET_DBFS - dbfs) / 20);
  return Math.round(raw * 100) / 100;
}

async function main() {
  const ffmpegAvailable = hasFfmpeg();
  console.log(`ffmpeg: ${ffmpegAvailable ? "利用可能" : "なし（WAVで代替計算）"}`);
  console.log(`ターゲット: ${TARGET_DBFS} dBFS\n`);

  const results = [];

  for (const track of TRACKS) {
    const actualFilename = FILENAME_FALLBACK_MAP[track.filename] ?? track.filename;
    const wavPath = join(WAV_DIR, actualFilename);
    const mp3Filename = actualFilename.replace(/\.wav$/i, ".mp3");
    const mp3Path = join(MP3_DIR, mp3Filename);

    let dbfs = null;
    let source = "";

    // MP3が存在しffmpegが使える場合はMP3で計算
    if (ffmpegAvailable && existsSync(mp3Path)) {
      try {
        dbfs = getDbfsViaFfmpeg(mp3Path);
        source = "mp3+ffmpeg";
      } catch (e) {
        console.error(`  MP3解析失敗(${track.filename}): ${e.message}`);
      }
    }

    // WAVが存在する場合はWAVで計算（純Node.js）
    if (dbfs === null && existsSync(wavPath)) {
      try {
        const buffer = readFileSync(wavPath);
        const rms = computeRmsFromWav(buffer);
        dbfs = rms > 0 ? 20 * Math.log10(rms) : -96;
        source = "wav";
      } catch (e) {
        console.error(`  WAV解析失敗(${track.filename}): ${e.message}`);
      }
    }

    // ffmpegがあってWAVパスでもう一度試す
    if (dbfs === null && ffmpegAvailable && existsSync(wavPath)) {
      try {
        dbfs = getDbfsViaFfmpeg(wavPath);
        source = "wav+ffmpeg";
      } catch (e) {
        console.error(`  ffmpeg WAV解析失敗(${track.filename}): ${e.message}`);
      }
    }

    const gain = dbfs !== null ? dbfsToGain(dbfs) : 1.0;
    const status = dbfs !== null ? `${dbfs.toFixed(1)} dBFS [${source}]` : "ファイル未発見 → gain:1.00";

    console.log(`  id:${String(track.id).padStart(2)} ${track.filename}`);
    console.log(`         ${status} → gain: ${gain.toFixed(2)}`);

    results.push({ id: track.id, filename: track.filename, dbfs, gain });
  }

  console.log("\n--- tracks.ts 用 gain 値 ---");
  for (const r of results) {
    console.log(`  // id:${r.id} ${r.filename}`);
    console.log(`  gain: ${r.gain.toFixed(2)},`);
  }

  console.log("\n--- 統計 ---");
  const computed = results.filter((r) => r.dbfs !== null);
  const notFound = results.filter((r) => r.dbfs === null);
  console.log(`計算済み: ${computed.length} / ${results.length} トラック`);
  if (notFound.length > 0) {
    console.log(`未発見(gain=1.00): ${notFound.map((r) => r.filename).join(", ")}`);
  }
  if (computed.length > 0) {
    const dbfsValues = computed.map((r) => r.dbfs);
    const avg = dbfsValues.reduce((a, b) => a + b, 0) / dbfsValues.length;
    const min = Math.min(...dbfsValues);
    const max = Math.max(...dbfsValues);
    console.log(`平均: ${avg.toFixed(1)} dBFS, 最小: ${min.toFixed(1)} dBFS, 最大: ${max.toFixed(1)} dBFS`);
  }
}

main().catch(console.error);
