/**
 * components/ui/Skeleton.jsx
 * Loading skeleton placeholders for cards, tables, and text.
 */
import React from 'react';

const pulse = 'animate-pulse bg-surface-hover/60 rounded';

export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`${pulse} h-3.5 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`glass-card rounded-2xl border border-divider/40 p-5 ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`${pulse} h-10 w-10 rounded-xl`} />
      <div className={`${pulse} h-4 w-16 rounded-full`} />
    </div>
    <div className={`${pulse} h-7 w-1/2 mb-2`} />
    <div className={`${pulse} h-3.5 w-2/3`} />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 5, className = '' }) => (
  <div className={`glass-card rounded-2xl border border-divider/40 overflow-hidden ${className}`}>
    {/* Header */}
    <div className="flex gap-4 px-4 py-3 border-b border-divider/40">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={`${pulse} h-3 flex-1 rounded`} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 px-4 py-3.5 border-b border-divider/20">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className={`${pulse} h-3.5 flex-1 rounded ${c === 0 ? 'w-2/3' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);

const Skeleton = ({ className = '', height = 'h-4', width = 'w-full' }) => (
  <div className={`${pulse} ${height} ${width} ${className}`} />
);

export default Skeleton;
