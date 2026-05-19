import { loadFood } from '@/lib/data/loadFood';
import { FoodSearchClient } from '@/components/food/FoodSearchClient';
import { OFFICIAL_SITE_URL } from '@/lib/constants';

export const revalidate = 3600; // 1時間ごとに再取得

export const metadata = {
  title: 'ショップ検索 | 森道市場 2026',
};

const SOURCE_LABELS = {
  json: { label: 'スクレイプ済みデータ', color: 'bg-emerald-100 text-emerald-800' },
  html: { label: 'ライブ取得 (HTML)',    color: 'bg-sky-100 text-sky-800' },
  api:  { label: 'ライブ取得 (API)',     color: 'bg-amber-100 text-amber-800' },
};

export default async function FoodPage() {
  const { items: vendors, source } = await loadFood();
  const sourceInfo = SOURCE_LABELS[source];

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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">
              全 {vendors.length} 店舗 — ジャンルで絞り込み
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceInfo.color}`}>
              {sourceInfo.label}
            </span>
          </div>
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
