/**
 * 公式サイト https://morimichiichiba.jp/market/ から
 * フード出店情報を取得して src/data/food.json に保存するスクリプト
 *
 * 実行: npm run scrape:food
 */
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchPageSafe } from './utils/fetchPage';
import type { FoodVendor, FoodCategory, AllergenTag, PriceRange, MenuItem } from '../src/types';

const BASE_URL  = 'https://morimichiichiba.jp';
const MARKET_URL = `${BASE_URL}/market/`;
// WP REST API: カスタム投稿タイプを複数試す
const WP_API_CANDIDATES = [
  `${BASE_URL}/wp-json/wp/v2/market?per_page=100&_embed`,
  `${BASE_URL}/wp-json/wp/v2/vendor?per_page=100&_embed`,
  `${BASE_URL}/wp-json/wp/v2/commune?per_page=100&_embed`,
  `${BASE_URL}/wp-json/wp/v2/food?per_page=100&_embed`,
  `${BASE_URL}/wp-json/wp/v2/shop?per_page=100&_embed`,
];
const OUT_PATH = path.join(process.cwd(), 'src/data/food.json');

// ─── テキスト解析ユーティリティ ───────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function guessCategory(text: string): FoodCategory[] {
  const t = text;
  const cats: FoodCategory[] = [];
  if (/カレー|curry/i.test(t)) cats.push('カレー');
  if (/ケバブ|シャワルマ|中東|トルコ|kebab/i.test(t)) cats.push('ケバブ・中東料理');
  if (/バインミー|ベトナム|vietnamese/i.test(t)) cats.push('ベトナム料理');
  if (/ラーメン|麺|うどん|そば|noodle/i.test(t)) cats.push('ラーメン・麺類');
  if (/バーガー|ハンバーガー|サンドイッチ|burger|sandwich/i.test(t)) cats.push('バーガー・サンドイッチ');
  if (/スイーツ|デザート|ケーキ|アイス|チョコ|菓子|sweet|dessert/i.test(t)) cats.push('スイーツ・デザート');
  if (/コーヒー|カフェ|エスプレッソ|ラテ|珈琲|coffee|cafe/i.test(t)) cats.push('コーヒー・カフェ');
  if (/クラフトビール|craft.*beer|beer.*craft/i.test(t)) cats.push('クラフトビール');
  if (/ドリンク|カクテル|cocktail|drink|juice|ジュース/i.test(t)) cats.push('ドリンク・カクテル');
  if (/タイ|インド|アジア|thai|indian|asian/i.test(t)) cats.push('アジア料理');
  if (/焼き|定食|丼|和食|寿司|天ぷら/i.test(t)) cats.push('和食');
  if (/ピザ|パスタ|イタリア|フレンチ|pizza|pasta|italian/i.test(t)) cats.push('洋食');
  if (cats.length === 0) cats.push('その他');
  return cats;
}

function guessAllergens(text: string): AllergenTag[] {
  const t = text;
  const tags: AllergenTag[] = [];
  if (/ヴィーガン|vegan/i.test(t)) tags.push('ヴィーガン');
  if (/ベジタリアン|vegetarian/i.test(t)) tags.push('ベジタリアン');
  if (/グルテンフリー|gluten.?free/i.test(t)) tags.push('グルテンフリー');
  if (/乳製品不使用|dairy.?free|ノンデイリー/i.test(t)) tags.push('乳製品不使用');
  if (/卵不使用|egg.?free/i.test(t)) tags.push('卵不使用');
  if (/ハラール|halal/i.test(t)) tags.push('ハラール');
  return tags;
}

function calcPriceRange(items: MenuItem[]): PriceRange {
  const prices = items.map(i => i.price).filter((p): p is number => p !== undefined);
  if (prices.length === 0) return '¥500〜¥1,000';
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg < 500)  return '〜¥500';
  if (avg < 1000) return '¥500〜¥1,000';
  if (avg < 1500) return '¥1,000〜¥1,500';
  return '¥1,500〜';
}

// ─── メニューアイテムのパース ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMenuItems($el: any): MenuItem[] {
  const items: MenuItem[] = [];
  const seen = new Set<string>();

  // テキスト全体から価格付きアイテムを正規表現で抽出
  const fullText: string = $el.text();
  const lines = fullText.split(/[\n・。,、\/\|｜]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 1);

  for (const line of lines) {
    const priceMatch = line.match(/[¥￥](\d{3,5})/);
    const price = priceMatch ? parseInt(priceMatch[1], 10) : undefined;
    const name = line.replace(/[¥￥]\d{3,5}/g, '').replace(/^\d+\.\s*/, '').trim().slice(0, 60);
    if (name.length > 1 && name.length < 50 && !seen.has(name)) {
      seen.add(name);
      items.push({
        name,
        price,
        priceLabel: priceMatch ? `¥${priceMatch[1]}` : undefined,
        allergens: guessAllergens(line),
      });
    }
  }
  return items.slice(0, 10); // 1店舗最大10アイテム
}

