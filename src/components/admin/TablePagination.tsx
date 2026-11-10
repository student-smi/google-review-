import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  colorScheme?: 'indigo' | 'blue';
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  colorScheme = 'indigo'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  const activeColorClass =
    colorScheme === 'blue'
      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200/90 text-xs select-none">
      {/* Left: Summary text & Per-page selector */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-slate-600">
        <div>
          Showing <span className="font-bold text-slate-900">{startIndex}</span> to{' '}
          <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
          <span className="font-bold text-slate-900">{totalItems}</span> entries
        </div>

        <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-200">
          <span className="text-slate-500">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            aria-label="Items per page"
            className="h-7 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Page navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((pageNum) => {
              if (totalPages <= 5) return true;
              if (pageNum === 1 || pageNum === totalPages) return true;
              return Math.abs(pageNum - safeCurrentPage) <= 1;
            })
            .map((pageNum, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && pageNum - prev > 1;

              return (
                <React.Fragment key={pageNum}>
                  {showEllipsis && (
                    <span className="px-1 text-slate-400 select-none text-xs">...</span>
                  )}
                  <Button
                    size="sm"
                    variant={safeCurrentPage === pageNum ? 'primary' : 'outline'}
                    onClick={() => onPageChange(pageNum)}
                    className={`h-8 min-w-[32px] px-2 text-xs font-bold transition-all cursor-pointer ${
                      safeCurrentPage === pageNum
                        ? activeColorClass
                        : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </Button>
                </React.Fragment>
              );
            })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === totalPages}
          className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
