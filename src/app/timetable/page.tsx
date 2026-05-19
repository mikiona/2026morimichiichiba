import { loadSchedule } from '@/lib/data/loadSchedule';
import { TimetableClient } from '@/components/timetable/TimetableClient';

export const metadata = {
  title: 'タイムテーブル | 森道市場 2026',
};

export default function TimetablePage() {
  const schedule = loadSchedule();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📅 タイムテーブル</h1>
        <p className="text-sm text-gray-500 mt-1">
          3日間 × 6ステージのスケジュール
        </p>
      </div>
      <TimetableClient schedule={schedule} />
    </div>
  );
}
