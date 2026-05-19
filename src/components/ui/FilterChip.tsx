'use client';
import React from 'react';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
        active
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'
      }`}
    >
      {label}
    </button>
  );
}
