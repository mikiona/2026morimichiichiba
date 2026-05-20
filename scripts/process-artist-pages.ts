/**
 * data/artists/ の HTML から全アーティスト情報を抽出し
 * src/data/artists.json を更新する。
 * 実行: npm run process:artists
 *
 * 読み込み優先順: artist-all.html → artist-day01/02/03.html
 */
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import type { Artist, FestivalDay, ArtistGenre } from '../src/types';

const ARTISTS_DIR  = path.join(process.cwd(), 'data/artists');
const ARTISTS_JSON = path.join(process.cwd(), 'src/data/artists.json');

const DAY_FILES: Array<{ file: string; day: FestivalDay }> = [
  { file: 'artist-day01.html', day: '05-22' },
  { file: 'artist-day02.html', day: '05-23' },
  { file: 'artist-day03.html', day: '05-24' },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || String(Date.now());
}

/** HTML からアーティスト名・画像・URLのリストを抽出 */
function extractArtists(html: string): Array<{
  name: string;
  nameKana?: string;
  imageUrl?: string;
  officialUrl?: string;
}> {
  const $ = cheerio.load(html);
  const results: Array<{ name: string; nameKana?: string; imageUrl?: string; officialUrl?: string }> = [];
  const seen = new Set<string>();

  // 戦略1: .artist_list .column 系（market と同様の構造）
  const colSels = ['.artist_list .column', '.artist-list .column', '.artists .column'];
  for (const sel of colSels) {
    const els = $(sel);
    if (els.length === 0) continue;
    els.each((_, el) => {
      const $el = $(el);
      // 名前: .c_title / h2 / h3 / strong
      const name = $el.find('.c_title, h2, h3, h4, strong').first().text().trim();
      if (!name || seen.has(name)) return;
      seen.add(name);

      // かな: .c_kana / .kana / .reading / small
      const nameKana = $el.find('.c_kana, .kana, .reading').first().text().trim() || undefined;

      // 画像: span[data-bg] か img
      const spanBg = $el.find('span[data-bg]').first().attr('data-bg');
      const imgSrc = $el.find('img').first().attr('src');
      const imageUrl = spanBg || imgSrc || undefined;

      // 外部 URL
      const officialUrl = $el.find('a[href]').filter((_, a) => {
        const h = $(a).attr('href') ?? '';
        return /^https?:\/\//.test(h) && !h.includes('morimichiichiba');
      }).first().attr('href') || undefined;

      results.push({ name, nameKana, imageUrl, officialUrl });
    });
    if (results.length > 0) break;
  }

  // 戦略2: wp-block-image や entry-content 内の h2/h3 群
  if (results.length === 0) {
    $('h2, h3, h4').each((_, el) => {
      const $el = $(el);
      const name = $el.text().trim();
      if (!name || name.length > 60 || seen.has(name)) return;
      // ナビ・ヘッダー系を除外
      if (/メニュー|ナビ|header|footer|copyright|アーティスト一覧/i.test(name)) return;
      seen.add(name);
      const imageUrl = $el.next('img, figure img, .wp-block-image img').first().attr('src') || undefined;
      results.push({ name, imageUrl });
    });
  }

  // 戦略3: li や article 内
  if (results.length === 0) {
    $('article, li').each((_, el) => {
      const $el = $(el);
      const name = $el.find('h2, h3, h4, .name, .title, strong').first().text().trim();
      if (!name || seen.has(name)) return;
      seen.add(name);
      const imageUrl = $el.find('img').first().attr('src') || undefined;
      results.push({ name, imageUrl });
    });
  }

  return results;
}

