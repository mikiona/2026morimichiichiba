import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: '森道市場 2026 — 非公式ファンサイト',
  description: '森道市場2026（5/22〜24・愛知県蒲郡）のショップ検索・アーティスト検索・タイムテーブル・最新情報',
  openGraph: {
    title: '森道市場 2026',
    description: '2026年5月22〜24日 ラグーナビーチ開催。ショップ・アーティスト情報満載。',
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-6 mt-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-400">
            <p>このサイトは非公式のファンサイトです。</p>
            <p className="mt-1">
              公式サイト:{' '}
              <a href="https://morimichiichiba.jp" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600">
                morimichiichiba.jp
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
