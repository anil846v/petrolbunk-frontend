import { useState, useEffect } from 'react';
import { Trash2, Download, Receipt } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { exportToCsv } from '../../../utils/exportToCsv';
import { loanTransactionApi, loanApi } from '../../../utils/api';
import PageHeader from '../../../components/common/PageHeader';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import LoanTransactionForm from '../../../components/loans/LoanTransactionForm';

const TYPE_OPTS = [
  { value: 'DISBURSEMENT', label: 'Disbursement' },
  { value: 'REPAYMENT', label: 'Repayment' },
];

const today = new Date().toISOString().split('T')[0];

export default function LoanPayments() {
  const [searchParams] = useSearchParams();
  const loanIdFromRoute = searchParams.get('loan_id') || undefined;

  const list = useListPage(loanTransactionApi.list, {
    from_date: today,
    to_date: today,
    ...(loanIdFromRoute ? { loan_id: loanIdFromRoute } : {}),
  });
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Loan filter options
  const [loanOptions, setLoanOptions] = useState([]);
  useEffect(() => {
    loanApi.list({ limit: 200 }).then((res) => {
      setLoanOptions(
        (res?.data?.rows || []).map((l) => ({
          value: l.id,
          label: `${l.vendor?.name || 'Unknown'} — ${l.loan_type}`,
        }))
      );
    }).catch(console.error);
  }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      await loanTransactionApi.create(data);
      toast('Payment recorded', 'success');
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
      await loanTransactionApi.remove(list.selected.id);
      toast('Payment deleted', 'success');
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'transaction_date', label: 'Date', sortable: true },
    { key: 'loan', label: 'Loan', sortable: true, render: (_, row) => row.loan?.vendor?.name || row.loan?.loan_type || '—' },
    {
      key: 'type', label: 'Type', align: 'center', sortable: true,
      render: (v) => <Badge variant={v === 'DISBURSEMENT' ? 'danger' : 'success'}>{v}</Badge>,
    },
    { key: 'amount', label: 'Amount (₹)', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'payment_mode', label: 'Mode', align: 'center', sortable: true, render: (v) => <Badge variant="neutral">{v}</Badge> },
    { key: 'remarks', label: 'Remarks', render: (v) => v || '—' },
    {
      key: 'actions', label: '', align: 'center', sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)}>
            <Trash2 size={15} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  const handleExportCsv = () => {
    if (!list.rows || list.rows.length === 0) {
      toast('No payment records to export', 'info');
      return;
    }

    const columns = [
      { label: 'Date', key: 'transaction_date' },
      { label: 'Loan / Party', formatter: (_, r) => r.loan?.vendor?.name || r.loan?.loan_type || '—' },
      { label: 'Type', key: 'type' },
      {
        label: 'Disbursed (₹)',
        formatter: (_, r) => r.type === 'DISBURSEMENT' ? parseFloat(r.amount || 0).toFixed(2) : '0.00'
      },
      {
        label: 'Repaid (₹)',
        formatter: (_, r) => r.type === 'REPAYMENT' ? parseFloat(r.amount || 0).toFixed(2) : '0.00'
      },
      { label: 'Payment Mode', key: 'payment_mode' },
      { label: 'Remarks', key: 'remarks' },
    ];

    const totalDisbursed = list.rows.filter(r => r.type === 'DISBURSEMENT').reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalRepaid = list.rows.filter(r => r.type === 'REPAYMENT').reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    const summaryRows = [
      ['TOTALS', '', '', totalDisbursed.toFixed(2), totalRepaid.toFixed(2), '', ''],
      ['Net Outstanding Flow', '', '', (totalDisbursed - totalRepaid).toFixed(2), '', '', '']
    ];

    exportToCsv({
      filename: `loan_payments_passbook_${new Date().toISOString().split('T')[0]}.csv`,
      title: 'Petrol Bunk IOCL Enterprise Suite (IOCL) — Loan Passbook Statement',
      metadata: [
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        `Total Transactions: ${list.rows.length}`,
      ],
      columns,
      data: list.rows,
      summaryRows,
    });
    toast('Exported loan payments', 'success');
  };

  return (
    <>
      <PageHeader
        title="Loan Payments & EMIs"
        subtitle="Track repayments, installments and passbook ledger"
        icon={Receipt}
        onAdd={list.openAdd}
        addLabel="Record Repayment / EMI"
        action={
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={list.loading || list.rows.length === 0}
            title="Export passbook ledger to Excel/CSV"
          >
            <Download size={16} className="mr-1.5 text-primary" />
            Export CSV
          </Button>
        }
      />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto flex-1 min-w-[200px]">
          <Select
            options={loanOptions}
            placeholder="All loans"
            value={list.params.loan_id || loanIdFromRoute || ''}
            onChange={(e) => list.setFilter('loan_id', e.target.value || undefined)}
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
        emptyText="No loan payments found."
      />

      <Modal open={list.modal === 'add'} onClose={list.closeModal}
        title="Record Loan Payment" size="lg">
        <LoanTransactionForm onSubmit={handleSave} loading={saving}
          fixedLoanId={loanIdFromRoute} />
      </Modal>

      <ConfirmModal open={list.modal === 'delete'} onClose={list.closeModal}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Payment"
        message="Delete this loan payment? The corresponding day book entry will also be removed."
      />
    </>
  );
}
