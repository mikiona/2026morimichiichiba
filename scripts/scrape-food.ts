/**
 * Playwright を使った /market/ 全ページスクレイピング
 * 実行: npm run scrape:food
 *
 * Cloudflare を迂回し、JS描画後のDOMから店舗情報を抽出する。
 * ページネーションは「次へ」ボタンクリックで全ページを走査。
 */
import * as fs from 'fs';
import * as path from 'path';
import type { FoodVendor, FoodCategory, AllergenTag, PriceRange, MenuItem } from '../src/types';

const MARKET_URL = 'https://morimichiichiba.jp/market/';
const OUT_PATH   = path.join(process.cwd(), 'src/data/food.json');
const MAX_PAGES  = 150;

// ─── テキスト解析 ─────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[\s　]+/g, '-').replace(/[^\w\-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '') || String(Date.now());
}
function stripTags(h: string) { return h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

function guessCategory(t: string): FoodCategory[] {
  const c: FoodCategory[] = [];
  if (/カレー|curry/i.test(t)) c.push('カレー');
  if (/ケバブ|シャワルマ|中東|トルコ|kebab/i.test(t)) c.push('ケバブ・中東料理');
  if (/バインミー|ベトナム/i.test(t)) c.push('ベトナム料理');
  if (/ラーメン|麺|うどん|そば/i.test(t)) c.push('ラーメン・麺類');
  if (/バーガー|ハンバーガー|サンドイッチ/i.test(t)) c.push('バーガー・サンドイッチ');
  if (/スイーツ|デザート|ケーキ|アイス|菓子|わたあめ/i.test(t)) c.push('スイーツ・デザート');
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

// ─── ページ内の店舗データを JS で抽出 ────────────────────────
// Playwright の page.evaluate() 内で実行されるため DOM API を使う

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractVendorsFromDOM(): Array<{
  name: string; description: string; area: string;
  imageUrl: string; allText: string; sourceUrl: string;
}> {
  const results: Array<{
    name: string; description: string; area: string;
    imageUrl: string; allText: string; sourceUrl: string;
  }> = [];
  const seen = new Set<string>();

  // 候補セレクタを順番に試す
  const BLOCK_SELS = [
    'article.post', 'article.type-post', '.post-item',
    '.shop', '.shop-item', '.store', '.store-item',
    '.vendor', '.market-item', '.commune-item',
    '.grid-item', '.card', '.entry',
    'li.item', 'ul > li',
    // Gutenberg
    '.wp-block-group', '.wp-block-column',
  ];

  let items: NodeListOf<Element> | null = null;
  for (const sel of BLOCK_SELS) {
    const found = document.querySelectorAll(sel);
    if (found.length >= 3) { items = found; break; }
  }

  // 見つからなければ h3/h4 の直後のブロックを使う
  if (!items || items.length < 3) {
    document.querySelectorAll('h3, h4').forEach(h => {
      const text = h.textContent?.trim() ?? '';
      if (!text || text.length > 80 || seen.has(text)) return;
      const next = h.nextElementSibling;
      seen.add(text);
      results.push({
        name: text,
        description: next?.textContent?.trim().slice(0, 200) ?? '',
        area: '',
        imageUrl: (next?.querySelector('img') as HTMLImageElement | null)?.src ?? '',
        allText: text + ' ' + (next?.textContent ?? ''),
        sourceUrl: location.href,
      });
    });
    return results;
  }

  // エリア見出しの追跡
  let currentArea = '';
  items.forEach(el => {
    // 直前の見出しを探してエリア名にする
    let prev = el.previousElementSibling;
    while (prev && !['H1','H2','H3'].includes(prev.tagName)) prev = prev.previousElementSibling;
    if (prev) currentArea = prev.textContent?.trim().slice(0, 40) ?? currentArea;

    const nameEl = el.querySelector('h2,h3,h4,h5,.title,.name,.shop-name,strong');
    const name = nameEl?.textContent?.trim() ?? '';
    if (!name || name.length > 100 || seen.has(name)) return;
    if (/^(前へ|次へ|prev|next|\d+|›|»)$/i.test(name)) return;

    const imgEl = el.querySelector('img') as HTMLImageElement | null;
    const descEl = el.querySelector('p, .description, .excerpt');

    seen.add(name);
    results.push({
      name,
      description: descEl?.textContent?.trim().slice(0, 200) ?? '',
      area: currentArea,
      imageUrl: imgEl?.src ?? imgEl?.dataset?.src ?? '',
      allText: el.textContent?.replace(/\s+/g, ' ') ?? '',
      sourceUrl: location.href,
    });
  });

  return results;
}

// 「次へ」ボタンのhrefを取得する
function getNextHref(): string | null {
  const NEXT_SELS = [
    'a.next.page-numbers',
    'a[rel="next"]',
    '.pagination a.next',
    '.nav-links a.next',
    '.wp-pagenavi a.nextpostslink',
    'a.nextpostslink',
  ];
  for (const sel of NEXT_SELS) {
    const el = document.querySelector(sel) as HTMLAnchorElement | null;
    if (el?.href) return el.href;
  }
  // テキストで探す
  for (const a of document.querySelectorAll('a')) {
    const t = a.textContent?.trim() ?? '';
    if (/^(次へ|Next|›|»|→)$/.test(t) && a.href) return a.href;
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── メイン ───────────────────────────────────────────────────

async function main() {
  console.log('[scrape-food] Playwright スクレイピング開始...');

  // playwright のインストール確認
  let chromium: typeof import('playwright').chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('[scrape-food] Playwright がインストールされていません。');
    console.error('  実行: npx playwright install chromium');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    extraHTTPHeaders: {
      'Accept-Language': 'ja,en-US;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  const page = await context.newPage();

  // Playwright 検出を回避
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const allVendors: FoodVendor[] = [];
  const allSeen  = new Set<string>();
  let currentUrl: string | null = MARKET_URL;
  let pageNum = 1;

  try {
    while (currentUrl && pageNum <= MAX_PAGES) {
      console.log(`[scrape-food] ページ ${pageNum}: ${currentUrl}`);
      await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      // ページ1でスクリーンショット保存（デバッグ用）
      if (pageNum === 1) {
        await page.screenshot({ path: 'debug-market-page1.png', fullPage: false });
        console.log('  → スクリーンショット: debug-market-page1.png');

        // HTML保存
        const html = await page.content();
        fs.writeFileSync('debug-market-page1.html', html, 'utf-8');
        console.log(`  → HTML保存: debug-market-page1.html (${(html.length/1024).toFixed(0)} KB)`);
      }

      // JS内で店舗データを抽出
      const rawVendors = await page.evaluate(extractVendorsFromDOM);
      console.log(`  → ${rawVendors.length} 件取得`);

      let added = 0;
      for (const rv of rawVendors) {
        if (!rv.name || allSeen.has(rv.name)) continue;
        allSeen.add(rv.name);

        const menuItems: MenuItem[] = [];
        const mSeen = new Set<string>();
        rv.allText.split(/[・\n,、\/]/).forEach(line => {
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

        allVendors.push({
          id: slugify(rv.name),
          name: rv.name,
          area: rv.area || 'マーケット',
          areaId: slugify(rv.area || 'market'),
          categories: guessCategory(rv.allText),
          menuItems: menuItems.slice(0, 10),
          priceRange: calcPriceRange(menuItems),
          allergenTags: guessAllergens(rv.allText),
          imageUrl: rv.imageUrl || undefined,
          days: ['05-22', '05-23', '05-24'],
          description: rv.description || undefined,
          sourceUrl: rv.sourceUrl,
          scrapedAt: new Date().toISOString(),
        });
        added++;
      }

      console.log(`  → 新規追加: ${added} 件 (累計 ${allVendors.length} 件)`);

      // 次ページURL取得
      const nextHref = await page.evaluate(getNextHref);
      if (!nextHref || nextHref === currentUrl) {
        console.log('  → 次ページなし。完了。');
        break;
      }
      currentUrl = nextHref;
      pageNum++;

      // レート制限対策
      await page.waitForTimeout(1500);
    }
  } finally {
    await browser.close();
  }

  console.log(`\n[scrape-food] 合計 ${allVendors.length} 件取得`);

  if (allVendors.length === 0) {
    console.error('[scrape-food] 店舗データが取得できませんでした。');
    console.error('[scrape-food] debug-market-page1.html を確認してください。');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(allVendors, null, 2), 'utf-8');
  console.log(`[scrape-food] ${OUT_PATH} に保存しました ✓`);
}

main().catch(err => {
  console.error('[scrape-food] エラー:', err.message);
  process.exit(1);
});
