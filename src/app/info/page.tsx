import { FESTIVAL_DATES, VENUE_NAME, VENUE_ADDRESS, OFFICIAL_SITE_URL } from '@/lib/constants';

export const metadata = { title: 'アクセス・チケット情報 | 森道市場 2026' };

const OFFICIAL_LINKS = {
  access: `${OFFICIAL_SITE_URL}/access/`,
  ticket: `${OFFICIAL_SITE_URL}/ticket/`,
  notice: `${OFFICIAL_SITE_URL}/notice/`,
  qa: `${OFFICIAL_SITE_URL}/q_and_a/`,
  store: 'https://morimichi-ichiba.stores.jp/',
};

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline font-medium"
    >
      {children} →
    </a>
  );
}

export default function InfoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ℹ️ アクセス・チケット情報</h1>
        <p className="text-sm text-gray-500">
          来場に役立つ基本情報をまとめました。料金・運行時間などの最新の詳細は公式サイトでご確認ください。
        </p>
      </div>

      {/* 開催概要 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">📆 開催概要</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-3">
            <dt className="w-20 flex-shrink-0 text-gray-500">日程</dt>
            <dd className="text-gray-900">
              {Object.values(FESTIVAL_DATES)
                .map((d) => `${d.label}(${d.dayOfWeek})`)
                .join(' / ')}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 flex-shrink-0 text-gray-500">開場時間</dt>
            <dd className="text-gray-900">
              <ul className="space-y-0.5">
                {Object.values(FESTIVAL_DATES).map((d) => (
                  <li key={d.label}>
                    {d.label}({d.dayOfWeek}) {d.openTime} 開場
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 flex-shrink-0 text-gray-500">会場</dt>
            <dd className="text-gray-900">
              {VENUE_NAME}
              <span className="block text-gray-500 text-xs mt-0.5">{VENUE_ADDRESS}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* アクセス */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">🚃 アクセス</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li>
            <span className="font-semibold text-gray-900">電車</span>
            <p className="mt-0.5">最寄りは JR 蒲郡（がまごおり）駅。駅から会場へはシャトルバスが運行されます。</p>
          </li>
          <li>
            <span className="font-semibold text-gray-900">シャトルバス</span>
            <p className="mt-0.5">JR 蒲郡駅と会場を結ぶシャトルバスが運行されます。料金・時刻は公式の案内をご確認ください。</p>
          </li>
          <li>
            <span className="font-semibold text-gray-900">車・駐車場</span>
            <p className="mt-0.5">会場周辺の駐車場・パーク&ライドの利用案内があります。事前予約や料金は公式情報をご確認ください。</p>
          </li>
        </ul>
        <div className="mt-4 flex flex-col gap-1.5 text-sm">
          <ExternalLink href={OFFICIAL_LINKS.access}>公式アクセス情報</ExternalLink>
        </div>
        <p className="mt-2 text-xs text-gray-400">※ 料金・運行時間などの詳細は変更される場合があります。最新情報は公式サイトでご確認ください。</p>
      </section>

      {/* チケット */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">🎫 チケット</h2>
        <p className="text-sm text-gray-700">
          1日券のほか、キャンプ券・デイキャンプ券・こども券などが用意されます。種別・価格・販売状況は公式の案内および販売ページをご確認ください。
        </p>
        <div className="mt-4 flex flex-col gap-1.5 text-sm">
          <ExternalLink href={OFFICIAL_LINKS.ticket}>公式チケット情報</ExternalLink>
          <ExternalLink href={OFFICIAL_LINKS.store}>公式オンラインストア（購入）</ExternalLink>
        </div>
        <p className="mt-2 text-xs text-gray-400">※ 価格・販売状況は公式サイトでご確認ください。</p>
      </section>

      {/* 持ち物・注意事項 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">🎒 持ち物・注意事項</h2>
        <p className="text-sm text-gray-700">
          海辺・屋外の会場です。日差し・雨・気温の変化に備えた服装や雨具があると安心です。持ち込み禁止物・ルールは事前に公式の注意事項をご確認ください。
        </p>
        <div className="mt-4 flex flex-col gap-1.5 text-sm">
          <ExternalLink href={OFFICIAL_LINKS.notice}>公式 注意事項・ガイド</ExternalLink>
          <ExternalLink href={OFFICIAL_LINKS.qa}>よくある質問（Q&amp;A）</ExternalLink>
        </div>
      </section>

      <p className="text-center text-xs text-gray-400">
        このページは非公式ファンサイトによる案内です。正確な情報は{' '}
        <a href={OFFICIAL_SITE_URL} target="_blank" rel="noopener noreferrer" className="underline">
          公式サイト
        </a>
        {' '}をご確認ください。
      </p>
    </div>
  );
}
