import { useState } from 'react';
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { vendorApi } from '../../../utils/api';
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
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      await vendorApi.toggleStatus(list.selected.id);
      toast(`Vendor ${list.selected.is_active ? 'deactivated' : 'activated'}`, 'success');
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setToggling(false);
    }
  };

  const columns = [
    { key: 'name',  label: 'Name' },
    { key: 'type',  label: 'Type',  render: (v) => <Badge variant="primary">{v}</Badge> },
    { key: 'phone', label: 'Phone', render: (v) => v || '—' },
    { key: 'email', label: 'Email', render: (v) => v || '—' },
    {
      key: 'is_active', label: 'Status',
      render: (v) => <Badge variant={v ? 'success' : 'neutral'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
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
      <PageHeader title="Vendors" subtitle="Manage customers, suppliers, and other parties" onAdd={list.openAdd} />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex gap-3">
        <Input placeholder="Search vendors..." value={list.search}
          onChange={(e) => list.setSearch(e.target.value)} className="max-w-xs" />
        <Select options={TYPE_OPTS} placeholder="All types" value={list.params.type || ''}
          onChange={(e) => list.setFilter('type', e.target.value || undefined)} className="w-48" />
      </div>

      <Table columns={columns} rows={list.rows} meta={list.meta} loading={list.loading}
        onPageChange={list.setPage} emptyText="No vendors found." />

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
