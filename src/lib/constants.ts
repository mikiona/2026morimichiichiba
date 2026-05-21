import type { Stage, StageName, StageArea, FestivalDay } from '@/types';

export const FESTIVAL_YEAR = 2026;

export const FESTIVAL_DATES: Record<FestivalDay, { label: string; dayOfWeek: string; openTime: string }> = {
  '05-22': { label: '5月22日', dayOfWeek: '金', openTime: '11:00' },
  '05-23': { label: '5月23日', dayOfWeek: '土', openTime: '10:00' },
  '05-24': { label: '5月24日', dayOfWeek: '日', openTime: '10:00' },
};

export const STAGES: Stage[] = [
  { id: 'grass-stage',   name: 'GRASS STAGE',              area: '海エリア' },
  { id: 'sand-stage',    name: 'SAND STAGE',               area: '海エリア' },
  { id: 'hill-stage',    name: 'HILL STAGE',               area: '海エリア' },
  { id: 'eikyo-stage',   name: '影響亜細亜 STAGE',          area: '海エリア' },
  { id: 'eatbeat-stage', name: 'EATBEAT! STAGE',           area: '海エリア' },
  { id: 'yuenchi-stage', name: '遊園地 STAGE',              area: '遊園地エリア' },
  { id: 'disco-stage',   name: 'MORI.MICHI. DISCO.STAGE',  area: '遊園地エリア' },
  { id: 'art-theater',   name: 'MORI.MICHI. ART THEATER',  area: '遊園地エリア' },
  { id: 'lvrry-stage',   name: 'LVRRY X BLH STAGE',        area: '遊園地エリア' },
];

export const STAGE_SHORT_NAMES: Record<StageName, string> = {
  'GRASS STAGE':              'GRASS',
  'SAND STAGE':               'SAND',
  'HILL STAGE':               'HILL',
  '影響亜細亜 STAGE':          '影響亜細亜',
  'EATBEAT! STAGE':           'EATBEAT!',
  '遊園地 STAGE':              '遊園地',
  'MORI.MICHI. DISCO.STAGE':  'DISCO',
  'MORI.MICHI. ART THEATER':  'ART THEATER',
  'LVRRY X BLH STAGE':        'LVRRY X BLH',
};

export const STAGE_COLORS: Record<StageName, string> = {
  'GRASS STAGE':              'bg-green-600',
  'SAND STAGE':               'bg-amber-600',
  'HILL STAGE':               'bg-lime-700',
  '影響亜細亜 STAGE':          'bg-orange-600',
  'EATBEAT! STAGE':           'bg-red-500',
  '遊園地 STAGE':              'bg-pink-600',
  'MORI.MICHI. DISCO.STAGE':  'bg-purple-600',
  'MORI.MICHI. ART THEATER':  'bg-emerald-600',
  'LVRRY X BLH STAGE':        'bg-blue-700',
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

export const STAGE_MAP_COORDS: Partial<Record<StageName, { x: number; y: number }>> = {
  'GRASS STAGE':             { x: 71, y: 77 },
  'SAND STAGE':              { x: 35, y: 82 },
  'HILL STAGE':              { x: 60, y: 68 },
  '影響亜細亜 STAGE':        { x: 50, y: 72 },
  'EATBEAT! STAGE':          { x: 55, y: 62 },
  '遊園地 STAGE':            { x: 42, y: 37 },
  'MORI.MICHI. DISCO.STAGE': { x: 28, y: 47 },
  'MORI.MICHI. ART THEATER': { x: 58, y: 42 },
  'LVRRY X BLH STAGE':       { x: 38, y: 52 },
};

export const MARKET_ZONE_COORD = { x: 20, y: 22, label: 'MORI MARKET' };

export const OFFICIAL_SITE_URL = 'https://morimichiichiba.jp';
export const VENUE_NAME = 'ラグーナビーチ & ラグーナシア';
export const VENUE_ADDRESS = '愛知県蒲郡市海陽町2-3-1';
