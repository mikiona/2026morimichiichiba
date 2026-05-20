import { loadFood } from '@/lib/data/loadFood';
import { FoodSearchClient } from '@/components/food/FoodSearchClient';
import { OFFICIAL_SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

export const metadata = {
  title: 'ショップ検索 | 森道市場 2026',
};

export default async function FoodPage() {
  const { items: vendors } = await loadFood();

  const areaMap = new Map<string, string>();
  for (const v of vendors) {
    if (!areaMap.has(v.areaId)) areaMap.set(v.areaId, v.area);
  }
  const areas = Array.from(areaMap.entries()).map(([id, label]) => ({ id, label }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛍️ ショップ検索</h1>
          <p className="text-sm text-gray-500 mt-1">
            全 {vendors.length} 店舗 — ジャンルで絞り込み
          </p>
        </div>
        <a
          href={`${OFFICIAL_SITE_URL}/market/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-600 hover:text-emerald-800 underline flex-shrink-0"
        >
          公式サイトへ →
        </a>
      </div>
      <FoodSearchClient vendors={vendors} areas={areas} />
    </div>
  );
}
