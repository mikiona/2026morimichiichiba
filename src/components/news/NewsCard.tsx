import React from 'react';
import type { NewsItem } from '@/types';
import { Badge } from '@/components/ui/Badge';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      {/* Thumbnail */}
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-lg bg-emerald-50 flex items-center justify-center text-3xl flex-shrink-0">
          📰
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400">{formatDate(item.publishedAt)}</span>
          {item.category && (
            <Badge variant="green">{item.category}</Badge>
          )}
        </div>
        <h3 className="font-bold text-gray-900 leading-snug mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2">{item.excerpt}</p>
        )}
        <span className="text-xs text-emerald-600 mt-1 inline-block">
          公式サイトで読む →
        </span>
      </div>
    </a>
  );
}
