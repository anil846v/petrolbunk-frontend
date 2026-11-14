import { useState, useEffect, useCallback } from 'react';
import { getCachedVendors, getCachedReference, invalidateReferenceCache } from '../utils/referenceCache';

export function useVendors(type) {
  const cacheKey = `vendors:${type || 'ALL'}`;
  const initialCached = getCachedReference(cacheKey);

  const [options, setOptions] = useState(initialCached?.options || []);
  const [rows, setRows]       = useState(initialCached?.rows || []);
  const [loading, setLoading] = useState(!initialCached);
  const [error, setError]     = useState(null);

  const load = useCallback(async (force = false) => {
    if (!initialCached || force) setLoading(true);
    try {
      const data = await getCachedVendors(type, force);
      setOptions(data.options);
      setRows(data.rows);
      setError(null);
    } catch (err) {
      console.error('[useVendors] Failed to load:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [type, initialCached]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    invalidateReferenceCache('vendors');
    return load(true);
  }, [load]);

  return { options, rows, loading, error, refresh };
}
