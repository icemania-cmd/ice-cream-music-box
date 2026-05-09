/**
 * サーバー専用: Dropboxフォルダを自動スキャンして曲リストを生成
 * tracks-meta.json が存在すれば優先メタデータとして使用
 * 本番環境（R2）では tracks.json をフェッチして返す
 */
import fs from "fs";
import path from "path";
import { Track } from "./tracks";

export const AUDIO_DIR =
  "C:\\Users\\iceman\\ICEMANIA Dropbox\\★日本アイスマニア協会\\a_アイスの歌\\AI-SONG\\w_wav\\b_BGM京都2026";

export const META_FILE = path.join(AUDIO_DIR, "tracks-meta.json");

/** ファイル名のハッシュから色を決定 */
function colorFromFilename(filename: string): string {
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

/** ファイル名から人間が読みやすいタイトルを生成 */
function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.(wav|mp3)$/i, "")
    .replace(/\s*\([Vv]\d+(\.\d+)?\)/g, "")         // (V5), (v4.5) 等
    .replace(/\s*\(Remastered[^)]*\)/gi, "")          // (Remastered_v4.5) 等
    .replace(/\s*\(Re-Recording[^)]*\)/gi, "")        // (Re-Recording_v4) 等
    .replace(/\s*\(Re-?[Rr]ecording[^)]*\)/gi, "")   // バリエーション
    .replace(/\s*_v\d+(\.\d+)?$/gi, "")               // _v5 末尾
    .trim();
}

export type TrackMeta = Omit<Track, "id" | "filename">;
export type MetaFile = Record<string, Partial<TrackMeta>>;

/** WAVファイルを一覧し、メタデータとマージして返す */
export function loadTracksFromFolder(): Track[] {
  if (!fs.existsSync(AUDIO_DIR)) return [];

  const files = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .sort((a, b) => a.localeCompare(b, "ja"));

  let meta: MetaFile = {};
  if (fs.existsSync(META_FILE)) {
    try {
      meta = JSON.parse(fs.readFileSync(META_FILE, "utf-8"));
    } catch {
      // JSONパース失敗時は無視
    }
  }

  return files.map((filename, idx) => {
    const m = meta[filename] ?? {};
    return {
      id: idx + 1,
      title:  m.title  ?? titleFromFilename(filename),
      artist: m.artist ?? "ICECREAM SONG",
      genre:  m.genre  ?? "BGM",
      plays:  m.plays  ?? 0,
      color:  m.color  ?? colorFromFilename(filename),
      filename,
      gain:   m.gain   ?? 1.0,
    };
  });
}

/** 現在のメタファイルを読み込む（存在しなければ空） */
export function readMetaFile(): MetaFile {
  if (!fs.existsSync(META_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(META_FILE, "utf-8"));
  } catch {
    return {};
  }
}

/** メタファイルに1曲分のデータを書き込む */
export function writeTrackMeta(filename: string, data: Partial<TrackMeta>): void {
  const current = readMetaFile();
  current[filename] = { ...(current[filename] ?? {}), ...data };
  fs.writeFileSync(META_FILE, JSON.stringify(current, null, 2), "utf-8");
}

/** ファイル名からバージョン・サブタイトルを除いた正規化名を返す
 * 〜 は U+301C と U+FF5E の2種類が存在するため両方に対応 */
function normalizeLyricsName(name: string): string {
  return name
    .replace(/[〜～][^〜～]+[〜～]/g, "")                    // 〜サブタイトル〜（両Unicodeに対応）
    .replace(/\s*[（(][Vv]\d+[^）)]*[）)]/g, "")             // （V5）または (V5)
    .replace(/\s*[（(](Remastered|Re-?Recording)[^）)]*[）)]/gi, "") // (Remastered_v5.5) 等
    .replace(/\s*_v\d+(\.\d+)?$/gi, "")
    .trim();
}

/** R2 lyrics/ フォルダにある LRC の正規化名セットを取得 */
async function fetchLyricsNormalizedSet(): Promise<Set<string>> {
  try {
    const { createR2Client, R2_BUCKET } = await import("./r2");
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    const s3 = createR2Client();
    const result = await s3.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET(), Prefix: "lyrics/" })
    );
    const names = (result.Contents ?? [])
      .map((o) => o.Key ?? "")
      .filter((k) => k.endsWith(".lrc"))
      .map((k) =>
        normalizeLyricsName(k.replace(/^lyrics\//, "").replace(/\.lrc$/, ""))
      );
    return new Set(names);
  } catch {
    return new Set();
  }
}

/** トラックリストに hasLyrics フィールドを付与 */
async function annotateHasLyrics(tracks: Track[]): Promise<Track[]> {
  const lyricsSet = await fetchLyricsNormalizedSet();
  if (lyricsSet.size === 0) return tracks;
  return tracks.map((t) => ({
    ...t,
    hasLyrics: lyricsSet.has(
      normalizeLyricsName(t.filename.replace(/\.[^.]+$/, ""))
    ),
  }));
}

/**
 * サーバーコンポーネント用: 環境に応じて曲一覧を返す
 * 優先度: R2の tracks.json → ローカルDropboxフォルダ → tracks.ts ハードコードリスト
 */
export async function loadTracksServer(): Promise<Track[]> {
  const r2Base = process.env.NEXT_PUBLIC_R2_URL;

  if (r2Base) {
    // 本番環境: R2の公開URLからトラックリストを取得
    try {
      const res = await fetch(`${r2Base}/tracks.json`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        console.error("R2 tracks.json fetch failed:", res.status);
      } else {
        const list = (await res.json()) as Track[];
        if (list.length > 0) return annotateHasLyrics(list);
      }
    } catch (e) {
      console.error("R2 tracks.json error:", e);
    }
  }

  // ローカルDropboxフォルダ（Windowsのみ）
  const local = loadTracksFromFolder();
  if (local.length > 0) return local;

  // 最終フォールバック: tracks.ts のハードコードリスト
  const { tracks } = await import("./tracks");
  return tracks;
}
