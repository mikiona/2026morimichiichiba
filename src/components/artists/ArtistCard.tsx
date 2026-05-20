import React from 'react';
import type { Artist, ScheduleEntry } from '@/types';
import { DAY_LABELS } from '@/types';
import { STAGE_SHORT_NAMES, STAGE_COLORS } from '@/lib/constants';

interface ArtistCardProps {
  artist: Artist;
  schedules: ScheduleEntry[];
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function ArtistCard({ artist, schedules }: ArtistCardProps) {
  const href = artist.sourceUrl ?? artist.officialUrl;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-emerald-300 transition-all flex gap-4"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
          {initials(artist.name)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 truncate">{artist.name}</h3>
        {artist.nameKana && (
          <p className="text-xs text-gray-400 mb-1">{artist.nameKana}</p>
        )}

        {/* Schedule */}
        {schedules.length > 0 && (
          <div className="space-y-0.5">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center gap-1 text-xs text-gray-600">
                <span className="text-gray-400">{DAY_LABELS[s.day]}</span>
                <span className="font-medium">{s.startTime}〜{s.endTime}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-white text-xs ${STAGE_COLORS[s.stage]}`}
                >
                  {STAGE_SHORT_NAMES[s.stage]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
