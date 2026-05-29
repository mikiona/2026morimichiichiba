'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ScheduleEntry, FestivalDay } from '@/types';
import { FESTIVAL_DAYS, DAY_LABELS } from '@/types';
import { STAGE_SHORT_NAMES, STAGE_COLORS } from '@/lib/constants';
import { findConflicts } from '@/lib/schedule/timeUtils';
import { useFavorites } from '@/lib/favorites/useFavorites';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { EmptyState } from '@/components/ui/EmptyState';

interface MyScheduleClientProps {
  schedule: ScheduleEntry[];
}

export function MyScheduleClient({ schedule }: MyScheduleClientProps) {
  const { favorites, count, hydrated } = useFavorites();
  const [selectedDay, setSelectedDay] = useState<FestivalDay>('05-22');

  // お気に入りアーティストの公演のみ抽出
  const myEntries = useMemo(
    () => schedule.filter((s) => favorites.has(s.artistName)),
    [schedule, favorites]
  );

  const conflicts = useMemo(() => findConflicts(myEntries), [myEntries]);

  const dayEntries = useMemo(
    () =>
      myEntries
        .filter((e) => e.day === selectedDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [myEntries, selectedDay]
  );

  // ハイドレーション前は空表示（ちらつき防止）
  if (!hydrated) {
    return <div className="py-16 text-center text-gray-300 text-sm">読み込み中…</div>;
  }

  if (count === 0) {
    return (
      <div>
        <EmptyState message="まだお気に入りがありません" />
        <p className="text-center text-sm text-gray-500 -mt-8">
          <Link href="/artists" className="text-emerald-600 hover:text-emerald-800 underline">
            アーティスト検索
          </Link>
          {' '}で☆を付けると、ここに個人スケジュールが表示されます
        </p>
      </div>
    );
  }

  const dayCount = (day: FestivalDay) => myEntries.filter((e) => e.day === day).length;

  return (
    <div>
      {/* Day selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FESTIVAL_DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
              selectedDay === day
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
            }`}
          >
            {DAY_LABELS[day]}
            {dayCount(day) > 0 && (
              <span
                className={`ml-1.5 text-xs ${
                  selectedDay === day ? 'text-emerald-100' : 'text-gray-400'
                }`}
              >
                {dayCount(day)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 重複警告サマリー */}
      {conflicts.size > 0 && dayEntries.some((e) => conflicts.has(e.id)) && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          ⚠️ 出演時間が重複している公演があります。下の <span className="font-semibold">時間が重複</span> の表示をご確認ください。
        </div>
      )}

      {/* タイムライン */}
      {dayEntries.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          この日のお気に入り公演はありません
        </p>
      ) : (
        <ol className="space-y-2">
          {dayEntries.map((e) => {
            const conflicted = conflicts.has(e.id);
            return (
              <li
                key={e.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  conflicted ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-700 tabular-nums">
                  {e.startTime}〜{e.endTime}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{e.artistName}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-white text-xs ${STAGE_COLORS[e.stage]}`}>
                      {STAGE_SHORT_NAMES[e.stage]}
                    </span>
                    <span className="text-xs text-gray-400">{e.stageArea}</span>
                    {conflicted && (
                      <span className="text-xs font-semibold text-amber-700">⚠️ 時間が重複</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FavoriteButton artistName={e.artistName} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
