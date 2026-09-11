/**
 * components/ui/Card.jsx
 * Glassmorphism card container with optional header/footer.
 */
import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer,
  padding = 'md',
  animate = true,
  noBorder = false,
}) => {
  const paddings = { sm: 'p-4', md: 'p-5', lg: 'p-6', xl: 'p-8', none: '' };

  const content = (
    <div className={`
      glass-card rounded-2xl
      ${noBorder ? '' : 'border border-divider/60 dark:border-divider/60'}
      overflow-hidden
      ${className}
    `}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider/40 dark:border-divider/40">
          <div>
            {title && <h3 className="text-sm font-semibold text-content dark:text-content">{title}</h3>}
            {subtitle && <p className="text-xs text-content-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={paddings[padding] || paddings.md}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 border-t border-divider/40 bg-background/20">
          {footer}
        </div>
      )}
    </div>
  );

  return animate ? (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {content}
    </motion.div>
  ) : content;
};

export default Card;
