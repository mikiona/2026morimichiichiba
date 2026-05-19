import * as cheerio from 'cheerio';
import type { FoodVendor, FoodCategory, AllergenTag, PriceRange } from '@/types';

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

function guessCategory(t: string): FoodCategory[] {
  const c: FoodCategory[] = [];
  if (/カレー|curry/i.test(t)) c.push('カレー');
  if (/ケバブ|シャワルマ|中東|トルコ|kebab/i.test(t)) c.push('ケバブ・中東料理');
  if (/バインミー|ベトナム/i.test(t)) c.push('ベトナム料理');
  if (/ラーメン|麺|うどん|そば/i.test(t)) c.push('ラーメン・麺類');
  if (/バーガー|ハンバーガー|サンドイッチ/i.test(t)) c.push('バーガー・サンドイッチ');
  if (/スイーツ|デザート|ケーキ|アイス|菓子/i.test(t)) c.push('スイーツ・デザート');
  if (/コーヒー|カフェ|珈琲/i.test(t)) c.push('コーヒー・カフェ');
  if (/クラフトビール|craft.?beer/i.test(t)) c.push('クラフトビール');
  if (/ドリンク|カクテル|ジュース/i.test(t)) c.push('ドリンク・カクテル');
  if (/タイ|インド|アジア/i.test(t)) c.push('アジア料理');
  if (/焼き|定食|丼|和食|おにぎり/i.test(t)) c.push('和食');
  if (/ピザ|パスタ|イタリア/i.test(t)) c.push('洋食');
  return c.length ? c : ['その他'];
}

function guessAllergens(t: string): AllergenTag[] {
  const a: AllergenTag[] = [];
  if (/ヴィーガン|vegan/i.test(t)) a.push('ヴィーガン');
  if (/ベジタリアン|vegetarian/i.test(t)) a.push('ベジタリアン');
  if (/グルテンフリー|gluten.?free/i.test(t)) a.push('グルテンフリー');
  if (/乳製品不使用|dairy.?free/i.test(t)) a.push('乳製品不使用');
  if (/ハラール|halal/i.test(t)) a.push('ハラール');
  return a;
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
      allergenTags: guessAllergens(name),
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
        allergenTags: guessAllergens(stripHtml(p.content?.rendered ?? '')),
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

export type FoodSource = 'api' | 'html' | 'cache';

export async function loadFood(): Promise<{ items: FoodVendor[]; source: FoodSource }> {
  const apiItems = await tryWpApiAll();
  if (apiItems && apiItems.length > 0) return { items: apiItems, source: 'api' };

  const htmlItems = await tryHtmlScrapeAll();
  if (htmlItems && htmlItems.length > 0) return { items: htmlItems, source: 'html' };

  const { default: foodJson } = await import('@/data/food.json');
  return { items: foodJson as FoodVendor[], source: 'cache' };
}
