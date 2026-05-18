'use client';
import React, { useState, useEffect, useRef } from 'react';
import type { ScheduleEntry, FestivalDay } from '@/types';
import { FESTIVAL_DAYS, DAY_LABELS } from '@/types';
import {
  STAGES,
  STAGE_SHORT_NAMES,
  STAGE_COLORS,
  TIMETABLE_START_HOUR,
  TIMETABLE_END_HOUR,
  SLOT_MINUTES,
  TOTAL_SLOTS,
} from '@/lib/constants';
import {
  getPlayingStatus,
  getUpcomingEntries,
  isFestivalDay,
  timeToRow,
  minutesBetween,
} from '@/lib/schedule/timeUtils';

interface TimetableClientProps {
  schedule: ScheduleEntry[];
}

function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Generate time labels
const TIME_LABELS: string[] = [];
for (let h = TIMETABLE_START_HOUR; h <= TIMETABLE_END_HOUR; h++) {
  TIME_LABELS.push(formatTime(h, 0));
  if (h < TIMETABLE_END_HOUR) TIME_LABELS.push(formatTime(h, 30));
}

export function TimetableClient({ schedule }: TimetableClientProps) {
  const [now, setNow] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<FestivalDay>(() => {
    const today = isFestivalDay(new Date());
    return today ?? '05-22';
  });
  const [showUpcoming, setShowUpcoming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayFestival = isFestivalDay(now);
  const daySchedule = schedule.filter((e) => e.day === selectedDay);

  const upcoming = showUpcoming
    ? getUpcomingEntries(schedule, selectedDay, now, 60)
    : [];

  // Current time row position (for indicator)
  const nowRowFraction = todayFestival === selectedDay
    ? (() => {
        const totalMin = (now.getHours() - TIMETABLE_START_HOUR) * 60 + now.getMinutes();
        return totalMin / SLOT_MINUTES;
      })()
    : null;

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
            {isFestivalDay(now) === day && (
              <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            )}
          </button>
        ))}

        {/* Upcoming toggle */}
        <button
          type="button"
          onClick={() => setShowUpcoming(!showUpcoming)}
          className={`ml-auto px-4 py-2 rounded-lg font-medium text-sm transition-colors border flex items-center gap-1.5 ${
            showUpcoming
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showUpcoming ? 'bg-white' : 'bg-red-400'} animate-pulse`} />
          もうすぐ始まる
        </button>
      </div>

      {/* Upcoming banner */}
      {showUpcoming && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">⚡ 直近60分の公演</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-amber-600">現在演奏中または直近60分に始まる公演はありません</p>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    e.status === 'now-playing'
                      ? 'bg-red-100 border border-red-300'
                      : 'bg-white border border-amber-200'
                  }`}
                >
                  {e.status === 'now-playing' && (
                    <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      NOW
                    </span>
                  )}
                  <span className="font-medium text-gray-900">{e.artistName}</span>
                  <span className="text-gray-500">{e.startTime}〜{e.endTime}</span>
                  <span className={`px-2 py-0.5 rounded text-white text-xs ${STAGE_COLORS[e.stage]}`}>
                    {STAGE_SHORT_NAMES[e.stage]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timetable grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white" ref={containerRef}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `60px repeat(${STAGES.length}, minmax(120px, 1fr))`,
            gridTemplateRows: `40px repeat(${TOTAL_SLOTS}, 24px)`,
            minWidth: `${60 + STAGES.length * 130}px`,
            position: 'relative',
          }}
        >
          {/* Header row: stage names */}
          <div className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200" style={{ gridRow: 1, gridColumn: 1 }} />
          {STAGES.map((stage, i) => (
            <div
              key={stage.id}
              className="border-b border-r border-gray-200 bg-gray-50 px-2 py-1 flex flex-col items-center justify-center"
              style={{ gridRow: 1, gridColumn: i + 2 }}
            >
              <span className={`text-xs font-bold text-white px-2 py-0.5 rounded ${STAGE_COLORS[stage.name]}`}>
                {STAGE_SHORT_NAMES[stage.name]}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">{stage.area}</span>
            </div>
          ))}

          {/* Time axis + row backgrounds */}
          {TIME_LABELS.map((label, rowIdx) => {
            const isHour = label.endsWith(':00');
            return (
              <React.Fragment key={label}>
                {/* Time label */}
                <div
                  className={`sticky left-0 z-10 border-r border-gray-200 flex items-start pl-1 pt-0.5 ${
                    isHour ? 'border-t border-gray-300 bg-gray-50' : 'bg-gray-50'
                  }`}
                  style={{ gridRow: rowIdx + 2, gridColumn: 1 }}
                >
                  {isHour && (
                    <span className="text-xs text-gray-500 font-medium leading-none">{label}</span>
                  )}
                </div>

                {/* Row backgrounds for each stage */}
                {STAGES.map((stage, colIdx) => (
                  <div
                    key={`${label}-${stage.id}`}
                    className={`border-r ${isHour ? 'border-t border-gray-200' : 'border-gray-100'} border-gray-100`}
                    style={{ gridRow: rowIdx + 2, gridColumn: colIdx + 2 }}
                  />
                ))}
              </React.Fragment>
            );
          })}

          {/* Schedule entries */}
          {daySchedule.map((entry) => {
            if (!entry.endTime) return null;
            const stageIdx = STAGES.findIndex((s) => s.name === entry.stage);
            if (stageIdx === -1) return null;

            const startRow = timeToRow(entry.startTime, TIMETABLE_START_HOUR);
            const durationSlots = Math.round(minutesBetween(entry.startTime, entry.endTime) / SLOT_MINUTES);
            if (startRow < 1 || durationSlots < 1) return null;

            const status = getPlayingStatus(entry, now);

            return (
              <div
                key={entry.id}
                className={`m-0.5 rounded-lg p-1.5 overflow-hidden cursor-default transition-shadow hover:shadow-md z-20 ${
                  status === 'now-playing'
                    ? 'ring-2 ring-red-500 ring-offset-1'
                    : status === 'ended'
                    ? 'opacity-40'
                    : ''
                } ${STAGE_COLORS[entry.stage]} text-white`}
                style={{
                  gridRow: `${startRow + 1} / span ${durationSlots}`,
                  gridColumn: stageIdx + 2,
                }}
                title={`${entry.artistName} ${entry.startTime}〜${entry.endTime}`}
              >
                <div className="text-xs font-bold leading-tight truncate">{entry.artistName}</div>
                <div className="text-xs opacity-80 leading-tight">{entry.startTime}〜{entry.endTime}</div>
                {status === 'now-playing' && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-bold opacity-90">NOW</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Current time indicator */}
          {nowRowFraction !== null && nowRowFraction > 0 && nowRowFraction < TOTAL_SLOTS && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
              style={{
                top: `${40 + nowRowFraction * 24}px`,
                gridColumn: `1 / span ${STAGES.length + 1}`,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 ml-14 flex-shrink-0" />
              <div className="flex-1 h-0.5 bg-red-400 opacity-70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