// ─── WP REST API 試行 ─────────────────────────────────────────

async function tryWpApi(): Promise<FoodVendor[] | null> {
  const { default: axios } = await import('axios');

  for (const apiUrl of WP_API_CANDIDATES) {
    try {
      const res = await axios.get(apiUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Morimichi Fan Site)' },
      });
      const posts = res.data;
      if (!Array.isArray(posts) || posts.length === 0) continue;

      console.log(`[scrape-food] WP API (${apiUrl}): ${posts.length} 件`);
      return posts.map((p: {
        id: number;
        slug: string;
        title: { rendered: string };
        content: { rendered: string };
        excerpt: { rendered: string };
        link: string;
        _embedded?: {
          'wp:featuredmedia'?: Array<{ source_url: string }>;
          'wp:term'?: Array<Array<{ name: string; slug: string }>>;
        };
      }) => {
        const content = stripHtml(p.content?.rendered ?? '');
        const name = stripHtml(p.title?.rendered ?? '');
        const area = p._embedded?.['wp:term']?.[0]?.[0]?.name ?? 'マーケット';
        const areaId = p._embedded?.['wp:term']?.[0]?.[0]?.slug ?? 'market';

        return {
          id: p.slug || slugify(name),
          name,
          area,
          areaId,
          categories: guessCategory(content + ' ' + name),
          menuItems: [],
          priceRange: '¥500〜¥1,000' as PriceRange,
          allergenTags: guessAllergens(content),
          imageUrl: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
          days: ['05-22', '05-23', '05-24'] as const,
          description: stripHtml(p.excerpt?.rendered ?? '').slice(0, 200) || undefined,
          sourceUrl: p.link,
          scrapedAt: new Date().toISOString(),
        } satisfies FoodVendor;
      });
    } catch {
      // 次の候補へ
    }
  }
  return null;
}

// ─── HTML パース: /market/ ページ全体 ────────────────────────

function parseMarketHtml(html: string, sourceUrl: string): FoodVendor[] {
  const $ = cheerio.load(html);
  const vendors: FoodVendor[] = [];
  const seen = new Set<string>();

  // エリアヘッダーを追跡して各ベンダーのエリアを判定
  let currentArea = 'マーケット';
  let currentAreaId = 'market';

  // 全要素を走査してエリア見出しと店舗ブロックを識別
  const AREA_HEADING_SEL = 'h2, h3, .area-title, .section-title, .commune-title';
  const VENDOR_BLOCK_SEL = [
    '.shop', '.store', '.vendor', '.market-item', '.commune-item',
    '.wp-block-group', 'article', '.post',
    '.entry', '.item',
  ].join(', ');

  // 方法1: 明示的な店舗ブロックがある場合
  let $blocks = $(VENDOR_BLOCK_SEL).filter((_, el) => {
    const text = $(el).text().trim();
    return text.length > 10 && text.length < 1000;
  });

  if ($blocks.length >= 2) {
    console.log(`[scrape-food] ブロックセレクタで ${$blocks.length} 件検出`);

    // エリア区切りを抽出
    const areaMap = new Map<string, string>();
    $(AREA_HEADING_SEL).each((_, heading) => {
      const text = $(heading).text().trim();
      if (text.length > 1 && text.length < 40) {
        areaMap.set(text, slugify(text));
      }
    });

    $blocks.each((_, el) => {
      const $el = $(el);

      // エリアを親要素から特定
      const areaEl = $el.closest('[class*="area"], [class*="section"], [class*="commune"]')
        .find(AREA_HEADING_SEL).first();
      if (areaEl.length) {
        currentArea = areaEl.text().trim();
        currentAreaId = slugify(currentArea);
      }

      // 名前: 最初の見出し or strong
      const name = $el.find('h2, h3, h4, strong, .name, .title').first().text().trim()
        .replace(/[\n\t]+/g, ' ').trim();
      if (!name || name.length > 80 || seen.has(name)) return;

      const allText = $el.text().replace(/\s+/g, ' ');
      const description = $el.find('p').first().text().trim().slice(0, 200) || undefined;
      const imageUrl = $el.find('img').first().attr('src');
      const menuItems = parseMenuItems($el);

      seen.add(name);
      vendors.push({
        id: slugify(name),
        name,
        area: currentArea,
        areaId: currentAreaId,
        categories: guessCategory(allText),
        menuItems,
        priceRange: calcPriceRange(menuItems),
        allergenTags: guessAllergens(allText),
        imageUrl,
        days: ['05-22', '05-23', '05-24'],
        description,
        sourceUrl,
        scrapedAt: new Date().toISOString(),
      });
    });
  }

  if (vendors.length > 0) return vendors;

  // 方法2: テーブル形式
  $('table').each((_, table) => {
    $(table).find('tr').each((rowIdx, row) => {
      if (rowIdx === 0) return; // ヘッダー行をスキップ
      const cells = $(row).find('td');
      if (cells.length < 2) return;
      const name = cells.eq(0).text().trim();
      const desc = cells.eq(1).text().trim();
      if (!name || name.length > 80 || seen.has(name)) return;

      seen.add(name);
      vendors.push({
        id: slugify(name),
        name,
        area: currentArea,
        areaId: currentAreaId,
        categories: guessCategory(name + ' ' + desc),
        menuItems: [],
        priceRange: '¥500〜¥1,000',
        allergenTags: guessAllergens(desc),
        days: ['05-22', '05-23', '05-24'],
        description: desc.slice(0, 200) || undefined,
        sourceUrl,
        scrapedAt: new Date().toISOString(),
      });
    });
  });

  // 方法3: 見出し+段落のシンプルな構造
  if (vendors.length === 0) {
    $('h3, h4').each((_, el) => {
      const $el = $(el);
      const name = $el.text().trim();
      if (!name || name.length > 60 || seen.has(name)) return;

      // 直後の p 要素を説明として使用
      const $next = $el.next('p');
      const description = $next.text().trim().slice(0, 200) || undefined;
      const allText = name + ' ' + (description ?? '');

      seen.add(name);
      vendors.push({
        id: slugify(name),
        name,
        area: currentArea,
        areaId: currentAreaId,
        categories: guessCategory(allText),
        menuItems: [],
        priceRange: '¥500〜¥1,000',
        allergenTags: guessAllergens(allText),
        days: ['05-22', '05-23', '05-24'],
        description,
        sourceUrl,
        scrapedAt: new Date().toISOString(),
      });
    });
  }

  return vendors;
}

