import type { NewsItem } from '@/types';

export async function loadNews(): Promise<NewsItem[]> {
  // Try to fetch live data from the official site's WP REST API
  // Falls back to the static seed file if unavailable
  try {
    const res = await fetch(
      'https://morimichiichiba.jp/wp-json/wp/v2/posts?per_page=20&_embed',
      {
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Morimichi Fan Site)' },
      }
    );
    if (res.ok) {
      const posts = await res.json() as Array<{
        id: number;
        title: { rendered: string };
        excerpt: { rendered: string };
        link: string;
        date: string;
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
    }
  } catch {
    // fall through to static data
  }

  const { default: newsJson } = await import('@/data/news.json');
  return newsJson as NewsItem[];
}
