/**
 * components/ui/Spinner.jsx
 * Animated loading spinner with size control.
 */
import React from 'react';

const sizes = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-4',
};

const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const colorClass = color === 'white' ? 'border-white' : 'border-primary-500';
  return (
    <div
      className={`${sizes[size] || sizes.md} ${colorClass} border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
