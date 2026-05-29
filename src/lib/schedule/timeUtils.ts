import type { FestivalDay, ScheduleEntry, PlayingStatus } from '@/types';
import { FESTIVAL_YEAR } from '@/lib/constants';

export function toDateOnDay(timeStr: string, day: FestivalDay): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const dayNum = parseInt(day.split('-')[1], 10);
  return new Date(FESTIVAL_YEAR, 4 /* May */, dayNum, h, m, 0);
}

export function getPlayingStatus(
  entry: ScheduleEntry,
  now: Date,
  windowMinutes = 60
): PlayingStatus {
  const start = toDateOnDay(entry.startTime, entry.day);
  const end = entry.endTime ? toDateOnDay(entry.endTime, entry.day) : null;
  const windowMs = windowMinutes * 60 * 1000;

  if (end && now >= end) return 'ended';
  if (now >= start && (!end || now < end)) return 'now-playing';
  if (now < start && start.getTime() - now.getTime() <= windowMs) return 'upcoming-soon';
  return 'future';
}

export function getUpcomingEntries(
  schedule: ScheduleEntry[],
  day: FestivalDay,
  now: Date,
  windowMinutes = 60
): Array<ScheduleEntry & { status: 'now-playing' | 'upcoming-soon' }> {
  return schedule
    .filter((e) => e.day === day)
    .flatMap((e) => {
      const status = getPlayingStatus(e, now, windowMinutes);
      if (status === 'now-playing' || status === 'upcoming-soon') {
        return [{ ...e, status }];
      }
      return [];
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function isFestivalDay(date: Date): FestivalDay | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  if (year !== FESTIVAL_YEAR || month !== 5) return null;
  if (day === 22) return '05-22';
  if (day === 23) return '05-23';
  if (day === 24) return '05-24';
  return null;
}

export function timeToRow(timeStr: string, startHour: number): number {
  // 1 slot = 30 minutes, returns 1-based row index
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = (h - startHour) * 60 + m;
  return Math.floor(totalMinutes / 30) + 1;
}

export function minutesBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

/**
 * 同一日内で出演時間が重複する公演の id 集合を返す。
 * 2公演は同じ day で `aStart < bEnd && bStart < aEnd` のとき重複とみなす。
 */
export function findConflicts(entries: ScheduleEntry[]): Set<string> {
  const conflicts = new Set<string>();
  const byDay = new Map<FestivalDay, ScheduleEntry[]>();
  for (const e of entries) {
    if (!e.endTime) continue;
    const list = byDay.get(e.day) ?? [];
    list.push(e);
    byDay.set(e.day, list);
  }

  for (const list of byDay.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const aStart = toDateOnDay(a.startTime, a.day).getTime();
        const aEnd = toDateOnDay(a.endTime, a.day).getTime();
        const bStart = toDateOnDay(b.startTime, b.day).getTime();
        const bEnd = toDateOnDay(b.endTime, b.day).getTime();
        if (aStart < bEnd && bStart < aEnd) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
  }
  return conflicts;
}
