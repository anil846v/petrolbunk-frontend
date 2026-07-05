import { memo, forwardRef } from 'react';

const Input = memo(forwardRef(function Input({ error, className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`
        w-full rounded-md border px-3 py-2 text-base text-neutral-text
        placeholder:text-neutral-muted bg-white
        border-neutral-border
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
        disabled:bg-neutral-bg disabled:cursor-not-allowed
        ${error ? 'border-danger focus:ring-danger' : ''}
        ${className}
      `.trim()}
      {...props}
    />
  );
}));

export default Input;
