import React from 'react';
import type { FoodVendor } from '@/types';
import { Badge } from '@/components/ui/Badge';

const CATEGORY_EMOJI: Record<string, string> = {
  '和食': '🍱', '洋食': '🍽️', 'アジア料理': '🥢', 'カレー': '🍛',
  'ラーメン・麺類': '🍜', 'バーガー・サンドイッチ': '🍔', 'ケバブ・中東料理': '🌯',
  'ベトナム料理': '🥖', 'スイーツ・デザート': '🍰', 'ドリンク・カクテル': '🍹',
  'クラフトビール': '🍺', 'コーヒー・カフェ': '☕', 'その他': '🛒',
};

const ALLERGEN_EMOJI: Record<string, string> = {
  'ヴィーガン': '🌱',
  'ベジタリアン': '🥗',
  'グルテンフリー': 'GF',
  '乳製品不使用': '🥛',
  '卵不使用': '🥚',
  'ハラール': '✓',
};

interface FoodCardProps {
  vendor: FoodVendor;
}

export function FoodCard({ vendor }: FoodCardProps) {
  const topItem = vendor.menuItems[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight">{vendor.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{vendor.area}</p>
        </div>
        <span className="text-2xl flex-shrink-0">
          {CATEGORY_EMOJI[vendor.categories[0]] ?? '🛒'}
        </span>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1 mb-3">
        {vendor.categories.slice(0, 3).map((c) => (
          <Badge key={c} variant="green">{c}</Badge>
        ))}
      </div>

      {/* Top menu item */}
      {topItem && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 text-sm">
          <span className="text-gray-800">{topItem.name}</span>
          {topItem.priceLabel && (
            <span className="ml-2 text-emerald-700 font-medium">{topItem.priceLabel}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Price range */}
        <span className="text-xs font-medium text-gray-500">{vendor.priceRange}</span>

        {/* Allergen tags */}
        {vendor.allergenTags.length > 0 && (
          <div className="flex gap-1">
            {vendor.allergenTags.map((tag) => (
              <span
                key={tag}
                title={tag}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"
              >
                {ALLERGEN_EMOJI[tag] ?? tag[0]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
