import { loadNews } from '@/lib/data/loadNews';
import { NewsCard } from '@/components/news/NewsCard';
import { OFFICIAL_SITE_URL } from '@/lib/constants';

export const revalidate = 1800; // 30分ごとに再取得

export const metadata = {
  title: '最新情報 | 森道市場 2026',
};

const SOURCE_LABELS = {
  api:   { label: 'ライブ取得 (API)',  color: 'bg-emerald-100 text-emerald-800' },
  html:  { label: 'ライブ取得 (HTML)', color: 'bg-sky-100 text-sky-800' },
  cache: { label: 'キャッシュデータ',  color: 'bg-amber-100 text-amber-800' },
};

export default async function NewsPage() {
  const { items, source } = await loadNews();
  const sourceInfo = SOURCE_LABELS[source];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📰 最新情報</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">公式サイト（morimichiichiba.jp）からの最新ニュース</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceInfo.color}`}>
              {sourceInfo.label}
            </span>
          </div>
        </div>
        <a
          href={`${OFFICIAL_SITE_URL}/news/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-600 hover:text-emerald-800 underline flex-shrink-0"
        >
          公式サイトへ →
        </a>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
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
