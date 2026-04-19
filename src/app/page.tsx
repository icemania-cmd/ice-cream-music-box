import { loadTracksServer } from "@/lib/trackLoader";
import MusicPlayer from "@/components/MusicPlayer";

// 1時間キャッシュ（PINNED_TRACKS順はsync-r2実行時にR2側で確定するため問題なし）
export const revalidate = 3600;

// サーバーコンポーネント: 環境に応じてR2またはローカルから曲リストを取得
export default async function Home() {
  const initialTracks = await loadTracksServer();
  return <MusicPlayer initialTracks={initialTracks} />;
}
