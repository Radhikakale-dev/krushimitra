/**
 * pages/Placeholder.jsx
 * Shown for modules not yet implemented.
 */
import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';

const Placeholder = ({ title = 'Coming Soon', description = 'This module is under construction.', icon = 'Clock' }) => {
  const Icon = Icons[icon] || Icons.Clock;

  return (
    <div className="p-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="h-20 w-20 bg-gradient-to-br from-primary-500/20 to-emerald-500/10 border border-primary-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Icon className="h-9 w-9 text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-content mb-3">{title}</h2>
        <p className="text-sm text-content-muted leading-relaxed mb-6">{description}</p>
        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs text-primary-400 font-medium mx-auto w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
          Module in development
        </div>
        <Link to="/dashboard" className="block mt-6 text-xs text-content-muted hover:text-content transition-colors">
          ← Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
};

export default Placeholder;
