import { useState } from 'react';
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { fuelTypeApi } from '../../../utils/api';
import PageHeader   from '../../../components/common/PageHeader';
import Table        from '../../../components/common/Table';
import Badge        from '../../../components/common/Badge';
import Button       from '../../../components/common/Button';
import Input        from '../../../components/common/Input';
import Modal        from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import FuelTypeForm from '../../../components/master/FuelTypeForm';

export default function FuelTypes() {
  const list      = useListPage(fuelTypeApi.list);
  const { toast } = useToast();
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (list.selected?.id) {
        await fuelTypeApi.update(list.selected.id, data);
        toast('Fuel type updated', 'success');
      } else {
        await fuelTypeApi.create(data);
        toast('Fuel type created', 'success');
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
      await fuelTypeApi.toggleStatus(list.selected.id);
      toast(`Fuel type ${list.selected.is_active ? 'deactivated' : 'activated'}`, 'success');
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setToggling(false);
    }
  };

  const columns = [
    { key: 'fuel_type',       label: 'Fuel Type' },
    { key: 'code',            label: 'Code', render: (v) => <span className="font-mono font-semibold">{v}</span> },
    { key: 'price_per_litre', label: 'Price / L', render: (v) => `₹ ${parseFloat(v).toFixed(2)}` },
    {
      key: 'commission_type', label: 'Commission',
      render: (v, row) => v
        ? `${v === 'AMOUNT' ? '₹' : ''} ${row.commission_value} ${v === 'PERCENT' ? '%' : ''}`
        : '—',
    },
    { key: 'from_date', label: 'From Date' },
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
      <PageHeader title="Fuel Types" subtitle="Manage fuel types, prices and commissions" onAdd={list.openAdd} />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4">
        <Input placeholder="Search by name or code..." value={list.search}
          onChange={(e) => list.setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Table columns={columns} rows={list.rows} meta={list.meta} loading={list.loading}
        onPageChange={list.setPage} emptyText="No fuel types found." />

      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit Fuel Type' : 'New Fuel Type'} size="lg">
        <FuelTypeForm defaultValues={list.modal === 'edit' ? list.selected : null}
          onSubmit={handleSave} loading={saving} />
      </Modal>

      <ConfirmModal open={list.modal === 'delete'} onClose={list.closeModal}
        onConfirm={handleToggle} loading={toggling}
        title={list.selected?.is_active ? 'Deactivate Fuel Type' : 'Activate Fuel Type'}
        message={`Are you sure you want to ${list.selected?.is_active ? 'deactivate' : 'activate'} "${list.selected?.fuel_type}"?`}
      />
    </>
  );
}
