import * as cheerio from 'cheerio';
import type { FoodVendor, PriceRange } from '@/types';
import shopAreas from '@/data/shop-areas.json';
import { normalizeShopName } from '@/lib/normalize';

const BASE_URL   = 'https://morimichiichiba.jp';
const MARKET_URL = `${BASE_URL}/market/`;
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MAX_PAGES  = 100;

// ─── ユーティリティ ───────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[\s　]+/g, '-').replace(/[^\w\-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '') || String(Date.now());
}
function stripHtml(h: string) { return h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

// カテゴリ判定（scripts/utils/guessCategory.ts と同一ロジック）
function guessCategory(text: string) {
  type Cat = FoodVendor['categories'][number];
  const RULES: Array<[Cat, RegExp]> = [
    ['コーヒー・カフェ',   /coffee|café|カフェ|珈琲|コーヒー|喫茶|roast(?:ery)?/i],
    ['お酒・ワイン・ビール', /brew(?:ing|ery)?|beer|ビール|hazy|craft.?beer|wine|ワイン|日本酒|焼酎|ウイスキー/i],
    ['パン・スイーツ',    /boulangerie|ブーランジェリー|bake(?:ry)?|パン|patisserie|パティスリー|sweets|muffin|アイスクリーム|ice.?cream|菓子|おやつ|wagashi|nut.?butter|ナッツ/i],
    ['カレー・インド料理',  /ビリヤニ|biryani|chapati|チャパティ|curry|カレー|インド/i],
    ['アジア料理',       /ベトナム|タイ|ラオス|中東|エスニック|ethnic|sabaisabai|サバイサバイ/i],
    ['和食・定食',       /食堂|定食|丼|おにぎり|ごはん|玄米|発酵|和食|酒場|居酒屋|炊|もち|そば|うどん|ラーメン|麺/i],
    ['ドリンク',        /chai|チャイ|latte|milk.?tea|ミルクティー|juice|ジュース|tea(?!m)|rum.?chai/i],
    ['クラフト・工芸',    /pottery|ceramics|陶|工房|工芸|手仕事|テキスタイル|textile|weav/i],
    ['ファッション',     /supply|ranch|apparel|clothing|hat|帽子/i],
    ['本・音楽・アート',  /book|zine|record|music|本屋|画廊|art(?!isan)|gallery|photo|写真/i],
  ];
  const result: Cat[] = [];
  for (const [cat, re] of RULES) {
    if (re.test(text)) result.push(cat);
  }
  return result.length ? result : (['その他'] as Cat[]);
}

// ─── HTML パース ─────────────────────────────────────────────
// morimichiichiba.jp/market/ の構造:
//   全店舗は #market_shop_list .column に含まれる（ページネーションなし）
//   店舗名: h2.c_title
//   画像:   span[data-bg] の CSS背景（lazy-load）
//   URL:    a.modal_view[href]

function parsePageVendors(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const vendors: FoodVendor[] = [];
  const seen = new Set<string>();

  // 主セレクタ: #market_shop_list .column
  let $items = $('#market_shop_list .column');

  // フォールバック: div[id^="market_"] （market_shop_list 自体を除く）
  if ($items.length === 0) {
    $items = $('div[id^="market_"]').filter((_, el) => {
      const id = $(el).attr('id') ?? '';
      return id !== 'market_shop_list' && id !== 'market_page' && id !== 'market_list';
    });
  }

  $items.each((_, el) => {
    const $el = $(el);
    const name = $el.find('.c_title, h2').first().text().trim().replace(/\s+/g, ' ');
    if (!name || name.length > 100 || name.length < 2 || seen.has(name)) return;

    // 画像: span の data-bg 属性（cheerio は静的HTML属性を読める）
    const imgSrc = $el.find('span[data-bg]').first().attr('data-bg')
      ?? $el.find('span[style*="background-image"]').first().attr('style')
          ?.match(/url\(["']?([^"')]+)["']?\)/)?.[1];

    // 店舗詳細URL
    const sourceUrl = $el.find('a.modal_view, a[data-target]').first().attr('href') ?? pageUrl;

    // かな読み (data-name 属性)
    const kana = $el.attr('data-name') ?? '';

    seen.add(name);
    const fullUrl = sourceUrl.startsWith('http') ? sourceUrl : `${BASE_URL}${sourceUrl}`;
    const urlNum = fullUrl.match(/\/(\d+)\/?$/)?.[1];
    const id = urlNum ? `market-${urlNum}` : slugify(name);
    vendors.push({
      id, name,
      area: 'マーケット', areaId: 'market',
      categories: guessCategory(name + ' ' + kana),
      menuItems: [],
      priceRange: '¥500〜¥1,000',
      allergenTags: [],
      imageUrl: imgSrc || undefined,
      days: ['05-22', '05-23', '05-24'],
      description: kana ? `よみ: ${kana}` : undefined,
      sourceUrl: fullUrl,
      scrapedAt: new Date().toISOString(),
    });
  });

  return { vendors };
}

// ─── WP REST API 全ページ取得 ────────────────────────────────

async function tryWpApiAll(): Promise<FoodVendor[] | null> {
  const POST_TYPES = ['market', 'vendor', 'commune', 'food', 'shop'];
  for (const postType of POST_TYPES) {
    try {
      const firstRes = await fetch(
        `${BASE_URL}/wp-json/wp/v2/${postType}?per_page=100&page=1&_embed`,
        { next: { revalidate: 3600 }, headers: { 'User-Agent': BROWSER_UA } }
      );
      if (!firstRes.ok) continue;
      const totalPages = parseInt(firstRes.headers.get('x-wp-totalpages') ?? '1', 10);
      const firstPosts = await firstRes.json() as unknown[];
      if (!Array.isArray(firstPosts) || firstPosts.length === 0) continue;

      const allPosts = [...firstPosts];
      for (let page = 2; page <= Math.min(totalPages, MAX_PAGES); page++) {
        const res = await fetch(
          `${BASE_URL}/wp-json/wp/v2/${postType}?per_page=100&page=${page}&_embed`,
          { next: { revalidate: 3600 }, headers: { 'User-Agent': BROWSER_UA } }
        );
        if (!res.ok) break;
        const posts = await res.json() as unknown[];
        allPosts.push(...(posts as typeof firstPosts));
      }

      return (allPosts as Array<{
        id: number; slug: string;
        title: { rendered: string }; content: { rendered: string };
        excerpt: { rendered: string }; link: string;
        _embedded?: { 'wp:featuredmedia'?: Array<{ source_url: string }>; 'wp:term'?: Array<Array<{ name: string; slug: string }>> };
      }>).map(p => ({
        id: p.slug || slugify(stripHtml(p.title?.rendered ?? '')),
        name: stripHtml(p.title?.rendered ?? ''),
        area: p._embedded?.['wp:term']?.[0]?.[0]?.name ?? 'マーケット',
        areaId: p._embedded?.['wp:term']?.[0]?.[0]?.slug ?? 'market',
        categories: guessCategory(stripHtml(p.content?.rendered ?? '') + ' ' + stripHtml(p.title?.rendered ?? '')),
        menuItems: [], priceRange: '¥500〜¥1,000' as PriceRange,
        allergenTags: [],
        imageUrl: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
        days: ['05-22', '05-23', '05-24'] as const,
        description: stripHtml(p.excerpt?.rendered ?? '').slice(0, 200) || undefined,
        sourceUrl: p.link, scrapedAt: new Date().toISOString(),
      }));
    } catch { /* 次の候補へ */ }
  }
  return null;
}

// ─── HTML 取得（全店舗は /market/ の1ページに含まれる） ──────

async function tryHtmlScrapeAll(): Promise<FoodVendor[] | null> {
  try {
    const res = await fetch(MARKET_URL, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': BROWSER_UA, 'Accept': 'text/html', 'Accept-Language': 'ja' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const { vendors } = parsePageVendors(html, MARKET_URL);
    return vendors.length > 0 ? vendors : null;
  } catch {
    return null;
  }
}

// ─── エクスポート ────────────────────────────────────────────

export type FoodSource = 'json' | 'html' | 'api';

function applyShopAreas(vendors: FoodVendor[]): FoodVendor[] {
  const areaById = new Map(shopAreas.areas.map((a) => [a.id, a]));
  const index = shopAreas.shopAreaIndex as Record<string, string>;
  return vendors.map((v) => {
    const areaId = index[normalizeShopName(v.name)];
    if (!areaId) return v;
    const area = areaById.get(areaId);
    if (!area) return v;
    return { ...v, area: area.name, areaId };
  });
}

export async function loadFood(): Promise<{ items: FoodVendor[]; source: FoodSource }> {
  // food.json（npm run scrape:food で生成）を最優先で使う
  const { default: foodJson } = await import('@/data/food.json');
  const cached = foodJson as FoodVendor[];
  if (cached.length > 0) return { items: applyShopAreas(cached), source: 'json' };

  // food.json が空のときのみライブ取得を試みる
  const htmlItems = await tryHtmlScrapeAll();
  if (htmlItems && htmlItems.length > 0) return { items: applyShopAreas(htmlItems), source: 'html' };

  const apiItems = await tryWpApiAll();
  if (apiItems && apiItems.length > 0) return { items: applyShopAreas(apiItems), source: 'api' };

  return { items: [], source: 'json' };
}
