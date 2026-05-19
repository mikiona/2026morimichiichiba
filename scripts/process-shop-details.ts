/**
 * data/shops/<id>.html を解析して、メニュー・商品情報を抽出し
 * src/data/food.json のカテゴリ・説明を更新する。
 * 実行: npm run process:shops
 *
 * 抽出対象: 「森、道、市場2026ではどんなメニューや商品がならぶ予定ですか？」
 * の回答テキスト。複数のHTML構造を試みる（dt/dd, h3+p, definition list等）。
 */
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import type { FoodVendor } from '../src/types';
import { guessCategory } from './utils/guessCategory';

const FOOD_JSON = path.join(process.cwd(), 'src/data/food.json');
const SHOPS_DIR = path.join(process.cwd(), 'data/shops');

const QUESTION_RE = /メニューや商品が(?:ならぶ|並ぶ)/;

/**
 * ショップHTMLから「メニューや商品」の回答テキストを抽出する。
 * 複数の構造を順番に試して、最初にヒットしたものを返す。
 */
function extractMenuText(html: string): string {
  const $ = cheerio.load(html);

  // 戦略0: div.sub_title02 + div.ans (morimichiichiba.jp 実際の構造)
  let found = '';
  $('.sub_title02').each((_, el) => {
    const q = $(el).text().trim();
    if (QUESTION_RE.test(q)) {
      found = $(el).next('.ans').text().trim();
      if (!found) found = $(el).nextAll('.ans').first().text().trim();
      if (found) return false;
    }
  });
  if (found) return found;

  // 戦略1: dt/dd ペア
  $('dt').each((_, el) => {
    const q = $(el).text().trim();
    if (QUESTION_RE.test(q)) {
      found = $(el).next('dd').text().trim();
      return false;
    }
  });
  if (found) return found;

  // 戦略2: h2/h3/h4 + 次の兄弟要素
  $('h2, h3, h4, h5').each((_, el) => {
    const q = $(el).text().trim();
    if (QUESTION_RE.test(q)) {
      // 次のp/div/section要素を集める
      const parts: string[] = [];
      let next = $(el).next();
      while (next.length && !/^h[1-6]$/i.test(next.prop('tagName') ?? '')) {
        const t = next.text().trim();
        if (t) parts.push(t);
        next = next.next();
        if (parts.join(' ').length > 1000) break;
      }
      found = parts.join(' ').trim();
      if (found) return false;
    }
  });
  if (found) return found;

  // 戦略3: 質問テキストを含むあらゆる要素 → 親の次の兄弟
  $('p, div, span, li, strong, b').each((_, el) => {
    if (found) return false;
    const t = $(el).clone().children().remove().end().text().trim();
    if (QUESTION_RE.test(t)) {
      // 同じ親内で「答え」っぽい要素を探す
      const parent = $(el).parent();
      const candidate = parent.find('p, div').not(el).first();
      if (candidate.length) {
        found = candidate.text().trim();
      } else {
        const next = $(el).next();
        if (next.length) found = next.text().trim();
      }
    }
  });

  return found;
}

/**
 * ショップHTMLから補助的な情報（説明文、エリア、SNSなど）も抽出する。
 */
function extractExtras(html: string): { area?: string; description?: string; instagram?: string; website?: string } {
  const $ = cheerio.load(html);
  const result: { area?: string; description?: string; instagram?: string; website?: string } = {};

  // エリア情報（dt/dd, "出店エリア"などのキーで）
  $('dt').each((_, el) => {
    const k = $(el).text().trim();
    if (/エリア|出店場所|出店エリア|盛り場/.test(k) && !result.area) {
      result.area = $(el).next('dd').text().trim().slice(0, 60);
    }
  });

  // メタディスクリプション
  const metaDesc = $('meta[name="description"]').attr('content');
  if (metaDesc) result.description = metaDesc.slice(0, 300);

  // SNSリンク
  $('a[href*="instagram.com"]').first().each((_, el) => {
    result.instagram = $(el).attr('href');
  });
  $('a[href*="://"][href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (
      !result.website &&
      !/morimichiichiba|instagram|facebook|twitter|x\.com|youtube|tiktok/.test(href) &&
      /^https?:\/\//.test(href)
    ) {
      result.website = href;
    }
  });

  return result;
}

async function main() {
  if (!fs.existsSync(SHOPS_DIR)) {
    console.error(`[process-shops] ${SHOPS_DIR} が見つかりません。`);
    console.error('  先に `npm run scrape:shops` を実行してください。');
    process.exit(1);
  }

  if (!fs.existsSync(FOOD_JSON)) {
    console.error(`[process-shops] ${FOOD_JSON} が見つかりません。`);
    process.exit(1);
  }

  const vendors: FoodVendor[] = JSON.parse(fs.readFileSync(FOOD_JSON, 'utf-8'));
  console.log(`[process-shops] ${vendors.length} 件のショップを処理...`);

  let extractedCount = 0;
  let noFileCount   = 0;
  let noMenuCount   = 0;
  const samples: string[] = [];

  const updated: FoodVendor[] = vendors.map((v) => {
    const htmlPath = path.join(SHOPS_DIR, `${v.id}.html`);
    if (!fs.existsSync(htmlPath)) {
      noFileCount++;
      return v;
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');
    const menuText = extractMenuText(html);
    const extras   = extractExtras(html);

    if (!menuText) {
      noMenuCount++;
      return v;
    }
    extractedCount++;

    // サンプル収集
    if (samples.length < 5) {
      samples.push(`${v.name}\n  → ${menuText.slice(0, 200)}`);
    }

    // 既存のかな読みのみ取得（再実行時の重複防止：" / " 以前の部分のみ）
    const kana = v.description?.startsWith('よみ:')
      ? (v.description.split(' / ')[0] ?? '')
      : '';
    const newDescription = [kana, menuText.slice(0, 400)].filter(Boolean).join(' / ');

    return {
      ...v,
      // 名前 + かな + メニュー全文でカテゴリを再判定（meta descはサイト共通なので除外）
      categories: guessCategory(`${v.name} ${kana} ${menuText}`),
      area:       extras.area || v.area,
      areaId:     extras.area ? extras.area.toLowerCase().replace(/\s+/g, '-') : v.areaId,
      description: newDescription,
    };
  });

  // カテゴリ集計
  const catCount: Record<string, number> = {};
  updated.forEach((v) => v.categories.forEach((c) => { catCount[c] = (catCount[c] ?? 0) + 1; }));

  console.log(`\n[process-shops] 抽出結果:`);
  console.log(`  ✓ メニュー抽出成功: ${extractedCount} 件`);
  console.log(`  - HTML未取得: ${noFileCount} 件`);
  console.log(`  - メニュー欄なし: ${noMenuCount} 件`);

  console.log(`\n[process-shops] 新カテゴリ分布:`);
  Object.entries(catCount).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(20)} ${v} 件`);
  });

  console.log(`\n[process-shops] 抽出サンプル:`);
  samples.forEach((s) => console.log(`  • ${s}`));

  fs.writeFileSync(FOOD_JSON, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`\n[process-shops] ✓ ${FOOD_JSON} 更新完了`);
}

main().catch((err) => {
  console.error('[process-shops] エラー:', err.message);
  process.exit(1);
});
