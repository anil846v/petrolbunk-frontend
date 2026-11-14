import { useState } from 'react';
import { Pencil, ToggleLeft, ToggleRight, FolderTree } from 'lucide-react';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { categoryApi } from '../../../utils/api';
import { invalidateReferenceCache } from '../../../utils/referenceCache';
import PageHeader   from '../../../components/common/PageHeader';
import Table        from '../../../components/common/Table';
import Badge        from '../../../components/common/Badge';
import Button       from '../../../components/common/Button';
import Input        from '../../../components/common/Input';
import Select       from '../../../components/common/Select';
import Modal        from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import CategoryForm from '../../../components/master/CategoryForm';

const TYPE_OPTS = [
  { value: 'INCOME',  label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
];

export default function Categories() {
  const list      = useListPage(categoryApi.list);
  const { toast } = useToast();
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (list.selected?.id) {
        await categoryApi.update(list.selected.id, data);
        toast('Category updated', 'success');
      } else {
        await categoryApi.create(data);
        toast('Category created', 'success');
      }
      invalidateReferenceCache('categories');
      list.closeModal();
      list.refresh(true);
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const target = list.selected;
    if (!target) return;

    const prevStatus = target.is_active;
    const nextStatus = !prevStatus;

    // Optimistic UI update: flip status in table immediately
    list.setRows((rows) =>
      rows.map((r) => (r.id === target.id ? { ...r, is_active: nextStatus } : r))
    );
    list.closeModal();

    setToggling(true);
    try {
      await categoryApi.toggleStatus(target.id);
      invalidateReferenceCache('categories');
      toast(`Category ${nextStatus ? 'activated' : 'deactivated'}`, 'success');
      list.refresh(true);
    } catch (err) {
      // Rollback on failure
      list.setRows((rows) =>
        rows.map((r) => (r.id === target.id ? { ...r, is_active: prevStatus } : r))
      );
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setToggling(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'type', label: 'Type', align: 'center', sortable: true,
      render: (v) => <Badge variant={v === 'INCOME' ? 'success' : 'danger'}>{v}</Badge>,
    },
    {
      key: 'is_active', label: 'Status', align: 'center', sortable: true,
      render: (v) => <Badge variant={v ? 'success' : 'neutral'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', label: '', align: 'center', sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => list.openEdit(row)} aria-label="Edit">
            <Pencil size={15} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)} aria-label="Toggle status">
            {row.is_active
              ? <ToggleRight size={18} className="text-success" />
              : <ToggleLeft  size={18} className="text-neutral-muted" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader 
        title="Categories" 
        subtitle="Manage income and expense categories" 
        icon={FolderTree}
        onAdd={list.openAdd} 
      />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto flex-1 min-w-[200px]">
          <Input
            placeholder="Search categories..."
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select
            options={TYPE_OPTS}
            placeholder="All types"
            value={list.params.type || ''}
            onChange={(e) => list.setFilter('type', e.target.value || undefined)}
            className="w-full sm:w-40"
          />
        </div>
      </div>

      <Table 
        columns={columns} 
        rows={list.rows} 
        meta={list.meta} 
        loading={list.loading}
        onPageChange={list.setPage}
        onLimitChange={list.setLimit}
        sortBy={list.params.sortBy}
        sortOrder={list.params.order}
        onSort={list.setSort}
        emptyText="No categories found. Click 'Add New' to create one." 
      />

      {/* Add / Edit */}
      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit Category' : 'New Category'}>
        <CategoryForm defaultValues={list.modal === 'edit' ? list.selected : null}
          onSubmit={handleSave} loading={saving} />
      </Modal>

      {/* Toggle status confirm */}
      <ConfirmModal open={list.modal === 'delete'} onClose={list.closeModal}
        onConfirm={handleToggle} loading={toggling}
        title={list.selected?.is_active ? 'Deactivate Category' : 'Activate Category'}
        message={`Are you sure you want to ${list.selected?.is_active ? 'deactivate' : 'activate'} "${list.selected?.name}"?`}
      />
    </>
  );
}
