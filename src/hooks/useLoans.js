import { useState, useEffect } from 'react';
import { loanApi } from '../utils/api';

export function useLoans() {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    loanApi
      .list({ limit: 200 })
      .then((res) => {
        setOptions(
          (res?.data?.rows || []).map((l) => ({
            value: l.id,
            label: `${l.vendor?.name || 'Unknown'} — ${l.loan_type}`,
          }))
        );
      })
      .catch(console.error);
  }, []);

  return { options };
}
