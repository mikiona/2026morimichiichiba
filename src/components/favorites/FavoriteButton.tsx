'use client';
import React from 'react';
import { useFavorites } from '@/lib/favorites/useFavorites';

interface FavoriteButtonProps {
  artistName: string;
  className?: string;
}

export function FavoriteButton({ artistName, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const active = hydrated && isFavorite(artistName);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(artistName);
      }}
      aria-pressed={active}
      aria-label={active ? 'お気に入りから削除' : 'お気に入りに追加'}
      title={active ? 'お気に入りから削除' : 'お気に入りに追加'}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
        active
          ? 'text-amber-500 hover:text-amber-600'
          : 'text-gray-300 hover:text-amber-400'
      } ${className}`}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.5a.56.56 0 011.04 0l2.12 4.92 5.34.46c.5.04.7.66.32.99l-4.05 3.5 1.22 5.22c.11.49-.42.87-.85.61L12 16.9l-4.62 2.8c-.43.26-.96-.12-.85-.61l1.22-5.22-4.05-3.5a.56.56 0 01.32-.99l5.34-.46L11.48 3.5z"
        />
      </svg>
    </button>
  );
}
