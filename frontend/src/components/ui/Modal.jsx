/**
 * components/ui/Modal.jsx
 * Accessible modal dialog with backdrop, animations, and escape-key close.
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const sizes = {
  sm:   'max-w-md',
  md:   'max-w-xl',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-7xl',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, type: 'spring', bounce: 0.15 }}
            className={`relative w-full ${sizes[size] || sizes.md} max-h-[90vh] flex flex-col`}
          >
            <div className="glass-panel rounded-2xl border border-divider/60 flex flex-col max-h-[90vh] overflow-hidden">
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-divider/60 shrink-0">
                  <div>
                    {title && <h2 className="text-base font-semibold text-content">{title}</h2>}
                    {subtitle && <p className="text-xs text-content-muted mt-0.5">{subtitle}</p>}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-content-muted hover:bg-surface-hover hover:text-content transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-divider/60 flex items-center justify-end gap-3 shrink-0 bg-background/20">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
