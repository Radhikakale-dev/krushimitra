/**
 * components/ui/Pagination.jsx
 * Table pagination with page size selector.
 */
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const btnBase = 'h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-colors';
  const btnActive = 'bg-primary-500 text-white font-medium';
  const btnInactive = 'text-content-muted hover:bg-surface-hover hover:text-content';
  const btnDisabled = 'text-slate-700 cursor-not-allowed';

  // Generate visible page numbers with ellipsis
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2">
      {/* Info */}
      <p className="text-xs text-content-muted shrink-0">
        Showing <span className="font-medium text-content">{from}</span> to{' '}
        <span className="font-medium text-content">{to}</span> of{' '}
        <span className="font-medium text-content">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-2">
        {/* Page Size */}
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="bg-surface border border-divider text-content text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>{opt} / page</option>
            ))}
          </select>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
            className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
            className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {getPages().map((page, i) => (
            page === '...' ? (
              <span key={`ellipsis-${i}`} className="text-slate-600 px-1 text-sm">•••</span>
            ) : (
              <button key={page} onClick={() => onPageChange(page)}
                className={`${btnBase} ${currentPage === page ? btnActive : btnInactive}`}>
                {page}
              </button>
            )
          ))}

          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
            className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}`}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
            className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}`}>
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
