import { useState, useCallback, useEffect } from 'react';
import { usePagination, useDebounce } from '../utils/useApi';

// Centralizes all state that every list page needs:
// data fetching, pagination, sorting, search, modal open/close, selected row.
// Usage: const list = useListPage(categoryApi.list);
export function useListPage(apiFn, defaultParams = {}) {
  const { rows, setRows, meta, loading, error, fetch } = usePagination(apiFn);

  const [params,    setParams]    = useState({ page: 1, limit: 10, ...defaultParams });
  const [search,    setSearchRaw] = useState('');
  const [modal,     setModal]     = useState(null);   // 'add' | 'edit' | 'delete' | null
  const [selected,  setSelected]  = useState(null);   // row being edited or deleted

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback((silent = false) => {
    fetch({ ...params, search: debouncedSearch || undefined }, silent);
  }, [params, debouncedSearch, fetch]);

  useEffect(() => { load(); }, [load]);

  const setSearch = useCallback((val) => {
    setSearchRaw(val);
    setParams(p => ({ ...p, page: 1 }));  // reset to page 1 on new search
  }, []);

  const setPage = useCallback((page) => {
    setParams(p => ({ ...p, page: Math.max(1, page) }));
  }, []);

  const setLimit = useCallback((limit) => {
    setParams(p => ({ ...p, limit: Number(limit), page: 1 }));
  }, []);

  const setSort = useCallback((sortBy, order) => {
    setParams(p => ({
      ...p,
      sortBy: sortBy || undefined,
      order: order ? order.toUpperCase() : undefined,
      page: 1,
    }));
  }, []);

  const setFilter = useCallback((key, val) => {
    setParams(p => ({ ...p, [key]: val, page: 1 }));
  }, []);

  const openAdd    = useCallback(() => { setSelected(null); setModal('add'); }, []);
  const openEdit   = useCallback((row) => { setSelected(row); setModal('edit'); }, []);
  const openDelete = useCallback((row) => { setSelected(row); setModal('delete'); }, []);
  const closeModal = useCallback(() => { setModal(null); setSelected(null); }, []);
  const refresh    = useCallback((silent = false) => load(silent), [load]);

  return {
    rows, setRows, meta, loading, error,
    search, setSearch,
    params, setFilter, setPage, setLimit, setSort,
    modal, selected,
    openAdd, openEdit, openDelete, closeModal,
    refresh,
  };
}
