import { useState } from 'react';
import { Pencil, X, Eye, Download, HandCoins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { exportToCsv } from '../../../utils/exportToCsv';
import { loanApi } from '../../../utils/api';
import PageHeader from '../../../components/common/PageHeader';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import LoanForm from '../../../components/loans/LoanForm';

const LOAN_TYPE_OPTS = [
  { value: 'GIVEN', label: 'Given (money out)' },
  { value: 'TAKEN', label: 'Taken (money in)' },
];

const STATUS_OPTS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function Loans() {
  const list = useListPage(loanApi.list);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeTarget, setCloseTarget] = useState(null);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (list.selected?.id) {
        await loanApi.update(list.selected.id, data);
        toast('Loan updated', 'success');
      } else {
        await loanApi.create(data);
        toast('Loan created', 'success');
      }
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await loanApi.close(closeTarget.id);
      toast(`Loan for ${closeTarget.vendor?.name || 'party'} closed`, 'success');
      setCloseTarget(null);
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to close loan', 'error');
    } finally {
      setClosing(false);
    }
  };

  const columns = [
    { key: 'vendor', label: 'Party', sortable: true, render: (_, row) => row.vendor?.name || '—' },
    {
      key: 'loan_type', label: 'Type', align: 'center', sortable: true,
      render: (v) => <Badge variant={v === 'GIVEN' ? 'danger' : 'success'}>{v}</Badge>,
    },
    { key: 'principal_amount', label: 'Principal (₹)', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'interest_percent', label: 'Interest (%)', align: 'right', sortable: true, render: (v) => `${v || 0} %` },
    { key: 'start_date', label: 'Start Date', align: 'center', sortable: true },
    { key: 'end_date', label: 'End Date', align: 'center', sortable: true, render: (v) => v || '—' },
    {
      key: 'status', label: 'Status', align: 'center', sortable: true,
      render: (v) => <Badge variant={v === 'ACTIVE' ? 'success' : 'neutral'}>{v}</Badge>,
    },
    {
      key: 'actions', label: '', align: 'center', sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/loans/payments?loan_id=${row.id}`)} aria-label="View payments">
            <Eye size={15} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => list.openEdit(row)}>
            <Pencil size={15} />
          </Button>
          {row.status === 'ACTIVE' && (
            <Button size="sm" variant="ghost" onClick={() => setCloseTarget(row)} aria-label="Close loan">
              <X size={15} className="text-danger" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleExportCsv = () => {
    if (!list.rows || list.rows.length === 0) {
      toast('No loans to export', 'info');
      return;
    }

    const columns = [
      { label: 'Party / Vendor', formatter: (_, r) => r.vendor?.name || '—' },
      { label: 'Loan Type', key: 'loan_type' },
      { label: 'Principal Amount (₹)', key: 'principal_amount', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Interest Rate (%)', key: 'interest_percent', formatter: (v) => `${v || 0}%` },
      { label: 'Start Date', key: 'start_date' },
      { label: 'End Date', key: 'end_date' },
      { label: 'Status', key: 'status' },
      { label: 'Notes', key: 'notes' },
    ];

    exportToCsv({
      filename: `loans_register_${new Date().toISOString().split('T')[0]}.csv`,
      title: 'Petrol Bunk IOCL Enterprise Suite (IOCL) — Loans & Capital Accounts Register',
      metadata: [
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        `Total Accounts: ${list.rows.length}`,
      ],
      columns,
      data: list.rows,
    });
    toast('Exported loans list', 'success');
  };

  return (
    <>
      <PageHeader
        title="Loan Accounts"
        subtitle="Track given and received loans"
        icon={HandCoins}
        onAdd={list.openAdd}
        action={
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={list.loading || list.rows.length === 0}
            title="Export loans register to Excel/CSV"
          >
            <Download size={16} className="mr-1.5 text-primary" />
            Export CSV
          </Button>
        }
      />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto">
          <Select options={LOAN_TYPE_OPTS} placeholder="All types"
            value={list.params.loan_type || ''}
            onChange={(e) => list.setFilter('loan_type', e.target.value || undefined)} className="w-full sm:w-52" />
        </div>
        <div className="w-full sm:w-auto">
          <Select options={STATUS_OPTS} placeholder="All statuses"
            value={list.params.status || ''}
            onChange={(e) => list.setFilter('status', e.target.value || undefined)} className="w-full sm:w-36" />
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
        emptyText="No loans found."
      />

      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit Loan' : 'New Loan'} size="lg">
        <LoanForm defaultValues={list.modal === 'edit' ? list.selected : null}
          onSubmit={handleSave} loading={saving} />
      </Modal>

      <ConfirmModal open={!!closeTarget} onClose={() => setCloseTarget(null)}
        onConfirm={handleClose} loading={closing}
        title="Close Loan"
        message={`Mark loan for "${closeTarget?.vendor?.name || 'this party'}" as closed? This cannot be reversed.`}
      />
    </>
  );
}
