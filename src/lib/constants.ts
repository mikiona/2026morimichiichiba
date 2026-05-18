import type { Stage, StageName, StageArea, FestivalDay } from '@/types';

export const FESTIVAL_YEAR = 2026;

export const FESTIVAL_DATES: Record<FestivalDay, { label: string; dayOfWeek: string; openTime: string }> = {
  '05-22': { label: '5月22日', dayOfWeek: '金', openTime: '11:00' },
  '05-23': { label: '5月23日', dayOfWeek: '土', openTime: '10:00' },
  '05-24': { label: '5月24日', dayOfWeek: '日', openTime: '10:00' },
};

export const STAGES: Stage[] = [
  { id: 'art-theater',  name: 'MORI.MICHI. ART THEATER',  area: '遊園地エリア' },
  { id: 'disco-stage',  name: 'MORI.MICHI. DISCO STAGE',   area: '遊園地エリア' },
  { id: 'garden-stage', name: 'MORI.MICHI. GARDEN STAGE',  area: '遊園地エリア' },
  { id: 'forest-stage', name: 'MORI.MICHI. FOREST STAGE',  area: '海エリア' },
  { id: 'beach-stage',  name: 'MORI.MICHI. BEACH STAGE',   area: '海エリア' },
  { id: 'sea-stage',    name: 'MORI.MICHI. SEA STAGE',     area: '海エリア' },
];

export const STAGE_SHORT_NAMES: Record<StageName, string> = {
  'MORI.MICHI. ART THEATER':  'ART THEATER',
  'MORI.MICHI. DISCO STAGE':  'DISCO STAGE',
  'MORI.MICHI. GARDEN STAGE': 'GARDEN STAGE',
  'MORI.MICHI. FOREST STAGE': 'FOREST STAGE',
  'MORI.MICHI. BEACH STAGE':  'BEACH STAGE',
  'MORI.MICHI. SEA STAGE':    'SEA STAGE',
};

export const STAGE_COLORS: Record<StageName, string> = {
  'MORI.MICHI. ART THEATER':  'bg-emerald-600',
  'MORI.MICHI. DISCO STAGE':  'bg-purple-600',
  'MORI.MICHI. GARDEN STAGE': 'bg-lime-600',
  'MORI.MICHI. FOREST STAGE': 'bg-teal-600',
  'MORI.MICHI. BEACH STAGE':  'bg-sky-600',
  'MORI.MICHI. SEA STAGE':    'bg-blue-600',
};

export const AREA_COLORS: Record<StageArea, string> = {
  '遊園地エリア': 'bg-amber-100 text-amber-800',
  '海エリア':     'bg-sky-100 text-sky-800',
};

export const TIMETABLE_START_HOUR = 10;
export const TIMETABLE_END_HOUR = 22;
// 1 slot = 30 minutes
export const SLOT_MINUTES = 30;
export const TOTAL_SLOTS = ((TIMETABLE_END_HOUR - TIMETABLE_START_HOUR) * 60) / SLOT_MINUTES;

export const OFFICIAL_SITE_URL = 'https://morimichiichiba.jp';
export const VENUE_NAME = 'ラグーナビーチ & ラグーナシア';
export const VENUE_ADDRESS = '愛知県蒲郡市海陽町2-3-1';
