import { loadSchedule } from '@/lib/data/loadSchedule';
import { MyScheduleClient } from '@/components/my/MyScheduleClient';

export const metadata = { title: 'マイプラン | 森道市場 2026' };

export default function MyPage() {
  const schedule = loadSchedule();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">⭐ マイプラン</h1>
      <p className="text-sm text-gray-500 mb-4">
        お気に入りに登録したアーティストの出演スケジュール。時間の重複も自動でチェックします
      </p>
      <MyScheduleClient schedule={schedule} />
    </div>
  );
}
