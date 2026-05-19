import * as cheerio from 'cheerio';
import type { FoodVendor, FoodCategory, AllergenTag, PriceRange, MenuItem } from '@/types';

const BASE_URL   = 'https://morimichiichiba.jp';
const MARKET_URL = `${BASE_URL}/market/`;
const WP_API_CANDIDATES = [
  `${BASE_URL}/wp-json/wp/v2/market?per_page=100&_embed`,
  `${BASE_URL}/wp-json/wp/v2/vendor?per_page=100&_embed`,
  `${BASE_URL}/wp-json/wp/v2/commune?per_page=100&_embed`,
];
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function slugify(s: string) {
  return s.toLowerCase().replace(/[\s　]+/g, '-').replace(/[^\w\-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'vendor';
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
  if (/クラフトビール|craft.*beer/i.test(t)) c.push('クラフトビール');
  if (/ドリンク|カクテル|cocktail/i.test(t)) c.push('ドリンク・カクテル');
  if (/タイ|インド|アジア/i.test(t)) c.push('アジア料理');
  if (/焼き|定食|丼|和食/i.test(t)) c.push('和食');
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

function calcPriceRange(items: MenuItem[]): PriceRange {
  const prices = items.map(i => i.price).filter((p): p is number => p !== undefined);
  if (!prices.length) return '¥500〜¥1,000';
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg < 500)  return '〜¥500';
  if (avg < 1000) return '¥500〜¥1,000';
  if (avg < 1500) return '¥1,000〜¥1,500';
  return '¥1,500〜';
}

function parseVendorsFromHtml(html: string, sourceUrl: string): FoodVendor[] {
  const $ = cheerio.load(html);
  const vendors: FoodVendor[] = [];
  const seen = new Set<string>();
  let currentArea = 'マーケット';
  let currentAreaId = 'market';

  const BLOCK_SEL = '.shop,.store,.vendor,.market-item,.commune-item,.wp-block-group,article,.post,.entry,.item';
  let $blocks = $(BLOCK_SEL).filter((_, el) => {
    const t = $(el).text().trim();
    return t.length > 10 && t.length < 1000;
  });

  if ($blocks.length < 2) $blocks = $('__none__');

  $blocks.each((_, el) => {
    const $el = $(el);
    const areaHdg = $el.closest('[class*="area"],[class*="section"],[class*="commune"]')
      .find('h2,h3,.area-title').first().text().trim();
    if (areaHdg) { currentArea = areaHdg; currentAreaId = slugify(areaHdg); }

    const name = $el.find('h2,h3,h4,strong,.name,.title').first().text().trim().replace(/\s+/g, ' ');
    if (!name || name.length > 80 || seen.has(name)) return;

    const allText = $el.text().replace(/\s+/g, ' ');
    const description = $el.find('p').first().text().trim().slice(0, 200) || undefined;
    const imageUrl = $el.find('img').first().attr('src');

    // メニューアイテム抽出
    const menuItems: MenuItem[] = [];
    const menuSeen = new Set<string>();
    allText.split(/[\n・,、]+/).forEach(line => {
      const priceMatch = line.match(/[¥￥](\d{3,5})/);
      const mname = line.replace(/[¥￥]\d{3,5}/g, '').trim().slice(0, 60);
      if (mname.length > 1 && mname.length < 50 && !menuSeen.has(mname)) {
        menuSeen.add(mname);
        menuItems.push({
          name: mname,
          price: priceMatch ? parseInt(priceMatch[1], 10) : undefined,
          priceLabel: priceMatch ? `¥${priceMatch[1]}` : undefined,
          allergens: guessAllergens(line),
        });
      }
    });

    seen.add(name);
    vendors.push({
      id: slugify(name),
      name,
      area: currentArea,
      areaId: currentAreaId,
      categories: guessCategory(allText),
      menuItems: menuItems.slice(0, 10),
      priceRange: calcPriceRange(menuItems),
      allergenTags: guessAllergens(allText),
      imageUrl,
      days: ['05-22', '05-23', '05-24'],
      description,
      sourceUrl,
      scrapedAt: new Date().toISOString(),
    });
  });

  // フォールバック: h3+p 構造
  if (vendors.length === 0) {
    $('h3,h4').each((_, el) => {
      const name = $(el).text().trim();
      if (!name || name.length > 60 || seen.has(name)) return;
      const desc = $(el).next('p').text().trim().slice(0, 200) || undefined;
      seen.add(name);
      vendors.push({
        id: slugify(name),
        name,
        area: currentArea,
        areaId: currentAreaId,
        categories: guessCategory(name + (desc ?? '')),
        menuItems: [],
        priceRange: '¥500〜¥1,000',
        allergenTags: guessAllergens(desc ?? ''),
        days: ['05-22', '05-23', '05-24'],
        description: desc,
        sourceUrl,
        scrapedAt: new Date().toISOString(),
      });
    });
  }

  return vendors;
}

async function tryWpApi(): Promise<FoodVendor[] | null> {
  for (const apiUrl of WP_API_CANDIDATES) {
    try {
      const res = await fetch(apiUrl, {
        next: { revalidate: 3600 },
        headers: { 'User-Agent': BROWSER_UA },
      });
      if (!res.ok) continue;
      const posts = await res.json() as Array<{
        id: number; slug: string;
        title: { rendered: string };
        content: { rendered: string };
        excerpt: { rendered: string };
        link: string;
        _embedded?: {
          'wp:featuredmedia'?: Array<{ source_url: string }>;
          'wp:term'?: Array<Array<{ name: string; slug: string }>>;
        };
      }>;
      if (!Array.isArray(posts) || posts.length === 0) continue;

      return posts.map(p => {
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
    } catch { /* 次候補へ */ }
  }
  return null;
}

async function tryHtmlScrape(): Promise<FoodVendor[] | null> {
  try {
    const res = await fetch(MARKET_URL, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en-US;q=0.9',
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const items = parseVendorsFromHtml(html, MARKET_URL);
    return items.length > 0 ? items : null;
  } catch { return null; }
}

export type FoodSource = 'api' | 'html' | 'cache';

export async function loadFood(): Promise<{ items: FoodVendor[]; source: FoodSource }> {
  // 1. WP REST API
  const apiItems = await tryWpApi();
  if (apiItems && apiItems.length > 0) {
    return { items: apiItems, source: 'api' };
  }

  // 2. HTMLスクレイピング (/market/)
  const htmlItems = await tryHtmlScrape();
  if (htmlItems && htmlItems.length > 0) {
    return { items: htmlItems, source: 'html' };
  }

  // 3. 静的シードデータ
  const { default: foodJson } = await import('@/data/food.json');
  return { items: foodJson as FoodVendor[], source: 'cache' };
}
