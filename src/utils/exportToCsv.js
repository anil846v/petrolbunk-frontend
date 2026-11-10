/**
 * Flexible & Fully Customizable CSV Exporter Utility
 * Compatible with Excel, Google Sheets, and standard spreadsheet software.
 * 
 * Features:
 * - UTF-8 BOM encoding (\uFEFF) for proper Indian Rupee symbol (₹) and character rendering in Excel.
 * - Handles nested object keys, custom formatters, dynamic column mapping.
 * - Supports optional header metadata / title banners.
 * - Supports optional summary / total footer rows.
 * - Automatic string escaping for quotes, commas, and multiline text.
 */

/**
 * Escapes a cell value for standard CSV compatibility (RFC 4180).
 */
export function formatCsvCell(val) {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'number') {
    return isNaN(val) ? '0' : String(val);
  }
  if (typeof val === 'boolean') {
    return val ? 'Yes' : 'No';
  }

  // Convert object or string
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Resolves a nested key or calls a custom extractor.
 * e.g. 'category.name' or 'vendor.phone' or fn(row)
 */
export function resolveCellValue(row, column) {
  if (typeof column === 'function') {
    return column(row);
  }
  if (column.formatter && typeof column.formatter === 'function') {
    return column.formatter(row[column.key], row);
  }
  if (column.key) {
    const keys = column.key.split('.');
    let curr = row;
    for (const k of keys) {
      if (curr === null || curr === undefined) return '';
      curr = curr[k];
    }
    return curr;
  }
  return '';
}

/**
 * Main customizable export function.
 * 
 * @param {Object} options
 * @param {string} options.filename - The exported filename (e.g. 'daybook_ledger.csv')
 * @param {string} [options.title] - Optional top banner title in the CSV
 * @param {Array<string>} [options.metadata] - Optional metadata rows (e.g. ['Station: Petrol Bunk IOCL Enterprise Suite', 'Period: May 2025'])
 * @param {Array<Object|string>} options.columns - Column definitions [{ label: 'Date', key: 'transaction_date', formatter?: fn }]
 * @param {Array<Object>} options.data - The data rows array
 * @param {Array<Array<any>>} [options.summaryRows] - Optional summary or totals rows appended at bottom
 */
export function exportToCsv({
  filename = 'export.csv',
  title,
  metadata = [],
  columns = [],
  data = [],
  summaryRows = []
}) {
  const lines = [];

  // 1. Optional Title Banner
  if (title) {
    lines.push(formatCsvCell(title));
  }

  // 2. Optional Metadata lines
  if (Array.isArray(metadata) && metadata.length > 0) {
    metadata.forEach(m => {
      if (Array.isArray(m)) {
        lines.push(m.map(formatCsvCell).join(','));
      } else {
        lines.push(formatCsvCell(m));
      }
    });
    lines.push(''); // Blank spacer row
  }

  // 3. Column Headers
  const headerLabels = columns.map(c => {
    if (typeof c === 'string') return c;
    return c.label || c.header || c.key || '';
  });
  lines.push(headerLabels.map(formatCsvCell).join(','));

  // 4. Data Rows
  data.forEach(row => {
    const rowValues = columns.map(col => {
      if (typeof col === 'string') {
        return row[col];
      }
      return resolveCellValue(row, col);
    });
    lines.push(rowValues.map(formatCsvCell).join(','));
  });

  // 5. Summary / Totals Rows
  if (Array.isArray(summaryRows) && summaryRows.length > 0) {
    lines.push(''); // Blank spacer row
    summaryRows.forEach(sRow => {
      if (Array.isArray(sRow)) {
        lines.push(sRow.map(formatCsvCell).join(','));
      }
    });
  }

  // Combine with UTF-8 BOM (\uFEFF) for seamless Microsoft Excel rendering
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Download Trigger
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', safeFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default exportToCsv;

