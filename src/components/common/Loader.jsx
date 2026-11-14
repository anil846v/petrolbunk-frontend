import { memo } from 'react';

const sizes = {
  xs: 'w-3.5 h-3.5 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
};

const variants = {
  primary: 'border-slate-200 border-t-orange-600',
  white:   'border-white/30 border-t-white',
  neutral: 'border-slate-200 border-t-slate-700',
};

const Loader = memo(function Loader({ size = 'md', variant = 'primary', className = '' }) {
  const variantClass = variants[variant] || variants.primary;
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full animate-spin shrink-0 ${sizes[size] || sizes.md} ${variantClass} ${className}`.trim()}
    />
  );
});

export default Loader;
