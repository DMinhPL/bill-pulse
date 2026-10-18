import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /** 1-based current page */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  /** Noun used in the range text, e.g. 'sản phẩm' */
  itemLabel?: string;
  className?: string;
}

/** Page numbers to show: first, last, and the current page ±1, with gaps as 'gap'. */
function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter(p => p >= 1 && p <= pageCount));
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('gap');
    result.push(p);
  });
  return result;
}

const buttonBase =
  'pagination__button h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-lg border text-xs font-medium tabular-nums transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'mục',
  className = '',
}) => {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className={`pagination flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
      <div className="pagination__info flex items-center gap-3 text-xs text-slate-400">
        <span className="pagination__range tabular-nums">
          Hiển thị <strong className="text-slate-200">{start}–{end}</strong> / {totalItems} {itemLabel}
        </span>
        {onPageSizeChange && (
          <label className="pagination__page-size flex items-center gap-1.5">
            <span className="sr-only">Số {itemLabel} mỗi trang</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="pagination__page-size-select h-8 bg-slate-950 text-xs text-slate-200 px-2 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500/50"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} / trang</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {pageCount > 1 && (
        <nav className="pagination__pages flex items-center gap-1" aria-label="Phân trang">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Trang trước"
            className={`${buttonBase} border-slate-800 text-slate-300 hover:bg-slate-800`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageWindow(page, pageCount).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="pagination__gap px-1 text-xs text-slate-500" aria-hidden="true">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Trang ${p}`}
                className={`${buttonBase} ${
                  p === page
                    ? 'is-active bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label="Trang sau"
            className={`${buttonBase} border-slate-800 text-slate-300 hover:bg-slate-800`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
