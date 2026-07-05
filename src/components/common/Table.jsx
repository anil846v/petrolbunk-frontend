import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Loader from './Loader';
import Button from './Button';

const Table = memo(function Table({
  columns   = [],
  rows      = [],
  loading   = false,
  meta,
  onPageChange,
  emptyText = 'No records found',
  keyField  = 'id',
}) {
  return (
    <div className="bg-white rounded-lg border border-neutral-border shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-bg border-b border-neutral-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="text-left px-4 py-3 text-xs font-semibold text-neutral-muted uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-border">
            {loading ? (
              // Skeleton rows while fetching
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-neutral-bg rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center text-neutral-muted">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row[keyField]}
                  className="hover:bg-neutral-bg transition-colors duration-100"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-neutral-text">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — only shown when there are multiple pages */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-border bg-neutral-bg">
          <span className="text-sm text-neutral-muted">
            Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange?.(meta.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="px-3 py-1 text-sm font-medium text-neutral-text">
              {meta.page} / {meta.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange?.(meta.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Table;
