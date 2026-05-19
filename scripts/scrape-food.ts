/**
 * Playwright を使った /market/ スクレイピング
 * 実行: npm run scrape:food
 *
 * 全店舗はページネーションなしで1ページのDOMに含まれている。
 * セレクタ: #market_shop_list .column > a.modal_view + h2.c_title + span[data-bg]
 */
import * as fs from 'fs';
import * as path from 'path';
import type { FoodVendor } from '../src/types';
import { guessCategory } from './utils/guessCategory';

const MARKET_URL = 'https://morimichiichiba.jp/market/';
const OUT_PATH   = path.join(process.cwd(), 'src/data/food.json');

function slugify(s: string): string {
  return s.toLowerCase().replace(/[\s　]+/g, '-').replace(/[^\w\-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '') || String(Date.now());
}

// ─── ページ内の店舗データを JS で抽出 ────────────────────────
// Playwright の page.evaluate() 内で実行されるため DOM API を使う

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractVendorsFromDOM(): Array<{
  name: string; kana: string; imageUrl: string; sourceUrl: string;
}> {
  const results: Array<{
    name: string; kana: string; imageUrl: string; sourceUrl: string;
  }> = [];
  const seen = new Set<string>();

  // 全店舗は #market_shop_list の中の div.column に格納されている
  const items = document.querySelectorAll('#market_shop_list .column');

  items.forEach(el => {
    const nameEl = el.querySelector('.c_title, h2');
    const name = nameEl?.textContent?.trim() ?? '';
    if (!name || seen.has(name)) return;
    seen.add(name);

    // 画像は span[data-bg] の CSS背景画像（lazy-load）
    const spanEl = el.querySelector('span[data-bg]') as HTMLElement | null;
    let imageUrl = spanEl?.dataset?.bg ?? '';
    if (!imageUrl) {
      // lazyloaded 状態では style="background-image: url(...)" に入っている場合あり
      const bgStyle = spanEl?.style?.backgroundImage ?? '';
      const m = bgStyle.match(/url\(["']?([^"')]+)["']?\)/);
      if (m) imageUrl = m[1];
    }

    // 店舗詳細ページURL
    const linkEl = el.querySelector('a.modal_view, a[data-target]') as HTMLAnchorElement | null;
    const sourceUrl = linkEl?.href ?? location.href;

    // かな読み（data-name属性）
    const kana = (el as HTMLElement).dataset?.name ?? '';

    results.push({ name, kana, imageUrl, sourceUrl });
  });

  return results;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── メイン ───────────────────────────────────────────────────

async function main() {
  console.log('[scrape-food] Playwright スクレイピング開始...');

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

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    console.log(`[scrape-food] ページ取得: ${MARKET_URL}`);
    await page.goto(MARKET_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // #market_shop_list が描画されるまで待機
    await page.waitForSelector('#market_shop_list .column', { timeout: 10000 }).catch(() => {
      console.warn('[scrape-food] #market_shop_list .column が見つかりません。フォールバックで続行...');
    });
    await page.waitForTimeout(500);

    // デバッグ用スクリーンショット
    await page.screenshot({ path: 'debug-market-page1.png', fullPage: false });
    const html = await page.content();
    fs.writeFileSync('debug-market-page1.html', html, 'utf-8');
    console.log(`  → HTML保存: debug-market-page1.html (${(html.length / 1024).toFixed(0)} KB)`);

    const rawVendors = await page.evaluate(extractVendorsFromDOM);
    console.log(`  → ${rawVendors.length} 件取得`);

    const allVendors: FoodVendor[] = [];
    for (const rv of rawVendors) {
      if (!rv.name) continue;
      // URLの数値ID (例: /market/994) を stable ID として使う
      const urlNum = rv.sourceUrl.match(/\/(\d+)\/?$/)?.[1];
      const id = urlNum ? `market-${urlNum}` : slugify(rv.name);
      allVendors.push({
        id,
        name: rv.name,
        area: 'マーケット',
        areaId: 'market',
        categories: guessCategory(rv.name + ' ' + rv.kana),
        menuItems: [],
        priceRange: '¥500〜¥1,000',
        allergenTags: [],
        imageUrl: rv.imageUrl || undefined,
        days: ['05-22', '05-23', '05-24'],
        description: rv.kana ? `よみ: ${rv.kana}` : undefined,
        sourceUrl: rv.sourceUrl,
        scrapedAt: new Date().toISOString(),
      });
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
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[scrape-food] エラー:', err.message);
  process.exit(1);
});
