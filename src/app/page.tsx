import Link from 'next/link';
import { FESTIVAL_DATES, VENUE_NAME, VENUE_ADDRESS, OFFICIAL_SITE_URL } from '@/lib/constants';

const SECTIONS = [
  {
    href: '/food',
    emoji: '🍜',
    title: 'フード検索',
    description: '食べたいものをカテゴリ・価格帯・アレルゲン対応で絞り込んで探せます',
    color: 'from-orange-50 to-amber-50 border-orange-200',
    iconBg: 'bg-orange-100',
  },
  {
    href: '/artists',
    emoji: '🎸',
    title: 'アーティスト検索',
    description: 'ジャンル・出演日・ステージでアーティストを検索',
    color: 'from-purple-50 to-pink-50 border-purple-200',
    iconBg: 'bg-purple-100',
  },
  {
    href: '/timetable',
    emoji: '📅',
    title: 'タイムテーブル',
    description: '6ステージ3日分のスケジュール一覧。もうすぐ始まる公演もひと目でわかる',
    color: 'from-emerald-50 to-teal-50 border-emerald-200',
    iconBg: 'bg-emerald-100',
  },
  {
    href: '/news',
    emoji: '📰',
    title: '最新情報',
    description: '公式サイトからの最新ニュース・アナウンスを表示',
    color: 'from-sky-50 to-blue-50 border-sky-200',
    iconBg: 'bg-sky-100',
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center py-10 mb-8">
        <div className="text-5xl mb-4">🌲</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">森道市場 2026</h1>
        <p className="text-emerald-700 font-medium text-lg mb-4">非公式ファンサイト</p>
        <div className="inline-flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-600 bg-white rounded-xl border border-gray-200 px-6 py-4 shadow-sm">
          <span>
            📆{' '}
            {Object.values(FESTIVAL_DATES)
              .map((d) => `${d.label}(${d.dayOfWeek})`)
              .join(' / ')}
          </span>
          <span>📍 {VENUE_NAME}</span>
        </div>
        <div className="mt-4">
          <a
            href={OFFICIAL_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-600 hover:text-emerald-800 underline"
          >
            公式サイトを見る →
          </a>
        </div>
      </section>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ href, emoji, title, description, color, iconBg }) => (
          <Link
            key={href}
            href={href}
            className={`group relative bg-gradient-to-br ${color} border rounded-2xl p-6 hover:shadow-md transition-shadow`}
          >
            <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
              {emoji}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">
              {title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            <div className="absolute bottom-5 right-5 text-gray-300 group-hover:text-emerald-500 transition-colors text-lg">
              →
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-10">
        会場: {VENUE_ADDRESS}
      </p>
    </div>
  );
}
