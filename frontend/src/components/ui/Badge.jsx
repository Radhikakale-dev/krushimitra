/**
 * components/ui/Badge.jsx
 * Status badge with color variants.
 */
import React from 'react';

const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  info:    'badge-info',
  neutral: 'badge-neutral',
  primary: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
  amber:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

const Badge = ({ children, variant = 'neutral', size = 'md', dot = false, className = '' }) => (
  <span className={`
    inline-flex items-center gap-1.5 font-medium rounded-full
    ${variants[variant] || variants.neutral}
    ${sizes[size] || sizes.md}
    ${className}
  `}>
    {dot && (
      <span className={`h-1.5 w-1.5 rounded-full ${
        variant === 'success' ? 'bg-emerald-400 animate-pulse' :
        variant === 'warning' ? 'bg-amber-400' :
        variant === 'danger'  ? 'bg-red-400' : 'bg-slate-400'
      }`} />
    )}
    {children}
  </span>
);

export default Badge;
