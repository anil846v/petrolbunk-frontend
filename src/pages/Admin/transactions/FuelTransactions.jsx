import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { fuelSaleApi, fuelTypeApi } from '../../../utils/api';
import PageHeader   from '../../../components/common/PageHeader';
import Table        from '../../../components/common/Table';
import Button       from '../../../components/common/Button';
import Input        from '../../../components/common/Input';
import Select       from '../../../components/common/Select';
import Modal        from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import FuelSaleForm from '../../../components/transactions/FuelSaleForm';

const today = new Date().toISOString().split('T')[0];

export default function FuelTransactions() {
  const list      = useListPage(fuelSaleApi.list, { from_date: today, to_date: today });
  const { toast } = useToast();
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fuel type filter options
  const [ftOptions, setFtOptions] = useState([]);
  useEffect(() => {
    fuelTypeApi.list({ limit: 50, is_active: true }).then((res) => {
      setFtOptions((res?.data?.rows || []).map((f) => ({ value: f.id, label: f.fuel_type })));
    }).catch(console.error);
  }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (list.selected?.id) {
        await fuelSaleApi.update(list.selected.id, data);
        toast('Entry updated', 'success');
      } else {
        await fuelSaleApi.create(data);
        toast('Entry added', 'success');
      }
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fuelSaleApi.remove(list.selected.id);
      toast('Entry deleted', 'success');
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'sale_date',       label: 'Date' },
    { key: 'fuel_type',       label: 'Fuel Type', render: (_, row) => row.fuelType?.fuel_type || '—' },
    { key: 'opening_meter',   label: 'Opening' },
    { key: 'closing_meter',   label: 'Closing' },
    { key: 'litres_sold',     label: 'Litres', render: (v) => parseFloat(v || 0).toFixed(2) },
    { key: 'sales_amount',    label: 'Amount (₹)', render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'commission_amount', label: 'Commission', render: (v) => v ? `₹ ${parseFloat(v).toFixed(2)}` : '—' },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => list.openEdit(row)}><Pencil size={15} /></Button>
          <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)}><Trash2 size={15} className="text-danger" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Fuel Transactions" subtitle="All fuel sale records with date range filter" onAdd={list.openAdd} />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-muted whitespace-nowrap">From</label>
          <Input type="date" value={list.params.from_date || ''} className="w-40"
            onChange={(e) => list.setFilter('from_date', e.target.value || undefined)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-muted whitespace-nowrap">To</label>
          <Input type="date" value={list.params.to_date || ''} className="w-40"
            onChange={(e) => list.setFilter('to_date', e.target.value || undefined)} />
        </div>
        <Select options={ftOptions} placeholder="All fuel types"
          value={list.params.fuel_type_id || ''}
          onChange={(e) => list.setFilter('fuel_type_id', e.target.value || undefined)}
          className="w-44" />
      </div>

      <Table columns={columns} rows={list.rows} meta={list.meta} loading={list.loading}
        onPageChange={list.setPage} emptyText="No fuel transactions found for the selected period." />

      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit Entry' : 'New Fuel Entry'} size="lg">
        <FuelSaleForm defaultValues={list.modal === 'edit' ? list.selected : null}
          onSubmit={handleSave} loading={saving} fuelTypeOptions={ftOptions} />
      </Modal>

      <ConfirmModal open={list.modal === 'delete'} onClose={list.closeModal}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Entry"
        message="Delete this fuel entry? This cannot be undone."
      />
    </>
  );
}
