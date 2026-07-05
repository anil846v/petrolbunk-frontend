import { useState, useEffect } from 'react';
import { categoryApi } from '../utils/api';

export function useCategories(type) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    categoryApi
      .list({ limit: 200, is_active: true, ...(type ? { type } : {}) })
      .then((res) => {
        setOptions((res?.data?.rows || []).map((c) => ({ value: c.id, label: c.name })));
      })
      .catch(console.error);
  }, [type]);

  return { options };
}
