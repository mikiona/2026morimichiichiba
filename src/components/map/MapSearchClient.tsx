'use client';
import { useState, useMemo } from 'react';
import type { FoodVendor, StageName } from '@/types';
import { SearchInput } from '@/components/ui/SearchInput';
import { VenueMap } from './VenueMap';

interface MapSearchClientProps {
  vendors: FoodVendor[];
  highlightStage?: StageName;
  initialQuery?: string;
}

export function MapSearchClient({ vendors, highlightStage, initialQuery = '' }: MapSearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedVendor, setSelectedVendor] = useState<FoodVendor | null>(() =>
    initialQuery ? vendors.find((v) => v.name === initialQuery) ?? null : null
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.description ?? '').toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query, vendors]);

  const showMarket = selectedVendor !== null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchInput
          value={query}
          onChange={(q) => { setQuery(q); setSelectedVendor(null); }}
          placeholder="ショップ名で検索..."
        />
        {results.length > 0 && !selectedVendor && (
          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
            {results.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVendor(v)}
                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 border-b border-gray-100 last:border-0"
              >
                <span className="font-medium text-gray-900 text-sm">{v.name}</span>
                {v.categories[0] && (
                  <span className="ml-2 text-xs text-gray-400">{v.categories[0]}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedVendor && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900 text-sm">{selectedVendor.name}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              📍 MORI MARKET エリアにあります。地図を拡大してお探しください。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedVendor(null)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
            aria-label="閉じる"
          >×</button>
        </div>
      )}

      <VenueMap highlightStage={highlightStage} highlightMarket={showMarket} />
    </div>
  );
}
