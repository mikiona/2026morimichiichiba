import { loadFood } from '@/lib/data/loadFood';
import { MapSearchClient } from '@/components/map/MapSearchClient';

export const metadata = { title: '会場マップ | 森道市場 2026' };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { items: vendors } = await loadFood();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">🗺️ 会場マップ</h1>
      <p className="text-sm text-gray-500 mb-4">
        ラグーナビーチ &amp; ラグーナシア — スクロール/ピンチで拡大してショップを確認
      </p>

      <MapSearchClient
        vendors={vendors}
        initialQuery={q ?? ''}
      />
    </div>
  );
}
