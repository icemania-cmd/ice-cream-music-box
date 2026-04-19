import { loadTracksServer } from "@/lib/trackLoader";
import MusicPlayer from "@/components/MusicPlayer";

// 60秒キャッシュ + バックグラウンド再生成（ISR）
// PINNED_TRACKS順の更新は最大60秒で反映される
export const revalidate = 60;

// サーバーコンポーネント: 環境に応じてR2またはローカルから曲リストを取得
export default async function Home() {
  const initialTracks = await loadTracksServer();
  return <MusicPlayer initialTracks={initialTracks} />;
}
