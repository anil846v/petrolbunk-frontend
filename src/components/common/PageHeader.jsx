import { memo } from 'react';
import { Plus } from 'lucide-react';
import Button from './Button';

const PageHeader = memo(function PageHeader({ 
  title, 
  subtitle, 
  onAdd, 
  addLabel = 'Add New', 
  children, 
  action, 
  icon: Icon 
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-border shadow-sm p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/25 flex-shrink-0">
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-text tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-neutral-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {action}
        {children}
        {onAdd && (
          <Button onClick={onAdd} variant="primary">
            <Plus size={16} />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

export default PageHeader;
