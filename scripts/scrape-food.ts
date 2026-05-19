/**
 * 公式サイト https://morimichiichiba.jp/market/ から
 * フード出店情報を全ページ取得して src/data/food.json に保存するスクリプト
 *
 * 実行: npm run scrape:food
 */
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchPageSafe } from './utils/fetchPage';
import type { FoodVendor, FoodCategory, AllergenTag, PriceRange, MenuItem } from '../src/types';

const BASE_URL   = 'https://morimichiichiba.jp';
const MARKET_URL = `${BASE_URL}/market/`;
const OUT_PATH   = path.join(process.cwd(), 'src/data/food.json');
const MAX_PAGES  = 100; // 無限ループ防止

// ─── ユーティリティ ───────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || String(Date.now());
}

function stripHtml(h: string): string {
  return h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function guessCategory(t: string): FoodCategory[] {
  const c: FoodCategory[] = [];
  if (/カレー|curry/i.test(t)) c.push('カレー');
  if (/ケバブ|シャワルマ|中東|トルコ|kebab/i.test(t)) c.push('ケバブ・中東料理');
  if (/バインミー|ベトナム/i.test(t)) c.push('ベトナム料理');
  if (/ラーメン|麺|うどん|そば/i.test(t)) c.push('ラーメン・麺類');
  if (/バーガー|ハンバーガー|サンドイッチ/i.test(t)) c.push('バーガー・サンドイッチ');
  if (/スイーツ|デザート|ケーキ|アイス|菓子|わたあめ|チョコ/i.test(t)) c.push('スイーツ・デザート');
  if (/コーヒー|カフェ|珈琲/i.test(t)) c.push('コーヒー・カフェ');
  if (/クラフトビール|craft.?beer/i.test(t)) c.push('クラフトビール');
  if (/ドリンク|カクテル|ジュース|cocktail/i.test(t)) c.push('ドリンク・カクテル');
  if (/タイ|インド|アジア/i.test(t)) c.push('アジア料理');
  if (/焼き|定食|丼|和食|寿司|天ぷら|おにぎり/i.test(t)) c.push('和食');
  if (/ピザ|パスタ|イタリア|フレンチ/i.test(t)) c.push('洋食');
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

// ─── 1ページ分のHTMLから店舗を抽出 ──────────────────────────

function parseVendorsFromPage(html: string, pageUrl: string, currentArea: string, currentAreaId: string): {
  vendors: FoodVendor[];
  area: string;
  areaId: string;
} {
  const $ = cheerio.load(html);
  const vendors: FoodVendor[] = [];
  const seen = new Set<string>();

  // ── エリア見出しを探す ──
  const findArea = (el: cheerio.Element): { area: string; areaId: string } => {
    const $el = $(el);
    // 直前・直近の見出しをエリアとして使う
    const prevH = $el.prevAll('h1,h2,h3,.area-title,.section-title,.commune-title').first().text().trim();
    if (prevH && prevH.length < 40) {
      return { area: prevH, areaId: slugify(prevH) };
    }
    // 親要素の見出し
    const parentH = $el.closest('section,div').find('h1,h2,h3').first().text().trim();
    if (parentH && parentH.length < 40) {
      return { area: parentH, areaId: slugify(parentH) };
    }
    return { area: currentArea, areaId: currentAreaId };
  };

  // ── 店舗ブロックのセレクタ候補 (優先順) ──
  const BLOCK_CANDIDATES = [
    // WordPress 典型
    'article.post', 'article.type-post', '.post-item',
    // カスタム
    '.shop', '.shop-item', '.store', '.store-item',
    '.vendor', '.vendor-item', '.market-item', '.commune-item',
    '.entry-item', '.grid-item', '.card',
    // Gutenberg blocks
    '.wp-block-group', '.wp-block-column',
    // 汎用
    'li.item', 'div.item',
  ];

  let $items = $('__none__');
  for (const sel of BLOCK_CANDIDATES) {
    const found = $(sel);
    if (found.length >= 2) {
      $items = found;
      console.log(`  → セレクタ "${sel}" で ${found.length} 件マッチ`);
      break;
    }
  }

  // セレクタで見つからなければ dl/dt/dd パターンを試す
  if ($items.length === 0 && $('dl').length > 0) {
    $('dt').each((_, dt) => {
      const name = $(dt).text().trim();
      const desc = $(dt).next('dd').text().trim().slice(0, 200);
      if (!name || name.length > 80 || seen.has(name)) return;
      const allText = name + ' ' + desc;
      seen.add(name);
      vendors.push({
        id: slugify(name), name,
        area: currentArea, areaId: currentAreaId,
        categories: guessCategory(allText), menuItems: [],
        priceRange: '¥500〜¥1,000', allergenTags: guessAllergens(allText),
        days: ['05-22', '05-23', '05-24'],
        description: desc || undefined,
        sourceUrl: pageUrl, scrapedAt: new Date().toISOString(),
      });
    });
    return { vendors, area: currentArea, areaId: currentAreaId };
  }

  $items.each((_, el) => {
    const $el = $(el);

    // エリア判定
    const areaInfo = findArea(el);
    const area    = areaInfo.area;
    const areaId  = areaInfo.areaId;

    // 店舗名: 見出し系タグ優先
    const name = (
      $el.find('h1,h2,h3,h4,h5,.title,.name,.shop-name,.store-name,strong').first().text()
      || $el.find('a').first().text()
    ).trim().replace(/\s+/g, ' ');

    if (!name || name.length > 100 || name.length < 2 || seen.has(name)) return;
    // ナビゲーションっぽい要素を除外
    if (/^(前へ|次へ|prev|next|more|›|‹|\d+)$/i.test(name)) return;

    const allText  = $el.text().replace(/\s+/g, ' ');
    const imgSrc   = $el.find('img').first().attr('src');
    const desc     = $el.find('p,.description,.excerpt').first().text().trim().slice(0, 200) || undefined;

    // メニューアイテム抽出 (価格パターン)
    const menuItems: MenuItem[] = [];
    const mSeen = new Set<string>();
    allText.split(/[・\n,、\/]/).forEach(line => {
      const m = line.match(/[¥￥](\d{3,5})/);
      const mName = line.replace(/[¥￥]\d{3,5}/g, '').trim().slice(0, 60);
      if (mName.length > 1 && mName.length < 50 && !mSeen.has(mName)) {
        mSeen.add(mName);
        menuItems.push({
          name: mName,
          price: m ? parseInt(m[1], 10) : undefined,
          priceLabel: m ? `¥${m[1]}` : undefined,
          allergens: guessAllergens(line),
        });
      }
    });

    seen.add(name);
    vendors.push({
      id: slugify(name), name, area, areaId,
      categories: guessCategory(allText),
      menuItems: menuItems.slice(0, 10),
      priceRange: calcPriceRange(menuItems),
      allergenTags: guessAllergens(allText),
      imageUrl: imgSrc,
      days: ['05-22', '05-23', '05-24'],
      description: desc,
      sourceUrl: pageUrl,
      scrapedAt: new Date().toISOString(),
    });
  });

  // フォールバック: h3+隣接p のシンプルな構造
  if (vendors.length === 0) {
    const $main = $('main, #main, .content, .entry-content').first();
    ($main.length ? $main : $('body')).find('h3,h4').each((_, el) => {
      const name = $(el).text().trim();
      if (!name || name.length > 80 || name.length < 2 || seen.has(name)) return;
      const desc = $(el).next('p').text().trim().slice(0, 200) || undefined;
      seen.add(name);
      vendors.push({
        id: slugify(name), name,
        area: currentArea, areaId: currentAreaId,
        categories: guessCategory(name + (desc ?? '')),
        menuItems: [], priceRange: '¥500〜¥1,000',
        allergenTags: guessAllergens(desc ?? ''),
        days: ['05-22', '05-23', '05-24'],
        description: desc,
        sourceUrl: pageUrl, scrapedAt: new Date().toISOString(),
      });
    });
  }

  // ページ内エリア見出しの最後のものを次ページへ引き継ぐ
  const lastH = $('h1,h2,h3,.area-title').last().text().trim();
  const nextArea   = (lastH && lastH.length < 40) ? lastH : currentArea;
  const nextAreaId = (lastH && lastH.length < 40) ? slugify(lastH) : currentAreaId;

  return { vendors, area: nextArea, areaId: nextAreaId };
}

// ─── "次へ" リンクを取得 ──────────────────────────────────────

function getNextPageUrl(html: string, currentUrl: string): string | null {
  const $ = cheerio.load(html);

  // WordPress 標準ページネーション
  const NEXT_SELECTORS = [
    'a.next.page-numbers',
    'a[rel="next"]',
    '.pagination a.next',
    '.nav-links a.next',
    '.wp-pagenavi a.nextpostslink',
    'a:contains("次へ")',
    'a:contains("Next")',
    'a:contains("›")',
    'a:contains("»")',
    '.next a',
    'a.pagination-next',
  ];

  for (const sel of NEXT_SELECTORS) {
    const href = $(sel).first().attr('href');
    if (href) {
      // 絶対URLに変換
      if (href.startsWith('http')) return href;
      if (href.startsWith('/')) return `${BASE_URL}${href}`;
      return new URL(href, currentUrl).toString();
    }
  }
  return null;
}

// ─── WP REST API 全ページ取得 ────────────────────────────────

async function tryWpApiAll(): Promise<FoodVendor[] | null> {
  const { default: axios } = await import('axios');
  const POST_TYPE_CANDIDATES = ['market', 'vendor', 'commune', 'food', 'shop', 'posts'];

  for (const postType of POST_TYPE_CANDIDATES) {
    const firstUrl = `${BASE_URL}/wp-json/wp/v2/${postType}?per_page=100&page=1&_embed`;
    try {
      const firstRes = await axios.get(firstUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Morimichi Fan Site)' },
      });
      const total     = parseInt(firstRes.headers['x-wp-total'] ?? '0', 10);
      const totalPages = parseInt(firstRes.headers['x-wp-totalpages'] ?? '1', 10);

      if (!Array.isArray(firstRes.data) || firstRes.data.length === 0) continue;
      console.log(`[WP API] /${postType}: 全${total}件, ${totalPages}ページ`);

      const allPosts = [...firstRes.data];
      for (let page = 2; page <= totalPages && page <= MAX_PAGES; page++) {
        const pageUrl = `${BASE_URL}/wp-json/wp/v2/${postType}?per_page=100&page=${page}&_embed`;
        const res = await axios.get(pageUrl, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Morimichi Fan Site)' } });
        allPosts.push(...res.data);
        console.log(`[WP API]   page ${page}/${totalPages}: +${res.data.length}件 (計${allPosts.length})`);
      }

      return allPosts.map((p: {
        id: number; slug: string;
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
        const name    = stripHtml(p.title?.rendered ?? '');
        const area    = p._embedded?.['wp:term']?.[0]?.[0]?.name ?? 'マーケット';
        const areaId  = p._embedded?.['wp:term']?.[0]?.[0]?.slug ?? 'market';
        return {
          id: p.slug || slugify(name), name, area, areaId,
          categories: guessCategory(content + ' ' + name),
          menuItems: [], priceRange: '¥500〜¥1,000' as PriceRange,
          allergenTags: guessAllergens(content),
          imageUrl: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
          days: ['05-22', '05-23', '05-24'] as const,
          description: stripHtml(p.excerpt?.rendered ?? '').slice(0, 200) || undefined,
          sourceUrl: p.link, scrapedAt: new Date().toISOString(),
        } satisfies FoodVendor;
      });
    } catch {
      // 次の候補へ
    }
  }
  return null;
}

// ─── HTML 全ページスクレイピング ──────────────────────────────

async function scrapeAllPages(): Promise<FoodVendor[]> {
  const allVendors: FoodVendor[] = [];
  const allSeen   = new Set<string>();
  let currentUrl  = MARKET_URL;
  let pageNum     = 1;
  let area        = 'マーケット';
  let areaId      = 'market';

  while (currentUrl && pageNum <= MAX_PAGES) {
    console.log(`[scrape-food] ページ ${pageNum}: ${currentUrl}`);

    let html: string;
    try {
      html = await fetchPageSafe(currentUrl);
    } catch (err: unknown) {
      console.error(`  → 取得失敗: ${(err as Error).message}`);
      break;
    }

    const { vendors, area: nextArea, areaId: nextAreaId } = parseVendorsFromPage(html, currentUrl, area, areaId);
    area   = nextArea;
    areaId = nextAreaId;

    // 重複チェックして追加
    let added = 0;
    for (const v of vendors) {
      if (!allSeen.has(v.id)) {
        allSeen.add(v.id);
        allVendors.push(v);
        added++;
      }
    }
    console.log(`  → ${vendors.length} 件取得 (新規 ${added} 件, 累計 ${allVendors.length} 件)`);

    // 次ページURLを取得
    const nextUrl = getNextPageUrl(html, currentUrl);

    // デバッグ: ページネーション情報を出力
    if (pageNum === 1) {
      const { load } = await import('cheerio');
      const $ = load(html);
      const paginationHtml = $('.pagination, .wp-pagenavi, .nav-links, nav[class*="page"]').html();
      if (paginationHtml) {
        console.log(`  → ページネーションHTML: ${paginationHtml.slice(0, 300)}`);
      } else {
        console.log('  → ページネーション要素が見つかりませんでした');
      }
      console.log(`  → 次ページURL: ${nextUrl ?? 'なし'}`);
    }

    if (!nextUrl || nextUrl === currentUrl) break;
    currentUrl = nextUrl;
    pageNum++;

    // レート制限対策 (1秒待機)
    await new Promise(r => setTimeout(r, 1000));
  }

  return allVendors;
}

// ─── メイン ───────────────────────────────────────────────────

async function main() {
  console.log('[scrape-food] 開始...');
  console.log(`[scrape-food] ターゲット: ${MARKET_URL}`);

  let vendors: FoodVendor[] = [];

  // 1. WP REST API (全ページ)
  console.log('\n[scrape-food] WP REST API を試行...');
  const apiVendors = await tryWpApiAll();
  if (apiVendors && apiVendors.length > 0) {
    vendors = apiVendors;
    console.log(`[scrape-food] WP API: ${vendors.length} 件取得`);
  } else {
    // 2. HTML全ページスクレイピング
    console.log('\n[scrape-food] HTMLスクレイピング (全ページ走査)...');
    vendors = await scrapeAllPages();
  }

  // 重複排除 (最終)
  const seen = new Set<string>();
  const unique = vendors.filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  console.log(`\n[scrape-food] 完了: 合計 ${unique.length} 件`);

  if (unique.length === 0) {
    console.error('[scrape-food] 店舗が取得できませんでした。HTMLのセレクタを確認してください。');
    console.error('[scrape-food] デバッグ: npm run scrape:food 2>&1 | head -100 で詳細を確認してください');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(unique, null, 2), 'utf-8');
  console.log(`[scrape-food] ${OUT_PATH} に保存しました`);
}

main().catch((err) => {
  console.error('[scrape-food] エラー:', err.message);
  process.exit(1);
});
