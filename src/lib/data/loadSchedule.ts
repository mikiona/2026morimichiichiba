import type { ScheduleEntry } from '@/types';
import scheduleJson from '@/data/schedule.json';

export function loadSchedule(): ScheduleEntry[] {
  return scheduleJson as ScheduleEntry[];
}
