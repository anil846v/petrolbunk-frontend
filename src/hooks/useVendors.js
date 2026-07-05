import { useState, useEffect } from 'react';
import { vendorApi } from '../utils/api';

export function useVendors(type) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    vendorApi
      .list({ limit: 200, is_active: true, ...(type ? { type } : {}) })
      .then((res) => {
        setOptions((res?.data?.rows || []).map((v) => ({ value: v.id, label: v.name })));
      })
      .catch(console.error);
  }, [type]);

  return { options };
}
