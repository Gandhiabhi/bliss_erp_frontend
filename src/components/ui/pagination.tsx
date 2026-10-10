import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  page?: number;
  currentPage?: number;
  totalPages: number;
  total?: number;
  totalItems?: number;
  limit?: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({
  page,
  currentPage,
  totalPages,
  total,
  totalItems,
  limit,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const activePage = currentPage || page || 1;
  const activeTotal = totalItems !== undefined ? totalItems : (total !== undefined ? total : 0);
  const activeLimit = pageSize || limit || 10;

  if (totalPages <= 1) return null;

  const start = (activePage - 1) * activeLimit + 1;
  const end = Math.min(activePage * activeLimit, activeTotal);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
      <div>
        Showing <span className="font-semibold text-slate-900">{start}</span> to{' '}
        <span className="font-semibold text-slate-900">{end}</span> of{' '}
        <span className="font-semibold text-slate-900">{activeTotal}</span> entries
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <span className="px-3 py-1 font-semibold text-slate-800">
          Page {activePage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={activePage >= totalPages}
          onClick={() => onPageChange(activePage + 1)}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
