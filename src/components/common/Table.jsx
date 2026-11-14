import { memo, useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-react';
import Button from './Button';
import Loader from './Loader';

const LIMIT_OPTIONS = [10, 25, 50, 100];

const Table = memo(function Table({
  columns = [],
  rows = [],
  loading = false,
  meta,
  onPageChange,
  onLimitChange,
  sortBy: externalSortBy,
  sortOrder: externalSortOrder,
  onSort,
  emptyText = 'No records found',
  keyField = 'id',
  stickyHeader = false,
  rowClassName,
  footer,
}) {
  // Local sorting state for client-side sorting when onSort is not provided
  const [internalSortBy, setInternalSortBy] = useState(null);
  const [internalSortOrder, setInternalSortOrder] = useState('ASC');

  const currentSortBy = externalSortBy !== undefined ? externalSortBy : internalSortBy;
  const currentSortOrder = externalSortOrder !== undefined ? externalSortOrder?.toUpperCase() : internalSortOrder;

  const handleHeaderClick = (col) => {
    // If column explicitly sets sortable: false or is an action column, skip
    if (col.sortable === false || (!col.key && !col.sortKey) || col.key === 'actions') {
      return;
    }

    const key = col.sortKey || col.key;
    let nextOrder = 'ASC';
    if (currentSortBy === key) {
      nextOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
    }

    if (onSort) {
      onSort(key, nextOrder);
    } else {
      setInternalSortBy(key);
      setInternalSortOrder(nextOrder);
    }
  };

  // If server-side sort is not handling it, apply client-side sort
  const displayRows = useMemo(() => {
    if (onSort || !currentSortBy || !rows.length) return rows;

    return [...rows].sort((a, b) => {
      let aVal = a[currentSortBy];
      let bVal = b[currentSortBy];

      // Handle nested object lookups (e.g., category.name or vendor.name)
      if (typeof aVal === 'object' && aVal !== null && 'name' in aVal) aVal = aVal.name;
      if (typeof bVal === 'object' && bVal !== null && 'name' in bVal) bVal = bVal.name;

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Numeric comparison if both are numbers or numeric strings
      const numA = Number(aVal);
      const numB = Number(bVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return currentSortOrder === 'ASC' ? numA - numB : numB - numA;
      }

      // String comparison
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return currentSortOrder === 'ASC' ? -1 : 1;
      if (strA > strB) return currentSortOrder === 'ASC' ? 1 : -1;
      return 0;
    });
  }, [rows, currentSortBy, currentSortOrder, onSort]);

  // Alignment helper
  const getAlignClass = (align) => {
    if (align === 'right') return 'text-right justify-end';
    if (align === 'center') return 'text-center justify-center';
    return 'text-left justify-start';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[580px]">
          <thead className={`bg-slate-50 border-b border-slate-200 ${stickyHeader ? 'sticky top-0 z-10 shadow-sm' : ''}`}>
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false && col.key !== 'actions' && (col.key || col.sortKey);
                const sortKey = col.sortKey || col.key;
                const isSorted = currentSortBy === sortKey;

                return (
                  <th
                    key={col.key || col.label}
                    style={{ width: col.width }}
                    onClick={() => isSortable && handleHeaderClick(col)}
                    className={`px-4 py-3.5 text-[11.5px] font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap select-none ${
                      isSortable ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors' : ''
                    } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${getAlignClass(col.align)}`}>
                      <span>{col.label}</span>
                      {isSortable && (
                        <span className={`inline-flex items-center transition-colors ${isSorted ? 'text-primary' : 'text-slate-400'}`}>
                          {isSorted ? (
                            currentSortOrder === 'ASC' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={13} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader size="lg" />
                    <span className="text-xs font-semibold text-slate-500 animate-pulse tracking-wide">
                      Loading records...
                    </span>
                  </div>
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              displayRows.map((row, idx) => {
                const customClass = rowClassName ? rowClassName(row, idx) : '';
                return (
                  <tr
                    key={row[keyField] ?? idx}
                    className={`hover:bg-orange-50/20 transition-colors duration-100 ${customClass}`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key || col.label}
                        className={`px-4 py-3 text-slate-800 ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>

          {footer && (
            <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-semibold text-slate-800">
              {footer}
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Controls Bar */}
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/80">
          {/* Left: Record summary & Rows per page selector */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-muted">
            <span>
              Showing{' '}
              <strong className="text-neutral-text">
                {meta.total === 0 ? 0 : ((meta.page - 1) * meta.limit) + 1}
              </strong>
              –
              <strong className="text-neutral-text">
                {Math.min(meta.page * meta.limit, meta.total)}
              </strong>{' '}
              of <strong className="text-neutral-text">{meta.total}</strong> records
            </span>

            {onLimitChange && (
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={meta.limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="bg-white border border-neutral-border rounded px-2 py-1 text-xs text-neutral-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Select rows per page"
                >
                  {LIMIT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Direct Page Jumping & Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange?.(1)}
              title="First Page"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </Button>

            {/* Previous Page */}
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange?.(meta.page - 1)}
              title="Previous Page"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Button>

            {/* Selectable Page Dropdown */}
            {meta.totalPages > 1 ? (
              <div className="flex items-center gap-1 text-xs font-medium text-neutral-text px-2">
                <span>Page</span>
                <select
                  value={meta.page}
                  onChange={(e) => onPageChange?.(Number(e.target.value))}
                  className="bg-white border border-neutral-border rounded px-1.5 py-1 text-xs font-bold text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Select page number"
                >
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span>of {meta.totalPages}</span>
              </div>
            ) : (
              <span className="px-2 text-xs font-medium text-neutral-text">
                Page {meta.page} of {meta.totalPages || 1}
              </span>
            )}

            {/* Next Page */}
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange?.(meta.page + 1)}
              title="Next Page"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Button>

            {/* Last Page */}
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange?.(meta.totalPages)}
              title="Last Page"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Table;
