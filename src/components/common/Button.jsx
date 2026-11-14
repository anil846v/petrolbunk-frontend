import { memo } from 'react';
import Loader from './Loader';

const variants = {
  primary:   'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 shadow-sm shadow-orange-500/20 focus:ring-orange-500 font-semibold',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-300',
  danger:    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm shadow-rose-500/20',
  ghost:     'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300',
  outline:   'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50 focus:ring-orange-500',
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
  const spinnerVariant = (variant === 'primary' || variant === 'danger') ? 'white' : 'primary';

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
      {loading && <Loader size="sm" variant={spinnerVariant} />}
      {children}
    </button>
  );
});

export default Button;
