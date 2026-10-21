import { useEffect, useState } from 'react';

export const DEFAULT_TABLE_PAGE_SIZE = 10;

/** Shared page state for client-side tables. */
export function useTablePagination(
  itemCount: number,
  resetKey?: string | number | null,
  pageSize = DEFAULT_TABLE_PAGE_SIZE
) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;

  useEffect(() => setPage(1), [resetKey]);
  useEffect(() => setPage(current => Math.min(current, pageCount)), [pageCount]);

  return {
    page: currentPage,
    pageSize,
    setPage,
    startIndex,
    endIndex: Math.min(startIndex + pageSize, itemCount),
  };
}
