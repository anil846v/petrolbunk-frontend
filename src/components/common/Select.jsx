import { memo, forwardRef } from 'react';
import Loader from './Loader';

const Select = memo(forwardRef(function Select({
  options     = [],
  placeholder = 'Select...',
  loading     = false,
  error,
  className   = '',
  disabled    = false,
  ...props
}, ref) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        disabled={disabled || loading}
        className={`
          w-full rounded-md border px-3 py-2 text-base text-neutral-text
          border-neutral-border bg-white
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:bg-neutral-bg disabled:cursor-not-allowed
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${loading ? 'pr-9 text-slate-400' : ''}
          ${className}
        `.trim()}
        {...props}
      >
        <option value="">{loading ? 'Loading options...' : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          <Loader size="xs" />
        </div>
      )}
    </div>
  );
}));

export default Select;
