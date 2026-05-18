import React from 'react';

type BadgeVariant = 'green' | 'blue' | 'purple' | 'orange' | 'gray' | 'red' | 'teal' | 'sky' | 'amber';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green:  'bg-emerald-100 text-emerald-800',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  gray:   'bg-gray-100 text-gray-700',
  red:    'bg-red-100 text-red-800',
  teal:   'bg-teal-100 text-teal-800',
  sky:    'bg-sky-100 text-sky-800',
  amber:  'bg-amber-100 text-amber-800',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  );
}
