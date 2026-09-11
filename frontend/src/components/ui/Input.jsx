/**
 * components/ui/Input.jsx
 * Form input with label, icon, error state, and helper text.
 */
import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  helperText,
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  required = false,
  className = '',
  size = 'md',
  ...props
}, ref) => {
  const sizes = {
    sm: 'py-2 text-sm',
    md: 'py-2.5 text-sm',
    lg: 'py-3 text-base',
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-content-muted mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted pointer-events-none">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-xl border transition-all duration-200
            bg-surface/60 text-content placeholder-slate-600
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-divider/60 focus:ring-primary-500/40'
            }
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${IconRight ? 'pr-10' : 'pr-3.5'}
            ${sizes[size] || sizes.md}
            ${className}
          `}
          {...props}
        />
        {IconRight && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-muted">
            <IconRight className="h-4 w-4" />
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-content-muted">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
