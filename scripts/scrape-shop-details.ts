/**
 * 個別ショップページ（/market/XXX）を全件取得して data/shops/ に保存する。
 * 実行: npm run scrape:shops
 *
 * - src/data/food.json から URL リストを読む
 * - Playwright で各ページを取得して data/shops/<id>.html に保存
 * - 既存ファイルはスキップ（中断・再開可能）
 * - 1秒待機でレート制限
 * - 完了時に data/shops.zip を作成（要 zip コマンド）
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import type { FoodVendor } from '../src/types';

const FOOD_JSON = path.join(process.cwd(), 'src/data/food.json');
const SHOPS_DIR = path.join(process.cwd(), 'data/shops');
const ZIP_PATH  = path.join(process.cwd(), 'data/shops.zip');
const DELAY_MS  = 1000;

async function main() {
  if (!fs.existsSync(FOOD_JSON)) {
    console.error(`[scrape-shops] ${FOOD_JSON} が見つかりません。`);
    console.error('  先に `npm run scrape:food` を実行してください。');
    process.exit(1);
  }

  fs.mkdirSync(SHOPS_DIR, { recursive: true });

  const vendors: FoodVendor[] = JSON.parse(fs.readFileSync(FOOD_JSON, 'utf-8'));
  console.log(`[scrape-shops] 対象: ${vendors.length} 件\n`);

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
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  let downloaded = 0;
  let skipped   = 0;
  let failed    = 0;

  try {
    for (const [i, v] of vendors.entries()) {
      const outPath = path.join(SHOPS_DIR, `${v.id}.html`);
      const progress = `[${(i + 1).toString().padStart(3)}/${vendors.length}]`;

      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1024) {
        skipped++;
        if (i % 50 === 0) console.log(`${progress} skip (cached): ${v.id}`);
        continue;
      }

      try {
        const page = await context.newPage();
        await page.goto(v.sourceUrl, { waitUntil: 'networkidle', timeout: 30000 });
        const html = await page.content();
        await page.close();

        fs.writeFileSync(outPath, html, 'utf-8');
        downloaded++;
        console.log(`${progress} ✓ ${v.id.padEnd(14)} (${(html.length / 1024).toFixed(0)} KB) — ${v.name}`);

        await new Promise((r) => setTimeout(r, DELAY_MS));
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${progress} ✗ ${v.id} — ${msg.slice(0, 100)}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n[scrape-shops] 完了: ダウンロード ${downloaded} / スキップ ${skipped} / 失敗 ${failed}`);

  // zip 化
  try {
    if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
    console.log(`\n[scrape-shops] zip 圧縮中 → ${ZIP_PATH}`);
    execSync(`zip -r -q "${ZIP_PATH}" shops`, { cwd: path.dirname(SHOPS_DIR) });
    const size = fs.statSync(ZIP_PATH).size;
    console.log(`[scrape-shops] ✓ zip 作成完了 (${(size / 1024 / 1024).toFixed(1)} MB)`);
    console.log(`\nこのファイルをアップロードしてください:\n  ${ZIP_PATH}`);
  } catch (err) {
    console.warn(`[scrape-shops] zip コマンド失敗: ${err instanceof Error ? err.message : err}`);
    console.warn(`  手動で ${SHOPS_DIR} を zip 化してください`);
  }
}

main().catch((err) => {
  console.error('[scrape-shops] エラー:', err.message);
  process.exit(1);
});
