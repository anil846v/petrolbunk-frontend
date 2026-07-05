import { useEffect } from 'react';

// Dev-only hook — logs RHF validation errors to the console.
// Helps debug forms without opening React DevTools.
// Does nothing in production.
export function useFormErrorLogger(errors, formName = 'Form') {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (Object.keys(errors).length === 0) return;

    console.group(`[${formName}] Validation errors`);
    Object.entries(errors).forEach(([field, err]) => {
      console.warn(`  ${field}: ${err?.message}`);
    });
    console.groupEnd();
  }, [errors, formName]);
}
