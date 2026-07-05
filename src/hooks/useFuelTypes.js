import { useState, useEffect } from 'react';
import { fuelTypeApi } from '../utils/api';

export function useFuelTypes() {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    fuelTypeApi
      .list({ limit: 50, is_active: true })
      .then((res) => {
        const rows = res?.data?.rows || [];
        setOptions(rows.map((f) => ({ value: f.id, label: `${f.fuel_type} (${f.code})` })));
      })
      .catch(console.error);
  }, []);

  return { options };
}
