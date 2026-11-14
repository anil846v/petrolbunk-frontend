import { useState, useCallback, useEffect } from 'react';

// ─── useApi ───────────────────────────────────────────────────────────────────
// One-off API calls: create, update, delete, single-record fetches
export function useApi(apiFn, opts = {}) {
  const [data,    setData]    = useState(opts.initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res    = await apiFn(...args);
      const result = res?.data ?? res;
      setData(res);
      opts.onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      opts.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, execute, setData };
}

// ─── usePagination ────────────────────────────────────────────────────────────
// List pages. Backend returns: { data: { rows: [], meta: { total, page, limit, totalPages } } }
export function usePagination(apiFn) {
  const [rows,    setRows]    = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async (params = {}, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await apiFn(params);
      
      let rowsData = [];
      if (Array.isArray(res?.data)) {
        rowsData = res.data;
      } else if (Array.isArray(res?.data?.rows)) {
        rowsData = res.data.rows;
      } else if (Array.isArray(res)) {
        rowsData = res;
      }

      let metaData = null;
      if (res?.meta) {
        metaData = res.meta;
      } else if (res?.data?.meta) {
        metaData = res.data.meta;
      }

      setRows(rowsData);
      if (metaData) setMeta(metaData);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rows, meta, loading, error, fetch, setRows };
}

// ─── useDebounce ──────────────────────────────────────────────────────────────
// Delays a value — prevents API call on every keystroke in search inputs
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
