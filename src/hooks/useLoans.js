import { useState, useEffect, useCallback } from 'react';
import { getCachedLoans, getCachedReference, invalidateReferenceCache } from '../utils/referenceCache';

export function useLoans() {
  const cacheKey = 'loans:ALL';
  const initialCached = getCachedReference(cacheKey);

  const [options, setOptions] = useState(initialCached?.options || []);
  const [rows, setRows]       = useState(initialCached?.rows || []);
  const [loading, setLoading] = useState(!initialCached);
  const [error, setError]     = useState(null);

  const load = useCallback(async (force = false) => {
    if (!initialCached || force) setLoading(true);
    try {
      const data = await getCachedLoans(force);
      setOptions(data.options);
      setRows(data.rows);
      setError(null);
    } catch (err) {
      console.error('[useLoans] Failed to load:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [initialCached]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    invalidateReferenceCache('loans');
    return load(true);
  }, [load]);

  return { options, rows, loading, error, refresh };
}
