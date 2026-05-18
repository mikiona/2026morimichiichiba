import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchPageSafe } from './utils/fetchPage';
import type { ScheduleEntry, FestivalDay, StageName, StageArea } from '../src/types';
import { STAGES } from '../src/lib/constants';

const TIMETABLE_URL = 'https://morimichiichiba.jp/timetable/';
const OUT_PATH = path.join(process.cwd(), 'src/data/schedule.json');

function parseTime(raw: string): string {
  // Normalize: "1130" → "11:30", "11:30" → "11:30"
  const cleaned = raw.replace(/[^0-9]/g, '');
  if (cleaned.length === 4) {
    return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
  }
  return raw;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function resolveStage(raw: string): { stage: StageName; area: StageArea } | null {
  const normalized = raw.toLowerCase();
  for (const s of STAGES) {
    if (normalized.includes(s.id) || s.name.toLowerCase().includes(normalized)) {
      return { stage: s.name, area: s.area };
    }
  }
  return null;
}

async function main() {
  console.log('[scrape-timetable] Starting...');
  const html = await fetchPageSafe(TIMETABLE_URL);
  const $ = cheerio.load(html);
  const entries: ScheduleEntry[] = [];

  // Try data-attribute based timetable (common pattern)
  $('[data-start], [data-time]').each((_, el) => {
    const $el = $(el);
    const artistName = $el.find('.artist-name, .name, h4, h3').first().text().trim()
      || $el.text().trim();
    const startRaw = $el.attr('data-start') ?? $el.attr('data-time') ?? '';
    const endRaw   = $el.attr('data-end') ?? '';
    const dayRaw   = $el.closest('[data-day]').attr('data-day') ?? '';
    const stageRaw = $el.closest('[data-stage]').attr('data-stage') ?? '';

    if (!artistName || !startRaw) return;

    const dayMap: Record<string, FestivalDay> = {
      '0522': '05-22', '0523': '05-23', '0524': '05-24',
      '05-22': '05-22', '05-23': '05-23', '05-24': '05-24',
      '1': '05-22', '2': '05-23', '3': '05-24',
    };
    const day = dayMap[dayRaw];
    if (!day) return;

    const stageInfo = resolveStage(stageRaw);
    if (!stageInfo) return;

    const id = `${slugify(artistName)}-${day}-${slugify(stageRaw)}`;
    entries.push({
      id,
      artistId: slugify(artistName),
      artistName,
      day,
      stage: stageInfo.stage,
      stageArea: stageInfo.area,
      startTime: parseTime(startRaw),
      endTime: endRaw ? parseTime(endRaw) : '',
    });
  });

  console.log(`[scrape-timetable] Found ${entries.length} entries`);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(entries, null, 2), 'utf-8');
  console.log(`[scrape-timetable] Saved to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('[scrape-timetable] Error:', err.message);
  process.exit(1);
});
