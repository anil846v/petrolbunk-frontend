import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Droplets, Wallet, TrendingUp } from 'lucide-react';
import { useApi } from '../../../utils/useApi';
import { useToast } from '../../../components/common/Toaster';
import { fuelSaleApi, fuelTypeApi } from '../../../utils/api';
import PageHeader   from '../../../components/common/PageHeader';
import Table        from '../../../components/common/Table';
import Button       from '../../../components/common/Button';
import Input        from '../../../components/common/Input';
import Modal        from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import FuelSaleForm from '../../../components/transactions/FuelSaleForm';

function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-neutral-border shadow p-4">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-neutral-muted font-medium">{label}</p>
        <p className="text-lg font-bold text-neutral-text">{value}</p>
      </div>
    </div>
  );
}

const today = () => new Date().toISOString().split('T')[0];

export default function TodaysEntry() {
  const [date,     setDate]     = useState(today());
  const [modal,    setModal]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const { data: res, loading, execute: load } = useApi(fuelSaleApi.getByDate);
  const rows = res?.data || [];

  // Calculate totals for stats
  const totalLitres = rows.reduce((sum, r) => sum + parseFloat(r.litres_sold || 0), 0);
  const totalSales = rows.reduce((sum, r) => sum + parseFloat(r.sales_amount || 0), 0);
  const totalCommission = rows.reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);

  const refresh = useCallback(() => load(date), [date, load]);

  useEffect(() => { load(date); }, [date, load]);

  const [fuelTypeOptions, setFuelTypeOptions] = useState([]);
  useEffect(() => {
    fuelTypeApi.list({ limit: 50, is_active: true }).then((res) => {
      setFuelTypeOptions((res?.data?.rows || []).map((f) => ({ value: f.id, label: `${f.fuel_type} (${f.code})` })));
    }).catch(console.error);
  }, []);

  const openAdd    = ()    => { setSelected(null); setModal('add'); };
  const openEdit   = (row) => { setSelected(row);  setModal('edit'); };
  const openDelete = (row) => { setSelected(row);  setModal('delete'); };
  const closeModal = ()    => { setModal(null); setSelected(null); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (selected?.id) {
        await fuelSaleApi.update(selected.id, { ...data, sale_date: date });
        toast('Entry updated', 'success');
      } else {
        await fuelSaleApi.create({ ...data, sale_date: date });
        toast('Entry added', 'success');
      }
      closeModal();
      refresh();
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fuelSaleApi.remove(selected.id);
      toast('Entry deleted', 'success');
      closeModal();
      refresh();
    } catch (err) {
      toast(err.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'fuel_type',       label: 'Fuel Type', render: (_, row) => row.fuelType?.fuel_type || '—' },
    { key: 'opening_meter',   label: 'Opening' },
    { key: 'closing_meter',   label: 'Closing' },
    {
      key: 'litres_sold', label: 'Litres Sold',
      render: (v) => parseFloat(v || 0).toFixed(2),
    },
    {
      key: 'sales_amount', label: 'Amount (₹)',
      render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}`,
    },
    {
      key: 'commission_amount', label: 'Commission',
      render: (v) => v ? `₹ ${parseFloat(v).toFixed(2)}` : '—',
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}><Pencil size={15} /></Button>
          <Button size="sm" variant="ghost" onClick={() => openDelete(row)}><Trash2 size={15} className="text-danger" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Today's Entry" subtitle="Record daily fuel sales" onAdd={openAdd} />

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <StatCard
          icon={Droplets}
          label="Total Litres"
          value={`${totalLitres.toFixed(2)} L`}
          colorClass="bg-warning-light text-warning"
        />
        <StatCard
          icon={Wallet}
          label="Total Sales"
          value={`₹ ${totalSales.toFixed(2)}`}
          colorClass="bg-primary-light text-primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Commission (Profit)"
          value={`₹ ${totalCommission.toFixed(2)}`}
          colorClass="bg-success-light text-success"
        />
      </div>
      {/* Date picker */}
      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-neutral-text">Select Date</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        {date !== today() && (
          <Button size="sm" variant="secondary" onClick={() => setDate(today())}>Today</Button>
        )}
      </div>


      <Table columns={columns} rows={rows} loading={loading}
        emptyText="No fuel entries for this date. Click 'Add New' to record one." />

      <Modal open={modal === 'add' || modal === 'edit'} onClose={closeModal}
        title={modal === 'edit' ? 'Edit Entry' : 'New Fuel Entry'} size="lg">
        <FuelSaleForm
          defaultValues={modal === 'edit' ? selected : { sale_date: date }}
          onSubmit={handleSave}
          loading={saving}
          fuelTypeOptions={fuelTypeOptions}
        />
      </Modal>

      <ConfirmModal open={modal === 'delete'} onClose={closeModal}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Entry"
        message={`Delete fuel entry for ${selected?.fuelType?.fuel_type || 'this fuel type'}? This cannot be undone.`}
      />
    </>
  );
}
