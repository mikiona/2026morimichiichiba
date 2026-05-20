'use client';
import React, { useState, useMemo } from 'react';
import type { FoodVendor, FoodFilterState, FoodCategory } from '@/types';
import { filterFood } from '@/lib/filters/filterFood';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FoodCard } from './FoodCard';

const CATEGORIES: FoodCategory[] = [
  // ドリンク系
  'コーヒー・カフェ', 'お酒・ワイン・ビール', 'ドリンク',
  // 食事系
  'パン・スイーツ', 'カレー・インド料理', 'アジア料理', '和食・定食',
  // ファッション系
  'ファッション', '古着・ヴィンテージ',
  // その他系
  'クラフト・工芸', '本・音楽・アート', '雑貨・生活用品', 'フラワー・グリーン', 'その他',
];

const INITIAL: FoodFilterState = {
  query: '',
  categories: [],
  areas: [],
};

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

interface FoodSearchClientProps {
  vendors: FoodVendor[];
  areas: Array<{ id: string; label: string }>;
}

export function FoodSearchClient({ vendors, areas }: FoodSearchClientProps) {
  const [filter, setFilter] = useState<FoodFilterState>(INITIAL);
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => filterFood(vendors, filter), [vendors, filter]);

  // 実際にデータがあるカテゴリだけ表示
  const availableCategories = useMemo(() => {
    const set = new Set(vendors.flatMap((v) => v.categories));
    return CATEGORIES.filter((c) => set.has(c));
  }, [vendors]);

  const hasActiveFilters = filter.categories.length > 0 || filter.areas.length > 0;

  return (
    <div>
      {/* Search bar + toggle */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <SearchInput
            value={filter.query}
            onChange={(q) => setFilter((f) => ({ ...f, query: q }))}
            placeholder="店舗名・よみがなで検索"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1 ${
            hasActiveFilters
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
          </svg>
          絞り込み
          {hasActiveFilters && (
            <span className="ml-1 bg-white text-emerald-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
              {filter.categories.length + filter.areas.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-4">
          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ジャンル</h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((c) => (
                <FilterChip
                  key={c}
                  label={c}
                  active={filter.categories.includes(c)}
                  onClick={() => setFilter((f) => ({ ...f, categories: toggle(f.categories, c) }))}
                />
              ))}
            </div>
          </div>

          {/* Areas — only if multiple distinct areas exist */}
          {areas.length > 1 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">エリア</h3>
              <div className="flex flex-wrap gap-2">
                {areas.map(({ id, label }) => (
                  <FilterChip
                    key={id}
                    label={label}
                    active={filter.areas.includes(id)}
                    onClick={() => setFilter((f) => ({ ...f, areas: toggle(f.areas, id) }))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Clear */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilter(INITIAL)}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              絞り込みをリセット
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-3">
        {results.length} 件表示中
        {vendors.length !== results.length && ` / 全 ${vendors.length} 件`}
      </p>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((v) => (
            <FoodCard key={v.id} vendor={v} />
          ))}
        </div>
      ) : (
        <EmptyState message="該当する店舗が見つかりませんでした" />
      )}
    </div>
  );
}
