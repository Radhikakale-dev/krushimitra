/**
 * components/ui/Button.jsx
 * Reusable button with variants, sizes, loading state.
 */
import React from 'react';
import { motion } from 'framer-motion';
import Spinner from './Spinner';

const variants = {
  primary:   'bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700 text-content shadow-lg shadow-primary-500/10',
  secondary: 'bg-surface-hover hover:bg-surface-hover/80 text-content border border-divider dark:border-divider',
  danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  ghost:     'hover:bg-surface-hover/50 text-content-muted hover:text-content',
  success:   'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  warning:   'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs gap-1.5',
  sm: 'px-3 py-2 text-sm gap-2',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2.5',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight,
  className = '',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.01, y: -0.5 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-200 cursor-pointer select-none
        focus:outline-none focus:ring-2 focus:ring-primary-500/50
        disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" />
      )}
      {children}
      {iconRight && !loading && <iconRight className="h-4 w-4 shrink-0" />}
    </motion.button>
  );
};

export default Button;