// ─── サブページリンクの収集と取得 ───────────────────────────────

async function scrapeSubpages(html: string): Promise<FoodVendor[]> {
  const $ = cheerio.load(html);
  const subLinks: Array<{ href: string; text: string }> = [];

  // /market/ 配下のリンクを収集
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const text = $(el).text().trim();
    if (
      (href.startsWith(`${BASE_URL}/market/`) || href.startsWith('/market/')) &&
      href !== MARKET_URL &&
      text.length > 0 &&
      !href.endsWith('.jpg') && !href.endsWith('.png')
    ) {
      const fullHref = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      subLinks.push({ href: fullHref, text });
    }
  });

  const uniqueLinks = [...new Map(subLinks.map(l => [l.href, l])).values()];
  console.log(`[scrape-food] サブページ: ${uniqueLinks.length} 件`);

  const vendors: FoodVendor[] = [];
  for (const { href, text } of uniqueLinks) {
    try {
      const subHtml = await fetchPageSafe(href);
      const subVendors = parseMarketHtml(subHtml, href);

      // サブページ名をエリアとして使用
      const areaName = text.replace(/\n/g, '').trim();
      const areaId = slugify(areaName);
      subVendors.forEach(v => {
        v.area = areaName;
        v.areaId = areaId;
      });

      console.log(`[scrape-food]   └ ${areaName}: ${subVendors.length} 店舗`);
      vendors.push(...subVendors);
    } catch (err: unknown) {
      console.warn(`[scrape-food]   └ ${href} 失敗:`, (err as Error).message);
    }
  }
  return vendors;
}

// ─── メイン ───────────────────────────────────────────────────

async function main() {
  console.log('[scrape-food] 開始...');
  console.log(`[scrape-food] ターゲット: ${MARKET_URL}`);

  let vendors: FoodVendor[] = [];

  // 1. WP REST API を試す
  const apiVendors = await tryWpApi();
  if (apiVendors && apiVendors.length > 0) {
    vendors = apiVendors;
  } else {
    // 2. /market/ ページを HTML スクレイピング
    console.log('[scrape-food] HTMLスクレイピング開始...');
    const html = await fetchPageSafe(MARKET_URL);
    vendors = parseMarketHtml(html, MARKET_URL);
    console.log(`[scrape-food] /market/ から ${vendors.length} 店舗取得`);

    // 3. サブページがあれば追加取得
    if (vendors.length < 5) {
      console.log('[scrape-food] サブページを探索...');
      const subVendors = await scrapeSubpages(html);
      vendors.push(...subVendors);
    }
  }

  // 重複排除
  const seen = new Set<string>();
  const unique = vendors.filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  console.log(`[scrape-food] 合計 ${unique.length} 店舗を取得`);

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(unique, null, 2), 'utf-8');
  console.log(`[scrape-food] ${OUT_PATH} に保存しました`);
}

main().catch((err) => {
  console.error('[scrape-food] エラー:', err.message);
  process.exit(1);
});
