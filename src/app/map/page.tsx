import { VenueMap } from '@/components/map/VenueMap';
import { STAGES, STAGE_SHORT_NAMES, STAGE_COLORS } from '@/lib/constants';
import type { StageName } from '@/types';

export const metadata = { title: '会場マップ | 森道市場 2026' };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const highlight = STAGES.find((st) => st.id === s)?.name as StageName | undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">🗺️ 会場マップ</h1>
      <p className="text-sm text-gray-500 mb-4">ラグーナビーチ &amp; ラグーナシア</p>

      {highlight && (
        <div className="mb-3 flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-white text-sm font-bold ${STAGE_COLORS[highlight]}`}>
            {STAGE_SHORT_NAMES[highlight]}
          </span>
          <span className="text-sm text-gray-600">をハイライト中</span>
        </div>
      )}

      <VenueMap highlightStage={highlight} />

      <p className="text-xs text-gray-400 mt-3 text-center">
        ※ ピン位置は目安です。実際の配置は当日会場案内をご確認ください
      </p>
    </div>
  );
}
