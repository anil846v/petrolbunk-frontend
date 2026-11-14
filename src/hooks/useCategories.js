import { useState, useEffect, useCallback } from 'react';
import { getCachedCategories, getCachedReference, invalidateReferenceCache } from '../utils/referenceCache';

export function useCategories(type) {
  const cacheKey = `categories:${type || 'ALL'}`;
  const initialCached = getCachedReference(cacheKey);

  const [options, setOptions] = useState(initialCached?.options || []);
  const [rows, setRows]       = useState(initialCached?.rows || []);
  const [loading, setLoading] = useState(!initialCached);
  const [error, setError]     = useState(null);

  const load = useCallback(async (force = false) => {
    if (!initialCached || force) setLoading(true);
    try {
      const data = await getCachedCategories(type, force);
      setOptions(data.options);
      setRows(data.rows);
      setError(null);
    } catch (err) {
      console.error('[useCategories] Failed to load:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [type, initialCached]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    invalidateReferenceCache('categories');
    return load(true);
  }, [load]);

  return { options, rows, loading, error, refresh };
}
