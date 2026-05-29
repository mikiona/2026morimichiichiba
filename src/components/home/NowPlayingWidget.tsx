'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ScheduleEntry } from '@/types';
import { STAGE_SHORT_NAMES, STAGE_COLORS } from '@/lib/constants';
import { getUpcomingEntries, isFestivalDay } from '@/lib/schedule/timeUtils';

interface NowPlayingWidgetProps {
  schedule: ScheduleEntry[];
}

// 1分ごとに更新される現在時刻。サーバー描画時は null。
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // 初回マウント直後と以降1分ごとに更新（次フレームで反映しエフェクト内同期setStateを避ける）
    const tick = () => setNow(new Date());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 60_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);
  return now;
}

export function NowPlayingWidget({ schedule }: NowPlayingWidgetProps) {
  const now = useNow();

  // ハイドレーション前は何も描画しない
  if (!now) return null;

  const today = isFestivalDay(now);

  // 開催日以外は控えめなプレースホルダ（データは捏造しない）
  if (!today) {
    return (
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-center">
        <p className="text-sm text-gray-500">
          🎪 開催中はここに <span className="font-medium text-gray-700">現在のステージ状況</span>（演奏中・まもなく開演）が表示されます
        </p>
        <Link href="/timetable" className="text-sm text-emerald-600 hover:text-emerald-800 underline mt-1 inline-block">
          タイムテーブルを見る →
        </Link>
      </div>
    );
  }

  const entries = getUpcomingEntries(schedule, today, now, 60);

  return (
    <div className="mb-8 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <h2 className="text-base font-bold text-gray-900">今ステージで</h2>
        <span className="text-xs text-gray-500 ml-auto">
          {now.getHours()}:{String(now.getMinutes()).padStart(2, '0')} 現在
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-600">
          現在演奏中、または直近60分に始まる公演はありません
        </p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e) => (
            <div
              key={e.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                e.status === 'now-playing'
                  ? 'bg-red-100 border border-red-300'
                  : 'bg-white border border-orange-200'
              }`}
            >
              {e.status === 'now-playing' ? (
                <span className="flex items-center gap-1 text-red-600 font-bold text-xs flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  NOW
                </span>
              ) : (
                <span className="text-orange-600 font-bold text-xs flex-shrink-0">SOON</span>
              )}
              <span className="font-medium text-gray-900 truncate">{e.artistName}</span>
              <span className="text-gray-500 flex-shrink-0">{e.startTime}〜{e.endTime}</span>
              <span className={`px-2 py-0.5 rounded text-white text-xs flex-shrink-0 ml-auto ${STAGE_COLORS[e.stage]}`}>
                {STAGE_SHORT_NAMES[e.stage]}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link href="/timetable" className="text-sm text-emerald-700 hover:text-emerald-900 underline mt-3 inline-block">
        タイムテーブル全体を見る →
      </Link>
    </div>
  );
}
