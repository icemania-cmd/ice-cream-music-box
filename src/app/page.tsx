import { loadTracksServer } from "@/lib/trackLoader";
import MusicPlayer from "@/components/MusicPlayer";

// サーバーコンポーネント: 環境に応じてR2またはローカルから曲リストを取得
export default async function Home() {
  const initialTracks = await loadTracksServer();
  return <MusicPlayer initialTracks={initialTracks} />;
}
