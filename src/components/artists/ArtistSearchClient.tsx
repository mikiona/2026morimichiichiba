'use client';
import React, { useState, useMemo } from 'react';
import type { Artist, ScheduleEntry, ArtistFilterState, StageName, FestivalDay } from '@/types';
import { FESTIVAL_DAYS, DAY_LABELS } from '@/types';
import { filterArtists } from '@/lib/filters/filterArtists';
import { STAGES, STAGE_SHORT_NAMES } from '@/lib/constants';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArtistCard } from './ArtistCard';

const INITIAL: ArtistFilterState = {
  query: '',
  genres: [],
  stages: [],
  days: [],
};

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

interface ArtistSearchClientProps {
  artists: Artist[];
  schedule: ScheduleEntry[];
}

export function ArtistSearchClient({ artists, schedule }: ArtistSearchClientProps) {
  const [filter, setFilter] = useState<ArtistFilterState>(INITIAL);
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => filterArtists(artists, schedule, filter), [artists, schedule, filter]);

  const hasActiveFilters = filter.stages.length > 0 || filter.days.length > 0;

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <SearchInput
            value={filter.query}
            onChange={(q) => setFilter((f) => ({ ...f, query: q }))}
            placeholder="アーティスト名で検索"
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
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-4">
          {/* Day */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">出演日</h3>
            <div className="flex gap-2">
              {FESTIVAL_DAYS.map((day) => (
                <FilterChip
                  key={day}
                  label={DAY_LABELS[day]}
                  active={filter.days.includes(day)}
                  onClick={() => setFilter((f) => ({ ...f, days: toggle<FestivalDay>(f.days, day) }))}
                />
              ))}
            </div>
          </div>

          {/* Stage */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ステージ</h3>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <FilterChip
                  key={s.id}
                  label={STAGE_SHORT_NAMES[s.name]}
                  active={filter.stages.includes(s.name)}
                  onClick={() => setFilter((f) => ({ ...f, stages: toggle<StageName>(f.stages, s.name) }))}
                />
              ))}
            </div>
          </div>

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
        {results.length} 組表示中
        {artists.length !== results.length && ` / 全 ${artists.length} 組`}
      </p>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map((a) => (
            <ArtistCard
              key={a.name}
              artist={a}
              schedules={schedule.filter((s) => s.artistId === a.id || s.artistName === a.name)}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="該当するアーティストが見つかりませんでした" />
      )}
    </div>
  );
}
