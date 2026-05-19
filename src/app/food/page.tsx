import { loadFood } from '@/lib/data/loadFood';
import { FoodSearchClient } from '@/components/food/FoodSearchClient';

export const metadata = {
  title: 'フード検索 | 森道市場 2026',
};

export default function FoodPage() {
  const vendors = loadFood();

  // Build unique area list from data
  const areaMap = new Map<string, string>();
  for (const v of vendors) {
    if (!areaMap.has(v.areaId)) areaMap.set(v.areaId, v.area);
  }
  const areas = Array.from(areaMap.entries()).map(([id, label]) => ({ id, label }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🍜 フード検索</h1>
        <p className="text-sm text-gray-500 mt-1">
          全 {vendors.length} 店舗 — カテゴリ・アレルゲン・価格帯・エリアで絞り込めます
        </p>
      </div>
      <FoodSearchClient vendors={vendors} areas={areas} />
    </div>
  );
}
