import { useState } from 'react';
import { Pencil, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { vendorApi } from '../../../utils/api';
import { invalidateReferenceCache } from '../../../utils/referenceCache';
import PageHeader  from '../../../components/common/PageHeader';
import Table       from '../../../components/common/Table';
import Badge       from '../../../components/common/Badge';
import Button      from '../../../components/common/Button';
import Input       from '../../../components/common/Input';
import Select      from '../../../components/common/Select';
import Modal       from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import VendorForm  from '../../../components/master/VendorForm';

const TYPE_OPTS = [
  { value: 'CUSTOMER',         label: 'Customer' },
  { value: 'SUPPLIER',         label: 'Supplier' },
  { value: 'EMPLOYEE',         label: 'Employee' },
  { value: 'LOAN',             label: 'Loan Party' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
  { value: 'OTHER',            label: 'Other' },
];

export default function Vendors() {
  const list      = useListPage(vendorApi.list);
  const { toast } = useToast();
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (list.selected?.id) {
        await vendorApi.update(list.selected.id, data);
        toast('Vendor updated', 'success');
      } else {
        await vendorApi.create(data);
        toast('Vendor created', 'success');
      }
      invalidateReferenceCache('vendors');
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
      await vendorApi.toggleStatus(target.id);
      invalidateReferenceCache('vendors');
      toast(`Vendor ${nextStatus ? 'activated' : 'deactivated'}`, 'success');
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
    { key: 'name',  label: 'Name',   sortable: true },
    { key: 'type',  label: 'Type',   align: 'center', sortable: true, render: (v) => <Badge variant="primary">{v}</Badge> },
    { key: 'phone', label: 'Phone',  render: (v) => v || '—' },
    { key: 'email', label: 'Email',  render: (v) => v || '—' },
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
          <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)}>
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
        title="Vendors" 
        subtitle="Manage customers, suppliers, and other parties" 
        icon={Building2}
        onAdd={list.openAdd} 
      />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto flex-1 min-w-[200px]">
          <Input placeholder="Search vendors..." value={list.search}
            onChange={(e) => list.setSearch(e.target.value)} className="w-full" />
        </div>
        <div className="w-full sm:w-auto">
          <Select options={TYPE_OPTS} placeholder="All types" value={list.params.type || ''}
            onChange={(e) => list.setFilter('type', e.target.value || undefined)} className="w-full sm:w-48" />
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
        emptyText="No vendors found." 
      />

      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit Vendor' : 'New Vendor'}>
        <VendorForm defaultValues={list.modal === 'edit' ? list.selected : null}
          onSubmit={handleSave} loading={saving} />
      </Modal>

      <ConfirmModal open={list.modal === 'delete'} onClose={list.closeModal}
        onConfirm={handleToggle} loading={toggling}
        title={list.selected?.is_active ? 'Deactivate Vendor' : 'Activate Vendor'}
        message={`Are you sure you want to ${list.selected?.is_active ? 'deactivate' : 'activate'} "${list.selected?.name}"?`}
      />
    </>
  );
}
