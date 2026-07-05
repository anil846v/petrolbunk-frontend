import { memo } from 'react';
import Loader from './Loader';

const variants = {
  primary:   'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
  secondary: 'bg-white text-neutral-text border border-neutral-border hover:bg-neutral-bg focus:ring-neutral-border',
  danger:    'bg-danger text-white hover:bg-red-700 focus:ring-danger',
  ghost:     'bg-transparent text-neutral-text hover:bg-neutral-bg focus:ring-neutral-border',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
};

const Button = memo(function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  className = '',
  type      = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-1
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `.trim()}
      {...props}
    >
      {loading && <Loader size="sm" />}
      {children}
    </button>
  );
});

export default Button;