async function main() {
  if (!fs.existsSync(ARTISTS_DIR)) {
    console.error(`[process-artists] ${ARTISTS_DIR} が見つかりません。`);
    console.error('  先に artists.zip を data/ に展開してください。');
    process.exit(1);
  }

  const now = new Date().toISOString();

  // ──────────────────────────────────────────────────────────
  // Step 1: 全アーティスト一覧ページから名前・画像・URLを取得
  // ──────────────────────────────────────────────────────────
  const allHtmlPath = path.join(ARTISTS_DIR, 'artist-all.html');
  let allArtists: Array<{ name: string; nameKana?: string; imageUrl?: string; officialUrl?: string }> = [];

  if (fs.existsSync(allHtmlPath)) {
    allArtists = extractArtists(fs.readFileSync(allHtmlPath, 'utf-8'));
    console.log(`[process-artists] artist-all.html から ${allArtists.length} 件検出`);
  } else {
    console.warn('[process-artists] artist-all.html がありません — 日別ページのみ使用');
  }

  // ──────────────────────────────────────────────────────────
  // Step 2: 日別ページから出演日を特定
  // ──────────────────────────────────────────────────────────
  const dayMap = new Map<string, FestivalDay[]>(); // name → days[]

  for (const { file, day } of DAY_FILES) {
    const p = path.join(ARTISTS_DIR, file);
    if (!fs.existsSync(p)) {
      console.warn(`[process-artists] ${file} が見つかりません`);
      continue;
    }
    const dayArtists = extractArtists(fs.readFileSync(p, 'utf-8'));
    console.log(`[process-artists] ${file}: ${dayArtists.length} 件`);
    for (const a of dayArtists) {
      const existing = dayMap.get(a.name) ?? [];
      if (!existing.includes(day)) existing.push(day);
      dayMap.set(a.name, existing);

      // allArtists に未登録なら追加
      if (!allArtists.find((x) => x.name === a.name)) {
        allArtists.push(a);
      }
    }
  }

  if (allArtists.length === 0) {
    console.error('[process-artists] アーティストを1件も検出できませんでした。');
    console.error('  HTML の構造を確認してください。');
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────
  // Step 3: 既存 artists.json とマージ（手動設定を保持）
  // ──────────────────────────────────────────────────────────
  const existing: Artist[] = fs.existsSync(ARTISTS_JSON)
    ? JSON.parse(fs.readFileSync(ARTISTS_JSON, 'utf-8'))
    : [];
  const existingMap = new Map(existing.map((a) => [a.name, a]));

  const updated: Artist[] = allArtists.map((a) => {
    const prev = existingMap.get(a.name);
    const days = (dayMap.get(a.name) ?? prev?.days ?? []).sort() as FestivalDay[];
    return {
      id:         prev?.id ?? slugify(a.name),
      name:       a.name,
      nameKana:   prev?.nameKana ?? a.nameKana,
      genre:      prev?.genre   ?? (['その他'] as ArtistGenre[]),
      imageUrl:   a.imageUrl    ?? prev?.imageUrl,
      officialUrl: a.officialUrl ?? prev?.officialUrl,
      days,
      description: prev?.description,
      scrapedAt:  now,
    };
  });

  // ──────────────────────────────────────────────────────────
  // Step 4: 保存・サマリー出力
  // ──────────────────────────────────────────────────────────
  const dayCount = (d: FestivalDay) => updated.filter((a) => a.days.includes(d)).length;
  console.log(`\n[process-artists] 結果:`);
  console.log(`  合計: ${updated.length} 件`);
  console.log(`  5/22: ${dayCount('05-22')} 件`);
  console.log(`  5/23: ${dayCount('05-23')} 件`);
  console.log(`  5/24: ${dayCount('05-24')} 件`);
  console.log(`  出演日不明: ${updated.filter((a) => a.days.length === 0).length} 件`);

  console.log(`\n[process-artists] サンプル:`);
  updated.slice(0, 5).forEach((a) => {
    console.log(`  • ${a.name} [${a.days.join(', ')}]`);
  });

  fs.writeFileSync(ARTISTS_JSON, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`\n[process-artists] ✓ ${ARTISTS_JSON} 更新完了`);
}

main().catch((err) => {
  console.error('[process-artists] エラー:', err.message);
  process.exit(1);
});
