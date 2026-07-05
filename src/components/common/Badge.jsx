import { memo } from 'react';

const variants = {
  success: 'bg-success-light text-success',
  danger:  'bg-danger-light  text-danger',
  warning: 'bg-warning-light text-warning',
  primary: 'bg-primary-light text-primary',
  neutral: 'bg-neutral-bg    text-neutral-muted',
};

const Badge = memo(function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
});

export default Badge;
