import { memo } from 'react';
import { Plus } from 'lucide-react';
import Button from './Button';

const PageHeader = memo(function PageHeader({ title, subtitle, onAdd, addLabel = 'Add New' }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-text">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-muted mt-0.5">{subtitle}</p>}
      </div>
      {onAdd && (
        <Button onClick={onAdd} variant="primary">
          <Plus size={16} />
          {addLabel}
        </Button>
      )}
    </div>
  );
});

export default PageHeader;
