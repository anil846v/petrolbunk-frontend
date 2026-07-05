import { memo } from 'react';

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
};

const Loader = memo(function Loader({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-neutral-border border-t-primary animate-spin ${sizes[size]} ${className}`}
    />
  );
});

export default Loader;
