/**
 * アーティスト関連ページを取得して data/artists/ に保存し zip 化する。
 * 実行: npm run scrape:artist-pages
 *
 * 取得対象:
 *   /artist/         → artist-all.html    (全アーティスト一覧)
 *   /artist_day01/   → artist-day01.html  (5/22出演)
 *   /artist_day02/   → artist-day02.html  (5/23出演)
 *   /artist_day03/   → artist-day03.html  (5/24出演)
 *
 * その後 zip ファイル (data/artists.zip) を作成。
 * このファイルをアップロードすれば process-artist-pages で artists.json を更新できる。
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { chromium } from 'playwright';

const BASE_URL   = 'https://morimichiichiba.jp';
const OUT_DIR    = path.join(process.cwd(), 'data/artists');
const ZIP_PATH   = path.join(process.cwd(), 'data/artists.zip');

const PAGES = [
  { url: `${BASE_URL}/artist/`,       file: 'artist-all.html'   },
  { url: `${BASE_URL}/artist_day01/`, file: 'artist-day01.html' },
  { url: `${BASE_URL}/artist_day02/`, file: 'artist-day02.html' },
  { url: `${BASE_URL}/artist_day03/`, file: 'artist-day03.html' },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    extraHTTPHeaders: { 'Accept-Language': 'ja,en-US;q=0.9' },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    for (const { url, file } of PAGES) {
      const outPath = path.join(OUT_DIR, file);
      console.log(`取得中: ${url}`);
      try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        const html = await page.content();
        await page.close();
        fs.writeFileSync(outPath, html, 'utf-8');
        console.log(`  ✓ ${file} (${(html.length / 1024).toFixed(0)} KB)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ ${file} — ${msg.slice(0, 100)}`);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    await browser.close();
  }

  // zip 化
  try {
    if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
    execSync(`zip -r -q "${ZIP_PATH}" artists`, { cwd: path.dirname(OUT_DIR) });
    const size = fs.statSync(ZIP_PATH).size;
    console.log(`\n✓ zip 作成完了: ${ZIP_PATH} (${(size / 1024).toFixed(0)} KB)`);
    console.log(`\nこのファイルをアップロードしてください:\n  ${ZIP_PATH}`);
  } catch (err) {
    console.warn(`zip 失敗: ${err instanceof Error ? err.message : err}`);
    console.warn(`手動で ${OUT_DIR} を zip 化してください`);
  }
}

main().catch((err) => {
  console.error('エラー:', err.message);
  process.exit(1);
});
