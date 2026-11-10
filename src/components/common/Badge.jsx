import { memo } from 'react';

const variants = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  danger:  'bg-rose-50 text-rose-700 border border-rose-200/80',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  primary: 'bg-orange-50 text-orange-700 border border-orange-200/80',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  blue:    'bg-blue-50 text-blue-700 border border-blue-200/80',
};

const Badge = memo(function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
});

export default Badge;
