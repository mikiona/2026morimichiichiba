'use client';
import Image from 'next/image';
import { STAGES, STAGE_SHORT_NAMES, STAGE_COLORS, STAGE_MAP_COORDS, MARKET_ZONE_COORD } from '@/lib/constants';
import type { StageName } from '@/types';

interface VenueMapProps {
  highlightStage?: StageName;
}

export function VenueMap({ highlightStage }: VenueMapProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-200" style={{ aspectRatio: '4056/5733' }}>
      <Image
        src="/venue-map.jpg"
        alt="森道市場2026 会場マップ"
        fill
        className="object-contain"
        priority
      />

      {STAGES.map((s) => {
        const coord = STAGE_MAP_COORDS[s.name];
        if (!coord) return null;
        const isHighlighted = s.name === highlightStage;
        return (
          <div
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
          >
            <div className={`flex flex-col items-center gap-0.5 transition-transform ${isHighlighted ? 'scale-150 z-10' : ''}`}>
              <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold shadow-md whitespace-nowrap ${STAGE_COLORS[s.name]} ${isHighlighted ? 'ring-2 ring-white ring-offset-1' : ''}`}>
                {STAGE_SHORT_NAMES[s.name]}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full shadow ${STAGE_COLORS[s.name]}`} />
            </div>
          </div>
        );
      })}

      <div
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
        style={{ left: `${MARKET_ZONE_COORD.x}%`, top: `${MARKET_ZONE_COORD.y}%` }}
      >
        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
          {MARKET_ZONE_COORD.label}
        </span>
      </div>
    </div>
  );
}
