import * as cheerio from 'cheerio';
import type { FoodVendor, FoodCategory, AllergenTag, PriceRange, MenuItem } from '@/types';

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

function calcPriceRange(items: MenuItem[]): PriceRange {
  const prices = items.map(i => i.price).filter((p): p is number => p !== undefined);
  if (!prices.length) return '¥500〜¥1,000';
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg < 500)  return '〜¥500';
  if (avg < 1000) return '¥500〜¥1,000';
  if (avg < 1500) return '¥1,000〜¥1,500';
  return '¥1,500〜';
}

// ─── HTML 1ページ分パース ────────────────────────────────────

function parsePageVendors(html: string, pageUrl: string, currentArea: string, currentAreaId: string) {
  const $ = cheerio.load(html);
  const vendors: FoodVendor[] = [];
  const seen = new Set<string>();

  const BLOCK_CANDIDATES = [
    'article.post', 'article.type-post', '.post-item',
    '.shop', '.shop-item', '.store', '.store-item',
    '.vendor', '.vendor-item', '.market-item', '.commune-item',
    '.entry-item', '.grid-item', '.card',
    '.wp-block-group', '.wp-block-column',
  ];

  let $items = $('__none__');
  for (const sel of BLOCK_CANDIDATES) {
    const found = $(sel);
    if (found.length >= 2) { $items = found; break; }
  }

  $items.each((_, el) => {
    const $el = $(el);
    const prevH = $el.prevAll('h1,h2,h3,.area-title').first().text().trim();
    if (prevH && prevH.length < 40) {
      currentArea = prevH;
      currentAreaId = slugify(prevH);
    }

    const name = (
      $el.find('h2,h3,h4,h5,.title,.name,strong').first().text()
      || $el.find('a').first().text()
    ).trim().replace(/\s+/g, ' ');

    if (!name || name.length > 100 || name.length < 2 || seen.has(name)) return;
    if (/^(前へ|次へ|prev|next|\d+)$/i.test(name)) return;

    const allText = $el.text().replace(/\s+/g, ' ');
    const desc    = $el.find('p,.description,.excerpt').first().text().trim().slice(0, 200) || undefined;
    const imgSrc  = $el.find('img').first().attr('src');

    const menuItems: MenuItem[] = [];
    const mSeen = new Set<string>();
    allText.split(/[・\n,、\/]/).forEach(line => {
      const m = line.match(/[¥￥](\d{3,5})/);
      const mName = line.replace(/[¥￥]\d{3,5}/g, '').trim().slice(0, 60);
      if (mName.length > 1 && mName.length < 50 && !mSeen.has(mName)) {
        mSeen.add(mName);
        menuItems.push({ name: mName, price: m ? parseInt(m[1], 10) : undefined, priceLabel: m ? `¥${m[1]}` : undefined, allergens: guessAllergens(line) });
      }
    });

    seen.add(name);
    vendors.push({
      id: slugify(name), name, area: currentArea, areaId: currentAreaId,
      categories: guessCategory(allText), menuItems: menuItems.slice(0, 10),
      priceRange: calcPriceRange(menuItems), allergenTags: guessAllergens(allText),
      imageUrl: imgSrc, days: ['05-22', '05-23', '05-24'], description: desc,
      sourceUrl: pageUrl, scrapedAt: new Date().toISOString(),
    });
  });

  // フォールバック: h3+p
  if (vendors.length === 0) {
    $('h3,h4').each((_, el) => {
      const name = $(el).text().trim();
      if (!name || name.length > 80 || name.length < 2 || seen.has(name)) return;
      const desc = $(el).next('p').text().trim().slice(0, 200) || undefined;
      seen.add(name);
      vendors.push({
        id: slugify(name), name, area: currentArea, areaId: currentAreaId,
        categories: guessCategory(name + (desc ?? '')), menuItems: [],
        priceRange: '¥500〜¥1,000', allergenTags: guessAllergens(desc ?? ''),
        days: ['05-22', '05-23', '05-24'], description: desc,
        sourceUrl: pageUrl, scrapedAt: new Date().toISOString(),
      });
    });
  }

  // 次ページURL
  const NEXT_SEL = [
    'a.next.page-numbers', 'a[rel="next"]', '.pagination a.next',
    '.nav-links a.next', '.wp-pagenavi a.nextpostslink',
    'a:contains("次へ")', 'a:contains("›")', 'a:contains("»")',
  ];
  let nextUrl: string | undefined;
  for (const sel of NEXT_SEL) {
    const href = $(sel).first().attr('href');
    if (href) {
      nextUrl = href.startsWith('http') ? href : href.startsWith('/') ? `${BASE_URL}${href}` : new URL(href, pageUrl).toString();
      break;
    }
  }

  const lastH = $('h1,h2,h3,.area-title').last().text().trim();
  const nextArea   = (lastH && lastH.length < 40) ? lastH : currentArea;
  const nextAreaId = (lastH && lastH.length < 40) ? slugify(lastH) : currentAreaId;

  return { vendors, nextUrl, area: nextArea, areaId: nextAreaId };
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

// ─── HTML 全ページ取得 ────────────────────────────────────────

async function tryHtmlScrapeAll(): Promise<FoodVendor[] | null> {
  const allVendors: FoodVendor[] = [];
  const allSeen  = new Set<string>();
  let currentUrl: string | undefined = MARKET_URL;
  let area   = 'マーケット';
  let areaId = 'market';
  let pageNum = 1;

  while (currentUrl && pageNum <= MAX_PAGES) {
    try {
      const res = await fetch(currentUrl, {
        next: { revalidate: 3600 },
        headers: { 'User-Agent': BROWSER_UA, 'Accept': 'text/html', 'Accept-Language': 'ja' },
      });
      if (!res.ok) break;
      const html = await res.text();
      const { vendors, nextUrl, area: nextArea, areaId: nextAreaId } = parsePageVendors(html, currentUrl, area, areaId);
      area   = nextArea;
      areaId = nextAreaId;

      for (const v of vendors) {
        if (!allSeen.has(v.id)) { allSeen.add(v.id); allVendors.push(v); }
      }

      if (!nextUrl || nextUrl === currentUrl) break;
      currentUrl = nextUrl;
      pageNum++;
    } catch { break; }
  }

  return allVendors.length > 0 ? allVendors : null;
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
