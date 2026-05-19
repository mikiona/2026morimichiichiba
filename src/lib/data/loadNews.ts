import * as cheerio from 'cheerio';
import type { NewsItem } from '@/types';

const NEWS_URL = 'https://morimichiichiba.jp/news/';
const WP_API_URL = 'https://morimichiichiba.jp/wp-json/wp/v2/posts?per_page=20&_embed&orderby=date&order=desc';

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8230;/g, '…').trim();
}

function parseNewsHtml(html: string): NewsItem[] {
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
      $articles = found;
      break;
    }
  }

  // フォールバック: main内のarticle全て
  if ($articles.length === 0) {
    $articles = $('main article, #main article, .content article');
  }

  $articles.each((_, el) => {
    const $el = $(el);

    // タイトル & URL
    const $titleLink = $el.find('.entry-title a, h2 a, h3 a, .post-title a').first();
    const title = $titleLink.text().trim() || $el.find('.entry-title, h2, h3').first().text().trim();
    if (!title || seen.has(title)) return;

    const url = $titleLink.attr('href')
      ?? $el.find('a[href*="/news/"]').first().attr('href')
      ?? NEWS_URL;

    // 日付
    const publishedAt =
      $el.find('time').attr('datetime')
      ?? $el.find('.entry-date, .post-date, .date').first().attr('datetime')
      ?? $el.find('time').first().text().trim()
      ?? new Date().toISOString();

    // 抜粋
    const excerpt = stripHtml(
      $el.find('.entry-excerpt, .entry-summary, .excerpt, .post-excerpt').first().html() ?? ''
    ) || $el.find('p').first().text().trim().slice(0, 200);

    // カテゴリ
    const category = $el.find('.cat-links a, .category a, .post-category a').first().text().trim() || undefined;

    // 画像
    const imageUrl = $el.find('.post-thumbnail img, .featured-image img, img').first().attr('src');

    // ID: URLのslugから生成
    const id = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '').replace(/\//g, '-') || String(Date.now());

    seen.add(title);
    items.push({
      id,
      title,
      excerpt,
      url,
      publishedAt,
      category,
      imageUrl,
      scrapedAt: new Date().toISOString(),
    });
  });

  return items;
}

async function tryWpApi(): Promise<NewsItem[] | null> {
  try {
    const res = await fetch(WP_API_URL, {
      next: { revalidate: 1800 },
      headers: { 'User-Agent': BROWSER_UA },
    });
    if (!res.ok) return null;

    const posts = await res.json() as Array<{
      id: number;
      title: { rendered: string };
      excerpt: { rendered: string };
      link: string;
      date: string;
      categories: number[];
      _embedded?: {
        'wp:featuredmedia'?: Array<{ source_url: string }>;
        'wp:term'?: Array<Array<{ name: string }>>;
      };
    }>;

    if (!Array.isArray(posts) || posts.length === 0) return null;

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
  } catch {
    return null;
  }
}

async function tryHtmlScrape(): Promise<NewsItem[] | null> {
  try {
    const res = await fetch(NEWS_URL, {
      next: { revalidate: 1800 },
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en-US;q=0.9',
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const items = parseNewsHtml(html);
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export type NewsSource = 'api' | 'html' | 'cache';

export async function loadNews(): Promise<{ items: NewsItem[]; source: NewsSource }> {
  // 1. WP REST API（最優先）
  const apiItems = await tryWpApi();
  if (apiItems && apiItems.length > 0) {
    return { items: apiItems, source: 'api' };
  }

  // 2. HTMLスクレイピング（/news/ ページ）
  const htmlItems = await tryHtmlScrape();
  if (htmlItems && htmlItems.length > 0) {
    return { items: htmlItems, source: 'html' };
  }

  // 3. 静的シードデータ（フォールバック）
  const { default: newsJson } = await import('@/data/news.json');
  return { items: newsJson as NewsItem[], source: 'cache' };
}
