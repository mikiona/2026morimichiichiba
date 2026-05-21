import React from 'react';
import Link from 'next/link';
import type { FoodVendor } from '@/types';
import { Badge } from '@/components/ui/Badge';

const CATEGORY_EMOJI: Record<string, string> = {
  'コーヒー・カフェ':      '☕',
  'お酒・ワイン・ビール':   '🍻',
  'パン・スイーツ':    '🍞',
  'カレー・インド料理':  '🍛',
  'アジア料理':       '🥢',
  '和食・定食':       '🍱',
  'ドリンク':        '🥤',
  'クラフト・工芸':    '🏺',
  'ファッション':     '👗',
  '本・音楽・アート':  '📚',
  '雑貨・生活用品':   '🧴',
  '古着・ヴィンテージ': '🧥',
  'フラワー・グリーン': '🌿',
  'その他':         '🏷️',
};

interface FoodCardProps {
  vendor: FoodVendor;
}

export function FoodCard({ vendor }: FoodCardProps) {
  const primaryCategory = vendor.categories[0] ?? 'その他';
  const emoji = CATEGORY_EMOJI[primaryCategory] ?? '🛍️';

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-emerald-300 transition-all">
      <a
        href={vendor.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 pb-2"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{vendor.name}</h3>
          <span className="text-2xl flex-shrink-0" aria-label={primaryCategory}>{emoji}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {vendor.categories.filter((c) => c !== 'その他').slice(0, 3).map((c) => (
            <Badge key={c} variant="green">{c}</Badge>
          ))}
          {vendor.categories[0] === 'その他' && (
            <Badge variant="gray">その他</Badge>
          )}
        </div>
      </a>

      <div className="px-4 pb-3">
        <Link
          href={`/map?q=${encodeURIComponent(vendor.name)}`}
          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium"
        >
          🗺️ マップで見る
        </Link>
      </div>
    </div>
  );
}
