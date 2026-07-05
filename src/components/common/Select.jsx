import { memo, forwardRef } from 'react';

const Select = memo(forwardRef(function Select({
  options     = [],
  placeholder = 'Select...',
  error,
  className   = '',
  ...props
}, ref) {
  return (
    <select
      ref={ref}
      className={`
        w-full rounded-md border px-3 py-2 text-base text-neutral-text
        border-neutral-border bg-white
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
        disabled:bg-neutral-bg disabled:cursor-not-allowed
        ${error ? 'border-danger focus:ring-danger' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}));

export default Select;
