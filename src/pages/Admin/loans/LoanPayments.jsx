import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { loanTransactionApi, loanApi } from '../../../utils/api';
import PageHeader           from '../../../components/common/PageHeader';
import Table                from '../../../components/common/Table';
import Badge                from '../../../components/common/Badge';
import Button               from '../../../components/common/Button';
import Input                from '../../../components/common/Input';
import Select               from '../../../components/common/Select';
import Modal                from '../../../components/common/Modal';
import ConfirmModal         from '../../../components/common/ConfirmModal';
import LoanTransactionForm  from '../../../components/loans/LoanTransactionForm';

const TYPE_OPTS = [
  { value: 'DISBURSEMENT', label: 'Disbursement' },
  { value: 'REPAYMENT',    label: 'Repayment' },
];

const today = new Date().toISOString().split('T')[0];

export default function LoanPayments() {
  const [searchParams] = useSearchParams();
  const loanIdFromRoute = searchParams.get('loan_id') || undefined;

  const list      = useListPage(loanTransactionApi.list, {
    from_date: today,
    to_date:   today,
    ...(loanIdFromRoute ? { loan_id: loanIdFromRoute } : {}),
  });
  const { toast } = useToast();
  const [saving,   setSaving]   = useState(false);
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
    { key: 'transaction_date', label: 'Date' },
    { key: 'loan',             label: 'Loan', render: (_, row) => row.loan?.vendor?.name || row.loan?.loan_type || '—' },
    {
      key: 'type', label: 'Type',
      render: (v) => <Badge variant={v === 'DISBURSEMENT' ? 'danger' : 'success'}>{v}</Badge>,
    },
    { key: 'amount',       label: 'Amount (₹)',   render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'payment_mode', label: 'Mode',         render: (v) => <Badge variant="neutral">{v}</Badge> },
    { key: 'remarks',      label: 'Remarks',      render: (v) => v || '—' },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)}>
          <Trash2 size={15} className="text-danger" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Loan Payments" subtitle="Disbursements and repayments"
        onAdd={list.openAdd} addLabel="Record Payment" />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex flex-wrap gap-3">
        <Select options={loanOptions} placeholder="All loans"
          value={list.params.loan_id || loanIdFromRoute || ''}
          onChange={(e) => list.setFilter('loan_id', e.target.value || undefined)}
          className="w-60" />
        <Select options={TYPE_OPTS} placeholder="All types"
          value={list.params.type || ''}
          onChange={(e) => list.setFilter('type', e.target.value || undefined)}
          className="w-40" />
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
      </div>

      <Table columns={columns} rows={list.rows} meta={list.meta} loading={list.loading}
        onPageChange={list.setPage} emptyText="No loan payments found." />

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
