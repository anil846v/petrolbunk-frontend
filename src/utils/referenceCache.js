import { categoryApi, vendorApi, loanApi } from './api';

// In-Memory Reference Cache (TTL: 5 minutes)
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

export function getCachedReference(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedReference(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateReferenceCache(prefix) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export async function getCachedCategories(type, forceRefresh = false) {
  const key = `categories:${type || 'ALL'}`;
  if (!forceRefresh) {
    const cached = getCachedReference(key);
    if (cached) return cached;
  }
  const res = await categoryApi.list({ limit: 200, is_active: true, ...(type ? { type } : {}) });
  const rows = res?.data?.rows || res?.data || [];
  const options = rows.map((c) => ({ value: c.id, label: c.name, type: c.type }));
  setCachedReference(key, { rows, options });
  return { rows, options };
}

export async function getCachedVendors(type, forceRefresh = false) {
  const key = `vendors:${type || 'ALL'}`;
  if (!forceRefresh) {
    const cached = getCachedReference(key);
    if (cached) return cached;
  }
  const res = await vendorApi.list({ limit: 200, is_active: true, ...(type ? { type } : {}) });
  const rows = res?.data?.rows || res?.data || [];
  const options = rows.map((v) => ({ value: v.id, label: v.name, type: v.type }));
  setCachedReference(key, { rows, options });
  return { rows, options };
}

export async function getCachedLoans(forceRefresh = false) {
  const key = 'loans:ALL';
  if (!forceRefresh) {
    const cached = getCachedReference(key);
    if (cached) return cached;
  }
  const res = await loanApi.list({ limit: 200, status: 'ACTIVE' });
  const rows = res?.data?.rows || res?.data || [];
  const options = rows.map((l) => ({
    value: l.id,
    label: `${l.vendor?.name || 'Party'} — ${l.loan_type}`,
    raw: l,
  }));
  setCachedReference(key, { rows, options });
  return { rows, options };
}
