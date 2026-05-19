import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchPageSafe } from './utils/fetchPage';
import type { FoodVendor, FoodCategory, AllergenTag, PriceRange, MenuItem } from '../src/types';

const BASE_URL = 'https://morimichiichiba.jp';
const COMMUNE_INDEX = `${BASE_URL}/commune/`;
const AREA_INDEX    = `${BASE_URL}/area/`;
const OUT_PATH = path.join(process.cwd(), 'src/data/food.json');

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function guessCategory(text: string): FoodCategory[] {
  const t = text.toLowerCase();
  const cats: FoodCategory[] = [];
  if (/カレー/.test(t)) cats.push('カレー');
  if (/ケバブ|シャワルマ|中東|トルコ/.test(t)) cats.push('ケバブ・中東料理');
  if (/バインミー|ベトナム/.test(t)) cats.push('ベトナム料理');
  if (/ラーメン|麺|うどん|そば/.test(t)) cats.push('ラーメン・麺類');
  if (/バーガー|サンドイッチ/.test(t)) cats.push('バーガー・サンドイッチ');
  if (/スイーツ|デザート|ケーキ|アイス|チョコ/.test(t)) cats.push('スイーツ・デザート');
  if (/コーヒー|カフェ|エスプレッソ|ラテ/.test(t)) cats.push('コーヒー・カフェ');
  if (/クラフトビール|beer|ビール/.test(t)) cats.push('クラフトビール');
  if (/ドリンク|カクテル|drinks|juice/.test(t)) cats.push('ドリンク・カクテル');
  if (/アジア|タイ|インド/.test(t)) cats.push('アジア料理');
  if (cats.length === 0) cats.push('その他');
  return cats;
}

function guessAllergens(text: string): AllergenTag[] {
  const t = text.toLowerCase();
  const tags: AllergenTag[] = [];
  if (/ヴィーガン|vegan/.test(t)) tags.push('ヴィーガン');
  if (/ベジタリアン|vegetarian/.test(t)) tags.push('ベジタリアン');
  if (/グルテンフリー|gluten.free/.test(t)) tags.push('グルテンフリー');
  if (/乳製品不使用|dairy.free/.test(t)) tags.push('乳製品不使用');
  if (/ハラール|halal/.test(t)) tags.push('ハラール');
  return tags;
}

function guessPriceRange(items: MenuItem[]): PriceRange {
  const prices = items.map(i => i.price).filter((p): p is number => p !== undefined);
  if (prices.length === 0) return '¥500〜¥1,000';
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg < 500) return '〜¥500';
  if (avg < 1000) return '¥500〜¥1,000';
  if (avg < 1500) return '¥1,000〜¥1,500';
  return '¥1,500〜';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMenuItems($: any, $el: any): MenuItem[] {
  const items: MenuItem[] = [];
  $el.find('li, .menu-item, tr').each((_: unknown, el: unknown) => {
    const text = $(el).text().trim();
    const priceMatch = text.match(/[¥￥](\d{3,5})/);
    const price = priceMatch ? parseInt(priceMatch[1], 10) : undefined;
    const name = text.replace(/[¥￥]\d+/g, '').trim();
    if (name.length > 1) {
      items.push({
        name: name.slice(0, 60),
        price,
        priceLabel: priceMatch ? `¥${priceMatch[1]}` : undefined,
        allergens: guessAllergens(text),
      });
    }
  });
  return items;
}

async function scrapeVendorPage(url: string, areaName: string, areaId: string): Promise<FoodVendor[]> {
  const html = await fetchPageSafe(url);
  const $ = cheerio.load(html);
  const vendors: FoodVendor[] = [];

  // Look for vendor blocks
  const containerSels = ['.shop-item', '.vendor-item', '.commune-shop', '.store-item', 'article'];
  let found = false;

  for (const sel of containerSels) {
    const els = $(sel);
    if (els.length > 1) {
      found = true;
      els.each((_, el) => {
        const $el = $(el);
        const name = $el.find('h3, h4, h2, .shop-name, .store-name').first().text().trim();
        if (!name || name.length > 80) return;

        const descEl = $el.find('p, .description').first();
        const description = descEl.text().trim() || undefined;
        const imageUrl = $el.find('img').first().attr('src');
        const allText = $el.text();
        const menuItems = parseMenuItems($, $el);

        vendors.push({
          id: slugify(name),
          name,
          area: areaName,
          areaId,
          categories: guessCategory(allText),
          menuItems,
          priceRange: guessPriceRange(menuItems),
          allergenTags: guessAllergens(allText),
          imageUrl,
          days: ['05-22', '05-23', '05-24'],
          description,
          sourceUrl: url,
          scrapedAt: new Date().toISOString(),
        });
      });
      break;
    }
  }

  return vendors;
}

async function getSubpageUrls(indexUrl: string): Promise<Array<{ url: string; name: string; id: string }>> {
  const html = await fetchPageSafe(indexUrl);
  const $ = cheerio.load(html);
  const results: Array<{ url: string; name: string; id: string }> = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const text = $(el).text().trim();
    if (href.startsWith(indexUrl) && href !== indexUrl && text) {
      const id = href.replace(indexUrl, '').replace(/\/$/, '');
      if (id && /^\d+$/.test(id)) {
        results.push({ url: href, name: text, id });
      }
    }
  });

  return results;
}

async function main() {
  console.log('[scrape-food] Starting...');
  const allVendors: FoodVendor[] = [];

  for (const indexUrl of [COMMUNE_INDEX, AREA_INDEX]) {
    const areaType = indexUrl.includes('commune') ? '盛り場' : 'エリア';
    let subpages: Array<{ url: string; name: string; id: string }> = [];

    try {
      subpages = await getSubpageUrls(indexUrl);
      console.log(`[scrape-food] ${areaType}: found ${subpages.length} subpages`);
    } catch (err: unknown) {
      console.error(`[scrape-food] Failed to get ${areaType} index:`, (err as Error).message);
    }

    for (const { url, name, id } of subpages) {
      try {
        const vendors = await scrapeVendorPage(url, `${areaType} / ${name}`, id);
        console.log(`[scrape-food] ${name}: ${vendors.length} vendors`);
        allVendors.push(...vendors);
      } catch (err: unknown) {
        console.error(`[scrape-food] Failed ${url}:`, (err as Error).message);
      }
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = allVendors.filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(unique, null, 2), 'utf-8');
  console.log(`[scrape-food] Saved ${unique.length} vendors to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('[scrape-food] Error:', err.message);
  process.exit(1);
});
