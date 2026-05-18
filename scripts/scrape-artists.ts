import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchPageSafe } from './utils/fetchPage';
import type { Artist, FestivalDay, ArtistGenre } from '../src/types';

const BASE_URL = 'https://morimichiichiba.jp';
const DAY_URLS: Array<{ url: string; day: FestivalDay }> = [
  { url: `${BASE_URL}/artist_day01/`, day: '05-22' },
  { url: `${BASE_URL}/artist_day02/`, day: '05-23' },
  { url: `${BASE_URL}/artist_day03/`, day: '05-24' },
];
const OUT_PATH = path.join(process.cwd(), 'src/data/artists.json');

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function guessGenre(name: string): ArtistGenre[] {
  // Very rough heuristic — override manually after scrape
  return ['その他'];
}

async function scrapeDay(url: string, day: FestivalDay): Promise<Omit<Artist, 'days'>[]> {
  const html = await fetchPageSafe(url);
  const $ = cheerio.load(html);
  const artists: Omit<Artist, 'days'>[] = [];

  // Try common selectors for WordPress festival sites
  const selectors = ['.artist-item', '.artist-card', '.artist-list-item', 'article.artist', '.wp-block-columns .wp-block-column'];
  let found = false;

  for (const sel of selectors) {
    const els = $(sel);
    if (els.length > 0) {
      found = true;
      els.each((_, el) => {
        const $el = $(el);
        const name = $el.find('.artist-name, h3, h2, h4, strong').first().text().trim();
        const imageUrl = $el.find('img').first().attr('src');
        const officialUrl = $el.find('a[href*="http"]').filter((_, a) => !$(a).attr('href')?.includes('morimichiichiba')).first().attr('href');

        if (name) {
          artists.push({
            id: slugify(name),
            name,
            genre: guessGenre(name),
            imageUrl,
            officialUrl,
            description: $el.find('p').first().text().trim() || undefined,
            scrapedAt: new Date().toISOString(),
          });
        }
      });
      break;
    }
  }

  if (!found) {
    // Fallback: look for any text that looks like artist names
    $('h3, h4, .name').each((_, el) => {
      const name = $(el).text().trim();
      if (name && name.length > 1 && name.length < 50) {
        artists.push({
          id: slugify(name),
          name,
          genre: ['その他'],
          scrapedAt: new Date().toISOString(),
        });
      }
    });
  }

  return artists;
}

async function main() {
  console.log('[scrape-artists] Starting...');
  const artistMap = new Map<string, Artist>();

  for (const { url, day } of DAY_URLS) {
    console.log(`[scrape-artists] Fetching ${url}...`);
    try {
      const dayArtists = await scrapeDay(url, day);
      console.log(`[scrape-artists] ${day}: ${dayArtists.length} artists`);

      for (const a of dayArtists) {
        if (artistMap.has(a.id)) {
          artistMap.get(a.id)!.days.push(day);
        } else {
          artistMap.set(a.id, { ...a, days: [day] });
        }
      }
    } catch (err: unknown) {
      console.error(`[scrape-artists] Failed ${day}:`, (err as Error).message);
    }
  }

  const artists = Array.from(artistMap.values());
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(artists, null, 2), 'utf-8');
  console.log(`[scrape-artists] Saved ${artists.length} artists to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('[scrape-artists] Error:', err.message);
  process.exit(1);
});
