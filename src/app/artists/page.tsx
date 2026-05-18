import { loadArtists } from '@/lib/data/loadArtists';
import { loadSchedule } from '@/lib/data/loadSchedule';
import { ArtistSearchClient } from '@/components/artists/ArtistSearchClient';

export const metadata = {
  title: 'アーティスト検索 | 森道市場 2026',
};

export default function ArtistsPage() {
  const artists = loadArtists();
  const schedule = loadSchedule();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🎸 アーティスト検索</h1>
        <p className="text-sm text-gray-500 mt-1">
          全 {artists.length} 組 — ジャンル・出演日・ステージで絞り込み
        </p>
      </div>
      <ArtistSearchClient artists={artists} schedule={schedule} />
    </div>
  );
}
