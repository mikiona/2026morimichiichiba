import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchPageSafe } from './utils/fetchPage';
import type { NewsItem } from '../src/types';

const NEWS_URL = 'https://morimichiichiba.jp/news/';
const WP_API_URL = 'https://morimichiichiba.jp/wp-json/wp/v2/posts?per_page=20&_embed';
const OUT_PATH = path.join(process.cwd(), 'src/data/news.json');

async function tryWpApi(): Promise<NewsItem[] | null> {
  try {
    const { default: axios } = await import('axios');
    const res = await axios.get(WP_API_URL, { timeout: 10000 });
    const posts = res.data as Array<{
      id: number;
      title: { rendered: string };
      excerpt: { rendered: string };
      link: string;
      date: string;
      categories: number[];
      _embedded?: { 'wp:featuredmedia'?: Array<{ source_url: string }> };
    }>;
    return posts.map((p) => ({
      id: String(p.id),
      title: p.title.rendered.replace(/<[^>]+>/g, ''),
      excerpt: p.excerpt.rendered.replace(/<[^>]+>/g, '').trim().slice(0, 200),
      url: p.link,
      publishedAt: p.date,
      imageUrl: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      scrapedAt: new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

async function scrapeNewsHtml(): Promise<NewsItem[]> {
  const html = await fetchPageSafe(NEWS_URL);
  const $ = cheerio.load(html);
  const items: NewsItem[] = [];

  $('article, .post, .entry').each((_, el) => {
    const $el = $(el);
    const title = $el.find('.entry-title, h2, h3').first().text().trim();
    const url = $el.find('a').first().attr('href') ?? NEWS_URL;
    const dateStr = $el.find('time').attr('datetime') ?? $el.find('.entry-date').text().trim();
    const excerpt = $el.find('.entry-excerpt, .entry-summary, p').first().text().trim().slice(0, 200);
    const imageUrl = $el.find('img').first().attr('src');
    const id = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\//g, '-').replace(/-$/, '');

    if (title) {
      items.push({
        id: id || String(Date.now()),
        title,
        excerpt,
        url,
        publishedAt: dateStr || new Date().toISOString(),
        imageUrl,
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return items;
}

async function main() {
  console.log('[scrape-news] Starting...');

  let news = await tryWpApi();
  if (news && news.length > 0) {
    console.log(`[scrape-news] WP API: got ${news.length} items`);
  } else {
    console.log('[scrape-news] WP API failed, falling back to HTML scrape...');
    news = await scrapeNewsHtml();
    console.log(`[scrape-news] HTML scrape: got ${news.length} items`);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(news, null, 2), 'utf-8');
  console.log(`[scrape-news] Saved to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('[scrape-news] Error:', err.message);
  process.exit(1);
});
