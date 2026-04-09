import { loadTracksServer } from "@/lib/trackLoader";
import MusicPlayer from "@/components/MusicPlayer";

// 毎リクエストごとにR2から最新のtracks.jsonを取得（SSRキャッシュ無効化）
// → リロード時もPINNED_TRACKS順が正しく反映される
export const dynamic = "force-dynamic";

// サーバーコンポーネント: 環境に応じてR2またはローカルから曲リストを取得
export default async function Home() {
  const initialTracks = await loadTracksServer();
  return <MusicPlayer initialTracks={initialTracks} />;
}
