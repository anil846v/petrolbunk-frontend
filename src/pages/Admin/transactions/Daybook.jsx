import { useState, useEffect } from 'react';
import { Pencil, Trash2, TrendingUp, TrendingDown, Minus, HandCoins, Download, BookOpen } from 'lucide-react';
import { useListPage } from '../../../hooks/useListPage';
import { useApi } from '../../../utils/useApi';
import { useToast } from '../../../components/common/Toaster';
import { exportToCsv } from '../../../utils/exportToCsv';
import { transactionApi } from '../../../utils/api';
import { useCategories } from '../../../hooks/useCategories';
import { useVendors } from '../../../hooks/useVendors';
import PageHeader from '../../../components/common/PageHeader';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import TransactionForm from '../../../components/transactions/TransactionForm';

const today = new Date().toISOString().split('T')[0];

const PAYMENT_OPTS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
  { value: 'UPI', label: 'UPI' },
];

function SummaryCard({ icon: Icon, label, amount, colorClass, borderAccent, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3.5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 animate-pulse">
        <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
          <div className="h-5 w-28 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-3.5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 ${borderAccent || ''}`}>
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-900 tracking-tight">₹ {parseFloat(amount || 0).toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function Daybook() {
  const list = useListPage(transactionApi.list, { from_date: today, to_date: today });
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Summary totals with loading state
  const { data: summaryRes, loading: summaryLoading, execute: loadSummary } = useApi(transactionApi.getSummary);
  const summary = summaryRes?.data || {};

  const { from_date, to_date } = list.params;
  useEffect(() => {
    loadSummary({ from_date, to_date });
  }, [from_date, to_date, loadSummary]);

  // Cached Category and vendor options (in-memory cache — 0 duplicate network calls!)
  const { options: catOptions, loading: catLoading } = useCategories();
  const { options: vendorOptions, loading: vendorLoading } = useVendors();

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
    { key: 'transaction_date', label: 'Date', sortable: true },
    { key: 'voucher_no', label: 'Voucher', align: 'center', render: (v) => v || '—' },
    { key: 'category', label: 'Category', render: (_, row) => row.category?.name || '—' },
    { key: 'vendor', label: 'Party', render: (_, row) => row.vendor?.name || '—' },
    {
      key: 'description', label: 'Description',
      render: (v, row) => row.reference_type !== 'MANUAL'
        ? <span className="text-neutral-muted text-xs italic">{v || SOURCE_LABEL[row.reference_type]}</span>
        : <span className="text-xs">{v || '—'}</span>,
    },
    {
      key: 'amount', label: 'Amount (₹)', align: 'right', sortable: true,
      render: (v, row) => (
        <span className={row.category?.type === 'INCOME' ? 'text-success font-semibold' : 'text-danger font-semibold'}>
          {row.category?.type === 'INCOME' ? '+' : '−'} ₹ {parseFloat(v || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'payment_mode', label: 'Mode', align: 'center',
      render: (v) => <Badge variant="neutral">{v}</Badge>,
    },
    {
      key: 'source', label: 'Source', align: 'center',
      render: (_, row) => row.reference_type !== 'MANUAL'
        ? <Badge variant="warning">{SOURCE_LABEL[row.reference_type]}</Badge>
        : <Badge variant="neutral">Manual</Badge>,
    },
    {
      key: 'actions', label: '', align: 'center', sortable: false,
      render: (_, row) => row.reference_type === 'MANUAL' ? (
        <div className="flex items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => list.openEdit(row)}><Pencil size={15} /></Button>
          <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)}><Trash2 size={15} className="text-danger" /></Button>
        </div>
      ) : (
        <span className="text-xs text-neutral-muted">auto</span>
      ),
    },
  ];

  const handleExportDaybookCsv = () => {
    if (!list.rows || list.rows.length === 0) {
      toast('No ledger entries to export', 'info');
      return;
    }

    const columns = [
      { label: 'Date', key: 'transaction_date' },
      { label: 'Voucher No', key: 'voucher_no' },
      { label: 'Type', formatter: (_, r) => r.category?.type || 'EXPENSE' },
      { label: 'Category', formatter: (_, r) => r.category?.name || '—' },
      { label: 'Party / Vendor', formatter: (_, r) => r.vendor?.name || '—' },
      { label: 'Description', key: 'description' },
      { label: 'Payment Mode', key: 'payment_mode' },
      { label: 'Source', formatter: (_, r) => r.reference_type === 'MANUAL' ? 'Manual' : (SOURCE_LABEL[r.reference_type] || r.reference_type) },
      {
        label: 'Income (₹)',
        formatter: (v, r) => r.category?.type === 'INCOME' ? parseFloat(r.amount || 0).toFixed(2) : '0.00'
      },
      {
        label: 'Expense (₹)',
        formatter: (v, r) => r.category?.type === 'EXPENSE' ? parseFloat(r.amount || 0).toFixed(2) : '0.00'
      },
      {
        label: 'Net (₹)',
        formatter: (v, r) => {
          const sign = r.category?.type === 'INCOME' ? 1 : -1;
          return (sign * parseFloat(r.amount || 0)).toFixed(2);
        }
      }
    ];

    const summaryRows = [
      ['SUMMARY TOTALS', '', '', '', '', '', '', '', '', '', ''],
      ['Total Income', '', '', '', '', '', '', '', Number(summary.total_income || 0).toFixed(2), '', ''],
      ['Total Expense', '', '', '', '', '', '', '', '', Number(summary.total_expense || 0).toFixed(2), ''],
      ['Gross Profit (Commission)', '', '', '', '', '', '', '', '', '', Number(summary.total_commission || 0).toFixed(2)],
      ['Net Financial Balance', '', '', '', '', '', '', '', '', '', Number(summary.net || 0).toFixed(2)]
    ];

    const fromStr = list.params.from_date || 'start';
    const toStr = list.params.to_date || 'end';

    exportToCsv({
      filename: `daybook_ledger_${fromStr}_to_${toStr}.csv`,
      title: 'Petrol Bunk IOCL Enterprise Suite (IOCL) — Day Book Financial Ledger',
      metadata: [
        `Period: ${fromStr} to ${toStr}`,
        `Total Entries: ${list.rows.length}`,
        `Generated: ${new Date().toLocaleString('en-IN')}`
      ],
      columns,
      data: list.rows,
      summaryRows
    });
    toast('Exported Day Book ledger', 'success');
  };

  return (
    <>
      <PageHeader
        title="Day Book"
        subtitle="Income and expense ledger"
        icon={BookOpen}
        onAdd={list.openAdd}
        action={
          <Button
            variant="outline"
            onClick={handleExportDaybookCsv}
            disabled={list.loading || list.rows.length === 0}
            title="Export ledger entries to Excel/CSV"
          >
            <Download size={16} className="mr-1.5 text-primary" />
            Export CSV
          </Button>
        }
      />

      {/* Summary cards with IOCL Domain Color Accents & Loading State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <SummaryCard
          icon={HandCoins}
          label="Profit (Commission)"
          amount={summary.total_commission}
          colorClass="bg-amber-100 text-amber-700"
          borderAccent="border-l-4 border-l-amber-500"
          loading={summaryLoading}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Total Income"
          amount={summary.total_income}
          colorClass="bg-emerald-100 text-emerald-700"
          borderAccent="border-l-4 border-l-emerald-500"
          loading={summaryLoading}
        />
        <SummaryCard
          icon={TrendingDown}
          label="Total Expense"
          amount={summary.total_expense}
          colorClass="bg-rose-100 text-rose-700"
          borderAccent="border-l-4 border-l-rose-500"
          loading={summaryLoading}
        />
        <SummaryCard
          icon={Minus}
          label="Net Balance (Profit + Income − Exp)"
          amount={summary.net}
          colorClass={parseFloat(summary.net || 0) >= 0
            ? 'bg-orange-100 text-orange-700'
            : 'bg-rose-100 text-rose-700'}
          borderAccent={parseFloat(summary.net || 0) >= 0
            ? 'border-l-4 border-l-orange-500'
            : 'border-l-4 border-l-rose-500'}
          loading={summaryLoading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto flex-1 min-w-[180px]">
          <Input
            placeholder="Search..."
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select
            options={catOptions}
            placeholder="All categories"
            loading={catLoading}
            value={list.params.category_id || ''}
            onChange={(e) => list.setFilter('category_id', e.target.value || undefined)}
            className="w-full sm:w-44"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select
            options={PAYMENT_OPTS}
            placeholder="All modes"
            value={list.params.payment_mode || ''}
            onChange={(e) => list.setFilter('payment_mode', e.target.value || undefined)}
            className="w-full sm:w-36"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-neutral-muted uppercase whitespace-nowrap">From</label>
          <Input
            type="date"
            value={list.params.from_date || ''}
            className="w-full sm:w-36 text-xs"
            onChange={(e) => list.setFilter('from_date', e.target.value || undefined)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-neutral-muted uppercase whitespace-nowrap">To</label>
          <Input
            type="date"
            value={list.params.to_date || ''}
            className="w-full sm:w-36 text-xs"
            onChange={(e) => list.setFilter('to_date', e.target.value || undefined)}
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
        emptyText="No transactions found for the selected period."
      />

      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit Entry' : 'New Day Book Entry'} size="lg">
        <TransactionForm
          defaultValues={list.modal === 'edit' ? list.selected : null}
          onSubmit={handleSave}
          loading={saving}
          categoryOptions={catOptions}
          vendorOptions={vendorOptions}
          categoriesLoading={catLoading}
          vendorsLoading={vendorLoading}
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
