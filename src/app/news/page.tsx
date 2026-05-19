import { loadNews } from '@/lib/data/loadNews';
import { NewsCard } from '@/components/news/NewsCard';
import { OFFICIAL_SITE_URL } from '@/lib/constants';

export const revalidate = 1800; // 30 minutes ISR

export const metadata = {
  title: '最新情報 | 森道市場 2026',
};

export default async function NewsPage() {
  const news = await loadNews();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📰 最新情報</h1>
          <p className="text-sm text-gray-500 mt-1">公式サイトからの最新ニュース</p>
        </div>
        <a
          href={`${OFFICIAL_SITE_URL}/news/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-600 hover:text-emerald-800 underline"
        >
          公式サイトへ →
        </a>
      </div>

      {news.length > 0 ? (
        <div className="space-y-3">
          {news.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📰</div>
          <p className="text-sm">ニュースを取得できませんでした</p>
          <a
            href={`${OFFICIAL_SITE_URL}/news/`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-emerald-600 underline"
          >
            公式サイトで確認する
          </a>
        </div>
      )}
    </div>
  );
}
