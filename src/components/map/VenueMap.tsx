'use client';
import Image from 'next/image';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export function VenueMap() {
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
              <div className="relative w-full" style={{ aspectRatio: '4056/5733' }}>
                <Image
                  src="/venue-map.jpg"
                  alt="森道市場2026 会場マップ"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </TransformComponent>
          </div>
        </>
      )}
    </TransformWrapper>
  );
}
