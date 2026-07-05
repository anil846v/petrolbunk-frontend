import { useState, useEffect } from 'react';
import { Pencil, Trash2, TrendingUp, TrendingDown, Minus, HandCoins, PiggyBank } from 'lucide-react';
import { useListPage } from '../../../hooks/useListPage';
import { useApi } from '../../../utils/useApi';
import { useToast } from '../../../components/common/Toaster';
import { transactionApi, categoryApi, vendorApi } from '../../../utils/api';
import PageHeader       from '../../../components/common/PageHeader';
import Table            from '../../../components/common/Table';
import Badge            from '../../../components/common/Badge';
import Button           from '../../../components/common/Button';
import Input            from '../../../components/common/Input';
import Select           from '../../../components/common/Select';
import Modal            from '../../../components/common/Modal';
import ConfirmModal     from '../../../components/common/ConfirmModal';
import TransactionForm  from '../../../components/transactions/TransactionForm';

const today = new Date().toISOString().split('T')[0];

const PAYMENT_OPTS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
  { value: 'UPI',  label: 'UPI' },
];

function SummaryCard({ icon: Icon, label, amount, colorClass }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-neutral-border shadow p-4">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-neutral-muted font-medium">{label}</p>
        <p className="text-lg font-bold text-neutral-text">₹ {parseFloat(amount || 0).toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function Daybook() {
  const list      = useListPage(transactionApi.list, { from_date: today, to_date: today });
  const { toast } = useToast();
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Summary totals
  const { data: summaryRes, execute: loadSummary } = useApi(transactionApi.getSummary);
  const summary = summaryRes?.data || {};

  const { from_date, to_date } = list.params;
  useEffect(() => {
    loadSummary({ from_date, to_date });
  }, [from_date, to_date, loadSummary]);

  // Category and vendor options — loaded at page level so modal forms always receive them as props
  const [catOptions, setCatOptions] = useState([]);
  useEffect(() => {
    categoryApi.list({ limit: 200, is_active: true }).then((res) => {
      setCatOptions((res?.data?.rows || []).map((c) => ({ value: c.id, label: c.name })));
    }).catch(console.error);
  }, []);

  const [vendorOptions, setVendorOptions] = useState([]);
  useEffect(() => {
    vendorApi.list({ limit: 200, is_active: true }).then((res) => {
      setVendorOptions((res?.data?.rows || []).map((v) => ({ value: v.id, label: v.name })));
    }).catch(console.error);
  }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (list.selected?.id) {
        await transactionApi.update(list.selected.id, data);
        toast('Entry updated', 'success');
      } else {
        await transactionApi.create(data);
        toast('Entry added', 'success');
      }
      list.closeModal();
      list.refresh();
      loadSummary({ from_date, to_date });
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionApi.remove(list.selected.id);
      toast('Entry deleted', 'success');
      list.closeModal();
      list.refresh();
      loadSummary({ from_date, to_date });
    } catch (err) {
      toast(err.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const SOURCE_LABEL = { FUEL: 'Fuel Sale', LOAN: 'Loan' };

  const columns = [
    { key: 'transaction_date', label: 'Date' },
    { key: 'voucher_no',       label: 'Voucher', render: (v) => v || '—' },
    { key: 'category',         label: 'Category', render: (_, row) => row.category?.name || '—' },
    { key: 'vendor',           label: 'Party',    render: (_, row) => row.vendor?.name   || '—' },
    {
      key: 'description', label: 'Description',
      render: (v, row) => row.reference_type !== 'MANUAL'
        ? <span className="text-neutral-muted text-xs italic">{v || SOURCE_LABEL[row.reference_type]}</span>
        : <span className="text-xs">{v || '—'}</span>,
    },
    {
      key: 'amount', label: 'Amount (₹)',
      render: (v, row) => (
        <span className={row.category?.type === 'INCOME' ? 'text-success font-semibold' : 'text-danger font-semibold'}>
          {row.category?.type === 'INCOME' ? '+' : '−'} ₹ {parseFloat(v || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'payment_mode', label: 'Mode',
      render: (v) => <Badge variant="neutral">{v}</Badge>,
    },
    {
      key: 'source', label: 'Source',
      render: (_, row) => row.reference_type !== 'MANUAL'
        ? <Badge variant="warning">{SOURCE_LABEL[row.reference_type]}</Badge>
        : <Badge variant="neutral">Manual</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => row.reference_type === 'MANUAL' ? (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => list.openEdit(row)}><Pencil size={15} /></Button>
          <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)}><Trash2 size={15} className="text-danger" /></Button>
        </div>
      ) : (
        <span className="text-xs text-neutral-muted">auto</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Day Book" subtitle="Income and expense ledger" onAdd={list.openAdd} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <SummaryCard icon={HandCoins}   label="Profit (Commission)"  amount={summary.total_commission}
          colorClass="bg-success-light text-success" />
        <SummaryCard icon={TrendingUp}  label="Total Income"          amount={summary.total_income}
          colorClass="bg-primary-light text-primary" />
        <SummaryCard icon={PiggyBank}   label="Invested Amount"       amount={summary.invested_amount}
          colorClass="bg-primary-light text-primary" />
        <SummaryCard icon={TrendingDown} label="Total Expense"        amount={summary.total_expense}
          colorClass="bg-danger-light text-danger" />
        <SummaryCard icon={Minus}       label="Net (Profit + Income − Exp)" amount={summary.net}
          colorClass={parseFloat(summary.net || 0) >= 0
            ? 'bg-success-light text-success'
            : 'bg-danger-light text-danger'} />
      </div>

      {/* Filters */}
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
        <Select options={catOptions} placeholder="All categories"
          value={list.params.category_id || ''}
          onChange={(e) => list.setFilter('category_id', e.target.value || undefined)}
          className="w-44" />
        <Select options={PAYMENT_OPTS} placeholder="All modes"
          value={list.params.payment_mode || ''}
          onChange={(e) => list.setFilter('payment_mode', e.target.value || undefined)}
          className="w-36" />
        <Input placeholder="Search..." value={list.search}
          onChange={(e) => list.setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Table columns={columns} rows={list.rows} meta={list.meta} loading={list.loading}
        onPageChange={list.setPage} emptyText="No transactions found for the selected period." />

      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit Entry' : 'New Day Book Entry'} size="lg">
        <TransactionForm
          defaultValues={list.modal === 'edit' ? list.selected : null}
          onSubmit={handleSave}
          loading={saving}
          categoryOptions={catOptions}
          vendorOptions={vendorOptions}
        />
      </Modal>

      <ConfirmModal open={list.modal === 'delete'} onClose={list.closeModal}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Entry"
        message="Delete this transaction? This cannot be undone."
      />
    </>
  );
}
