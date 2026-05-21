'use client';
import Image from 'next/image';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { STAGES, STAGE_SHORT_NAMES, STAGE_COLORS, STAGE_MAP_COORDS, MARKET_ZONE_COORD } from '@/lib/constants';
import type { StageName } from '@/types';

interface VenueMapProps {
  highlightStage?: StageName;
  highlightMarket?: boolean;
}

export function VenueMap({ highlightStage, highlightMarket }: VenueMapProps) {
  return (
    <TransformWrapper initialScale={1} minScale={0.4} maxScale={8} centerOnInit>
      {({ zoomIn, zoomOut, resetTransform }) => (
        <>
          <div className="flex items-center justify-end gap-2 mb-2">
            <button
              type="button"
              onClick={() => zoomOut()}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-700 text-lg font-bold hover:bg-gray-50"
              aria-label="縮小"
            >−</button>
            <button
              type="button"
              onClick={() => resetTransform()}
              className="px-2 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-xs text-gray-600 hover:bg-gray-50"
            >リセット</button>
            <button
              type="button"
              onClick={() => zoomIn()}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-700 text-lg font-bold hover:bg-gray-50"
              aria-label="拡大"
            >＋</button>
          </div>
          <p className="text-xs text-gray-400 text-right mb-2">スクロール/ピンチで拡大縮小</p>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 touch-none">
            <TransformComponent wrapperStyle={{ width: '100%' }} contentStyle={{ width: '100%' }}>
              <div className="relative w-full" style={{ aspectRatio: '3042/4300' }}>
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
                  <span className={`px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold shadow-md whitespace-nowrap transition-transform ${highlightMarket ? 'scale-150 ring-2 ring-white ring-offset-1 z-10' : ''}`}>
                    {MARKET_ZONE_COORD.label}
                  </span>
                </div>
              </div>
            </TransformComponent>
          </div>
        </>
      )}
    </TransformWrapper>
  );
}
