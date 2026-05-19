/**
 * 公式サイト https://morimichiichiba.jp/news/ からニュースを取得して
 * src/data/news.json に保存するスクリプト
 *
 * 実行: npm run scrape:news
 */
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchPageSafe } from './utils/fetchPage';
import type { NewsItem } from '../src/types';

const NEWS_URL = 'https://morimichiichiba.jp/news/';
const WP_API_URL = 'https://morimichiichiba.jp/wp-json/wp/v2/posts?per_page=20&_embed&orderby=date&order=desc';
const OUT_PATH = path.join(process.cwd(), 'src/data/news.json');

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8230;/g, '…')
    .trim();
}

async function tryWpApi(): Promise<NewsItem[] | null> {
  try {
    const { default: axios } = await import('axios');
    const res = await axios.get(WP_API_URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Morimichi Fan Site)' },
    });
    const posts = res.data as Array<{
      id: number;
      title: { rendered: string };
      excerpt: { rendered: string };
      link: string;
      date: string;
      _embedded?: {
        'wp:featuredmedia'?: Array<{ source_url: string }>;
        'wp:term'?: Array<Array<{ name: string }>>;
      };
    }>;
    if (!Array.isArray(posts) || posts.length === 0) return null;

    console.log(`[scrape-news] WP API: ${posts.length} 件取得`);
    return posts.map((p) => ({
      id: String(p.id),
      title: stripHtml(p.title.rendered),
      excerpt: stripHtml(p.excerpt.rendered).slice(0, 200),
      url: p.link,
      publishedAt: p.date,
      category: p._embedded?.['wp:term']?.[0]?.[0]?.name,
      imageUrl: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      scrapedAt: new Date().toISOString(),
    }));
  } catch (err: unknown) {
    console.warn('[scrape-news] WP API失敗:', (err as Error).message);
    return null;
  }
}

async function scrapeNewsHtml(): Promise<NewsItem[]> {
  console.log(`[scrape-news] HTMLスクレイピング: ${NEWS_URL}`);
  const html = await fetchPageSafe(NEWS_URL);
  const $ = cheerio.load(html);
  const items: NewsItem[] = [];
  const seen = new Set<string>();

  // WordPress の典型的なセレクタを複数試す
  const containerSelectors = [
    'article.post',
    'article.type-post',
    '.post',
    '.news-item',
    '.entry',
    '.post-item',
    'li.post',
  ];

  let $articles = $('__none__');
  for (const sel of containerSelectors) {
    const found = $(sel);
    if (found.length > 0) {
      console.log(`[scrape-news] セレクタ "${sel}" で ${found.length} 件マッチ`);
      $articles = found;
      break;
    }
  }

  if ($articles.length === 0) {
    $articles = $('main article, #main article, .content article');
    console.log(`[scrape-news] フォールバック: ${$articles.length} 件`);
  }

  $articles.each((_, el) => {
    const $el = $(el);

    const $titleLink = $el.find('.entry-title a, h2 a, h3 a, .post-title a').first();
    const title = $titleLink.text().trim() || $el.find('.entry-title, h2, h3').first().text().trim();
    if (!title || seen.has(title)) return;

    const url =
      $titleLink.attr('href')
      ?? $el.find(`a[href*="${NEWS_URL}"]`).first().attr('href')
      ?? NEWS_URL;

    const publishedAt =
      $el.find('time').attr('datetime')
      ?? $el.find('.entry-date, .post-date, .date').first().attr('datetime')
      ?? $el.find('time').first().text().trim()
      ?? new Date().toISOString();

    const excerpt =
      stripHtml($el.find('.entry-excerpt, .entry-summary, .excerpt, .post-excerpt').first().html() ?? '')
      || $el.find('p').first().text().trim().slice(0, 200);

    const category = $el.find('.cat-links a, .category a, .post-category a').first().text().trim() || undefined;
    const imageUrl = $el.find('.post-thumbnail img, .featured-image img, img').first().attr('src');
    const id = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '').replace(/\//g, '-') || String(Date.now());

    seen.add(title);
    items.push({ id, title, excerpt, url, publishedAt, category, imageUrl, scrapedAt: new Date().toISOString() });
  });

  return items;
}

async function main() {
  console.log('[scrape-news] 開始...');

  // 1. WP REST API
  let news = await tryWpApi();

  // 2. HTML スクレイピング
  if (!news || news.length === 0) {
    console.log('[scrape-news] HTMLスクレイピングに切り替え...');
    news = await scrapeNewsHtml();
    console.log(`[scrape-news] HTML: ${news.length} 件取得`);
  }

  if (news.length === 0) {
    console.error('[scrape-news] ニュースを取得できませんでした');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(news, null, 2), 'utf-8');
  console.log(`[scrape-news] ${news.length} 件を ${OUT_PATH} に保存しました`);
}

main().catch((err) => {
  console.error('[scrape-news] エラー:', err.message);
  process.exit(1);
});
