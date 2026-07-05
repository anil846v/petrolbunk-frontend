import { memo } from 'react';

// Wraps any input with a label and error message.
// Use inside every entity form — never write label/error JSX manually.
const FormField = memo(function FormField({ label, error, required = false, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-neutral-text">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

export default FormField;
