/**
 * デバッグ用: /market/ ページのHTML構造を調査して diagnostic.html に保存
 * 実行: npm run debug:food
 */
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchPageSafe } from './utils/fetchPage';

const MARKET_URL = 'https://morimichiichiba.jp/market/';
const OUT_HTML   = path.join(process.cwd(), 'debug-market.html');
const OUT_REPORT = path.join(process.cwd(), 'debug-market-report.txt');

async function main() {
  console.log('[debug-food] HTMLを取得中...');
  const html = await fetchPageSafe(MARKET_URL);

  // 生のHTMLを保存
  fs.writeFileSync(OUT_HTML, html, 'utf-8');
  console.log(`[debug-food] 生HTML保存: ${OUT_HTML} (${(html.length / 1024).toFixed(0)} KB)`);

  const $ = cheerio.load(html);
  const report: string[] = [];

  const log = (s: string) => { console.log(s); report.push(s); };

  log('\n===== ページ基本情報 =====');
  log(`タイトル: ${$('title').text()}`);
  log(`bodyクラス: ${$('body').attr('class') ?? '(なし)'}`);

  log('\n===== セレクタごとのヒット数 =====');
  const selectors = [
    'article', 'article.post', 'article.type-post',
    '.post', '.shop', '.shop-item', '.store', '.store-item',
    '.vendor', '.market-item', '.commune-item', '.grid-item',
    '.card', '.entry', '.item', '.wp-block-group',
    'li.item', 'ul.items > li', 'ul.shops > li',
    '.post-list > li', '.shop-list > li',
    'table tr', 'dl dt', 'h3', 'h4',
  ];
  for (const sel of selectors) {
    const count = $(sel).length;
    if (count > 0) log(`  ${sel.padEnd(35)}: ${count} 件`);
  }

  log('\n===== ページネーション情報 =====');
  const paginationSelectors = [
    '.pagination', '.wp-pagenavi', '.nav-links',
    'nav[class*="page"]', '.page-numbers',
    '[class*="pagination"]', '[class*="pager"]',
  ];
  for (const sel of paginationSelectors) {
    const el = $(sel).first();
    if (el.length) {
      log(`  セレクタ: ${sel}`);
      log(`  HTML: ${el.html()?.slice(0, 500)}`);
      const nextHref = el.find('a.next, a[rel="next"], a:contains("次"), a:contains("›"), a:contains("»")').first().attr('href');
      if (nextHref) log(`  → 次ページURL: ${nextHref}`);
      break;
    }
  }

  log('\n===== 最初の <article> の中身 (先頭500文字) =====');
  const firstArticle = $('article').first();
  if (firstArticle.length) {
    log(`クラス: ${firstArticle.attr('class')}`);
    log(`HTML: ${firstArticle.html()?.slice(0, 500)}`);
  } else {
    log('(article要素なし)');
  }

  log('\n===== main/content 内の最初の子要素リスト =====');
  const $main = $('main, #main, .site-main, .content').first();
  if ($main.length) {
    $main.children().slice(0, 10).each((i, el) => {
      const tag = (el as { name?: string }).name ?? 'unknown';
      const cls = $(el).attr('class') ?? '';
      const text = $(el).text().slice(0, 80).replace(/\s+/g, ' ');
      log(`  [${i}] <${tag} class="${cls}"> ${text}`);
    });
  }

  log('\n===== h2/h3 要素一覧 (最初の30件) =====');
  $('h2, h3').slice(0, 30).each((i, el) => {
    const tag = (el as { name?: string }).name ?? 'h?';
    log(`  [${i}] <${tag}> ${$(el).text().trim()}`);
  });

  log('\n===== 画像URL一覧 (最初の10件) =====');
  $('img').slice(0, 10).each((i, el) => {
    log(`  [${i}] ${$(el).attr('src')}`);
  });

  log('\n===== リンクURL一覧 (/market/ 配下, 最初の20件) =====');
  $('a[href*="/market/"]').slice(0, 20).each((i, el) => {
    log(`  [${i}] ${$(el).attr('href')} — "${$(el).text().trim().slice(0, 40)}"`);
  });

  fs.writeFileSync(OUT_REPORT, report.join('\n'), 'utf-8');
  console.log(`\n[debug-food] レポート保存: ${OUT_REPORT}`);
  console.log('[debug-food] このファイルの内容を共有してください。');
}

main().catch(err => {
  console.error('[debug-food] エラー:', err.message);
  process.exit(1);
});
