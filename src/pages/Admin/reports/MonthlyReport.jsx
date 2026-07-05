import { useState } from 'react';
import { FileBarChart, Download } from 'lucide-react';
import { useApi } from '../../../utils/useApi';
import { reportApi } from '../../../utils/api';
import PageHeader from '../../../components/common/PageHeader';
import Card       from '../../../components/common/Card';
import Button     from '../../../components/common/Button';
import Input      from '../../../components/common/Input';
import Loader     from '../../../components/common/Loader';

const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const today = () => new Date().toISOString().split('T')[0];

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-border shadow p-4">
      <p className="text-xs text-neutral-muted font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-neutral-text">{value}</p>
      {sub && <p className="text-xs text-neutral-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function MonthlyReport() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to,   setTo]   = useState(today());

  const { data: res, loading, execute: generate } = useApi(reportApi.monthly);
  const report = res?.data || null;

  const handleGenerate = () => {
    if (!from || !to) return;
    generate({ from_date: from, to_date: to });
  };

  return (
    <>
      <PageHeader title="Monthly Report" subtitle="Fuel sales and income/expense summary" />

      {/* Date range + generate */}
      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-neutral-muted mb-1">From Date</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-muted mb-1">To Date</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </div>
        <Button onClick={handleGenerate} loading={loading}>
          <FileBarChart size={16} className="mr-1" />
          Generate Report
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
        </div>
      )}

      {!loading && !report && (
        <Card>
          <div className="text-center py-12 text-neutral-muted">
            <FileBarChart size={40} className="mx-auto mb-3 opacity-40" />
            <p>Select a date range and click <strong>Generate Report</strong> to view data.</p>
          </div>
        </Card>
      )}

      {!loading && report && (
        <div className="space-y-6">

          {/* Fuel summary */}
          {report.fuel && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-muted uppercase tracking-wide mb-3">Fuel Sales</h2>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total Litres Sold"
                  value={parseFloat(report.fuel.total_litres || 0).toFixed(2)}
                  sub="litres" />
                <StatCard label="Gross Revenue"
                  value={`₹ ${parseFloat(report.fuel.total_amount || 0).toFixed(2)}`} />
                <StatCard label="Total Commission"
                  value={`₹ ${parseFloat(report.fuel.total_commission || 0).toFixed(2)}`} />
              </div>
            </section>
          )}

          {/* Income / Expense summary */}
          {report.transactions && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-muted uppercase tracking-wide mb-3">Day Book Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total Income"
                  value={`₹ ${parseFloat(report.transactions.total_income || 0).toFixed(2)}`} />
                <StatCard label="Total Expense"
                  value={`₹ ${parseFloat(report.transactions.total_expense || 0).toFixed(2)}`} />
                <StatCard label="Net Balance"
                  value={`₹ ${parseFloat(report.transactions.net || 0).toFixed(2)}`} />
              </div>
            </section>
          )}

          {/* Daily breakdown */}
          {Array.isArray(report.daily_breakdown) && report.daily_breakdown.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-muted uppercase tracking-wide mb-3">Daily Breakdown</h2>
              <div className="bg-white rounded-lg border border-neutral-border shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-border bg-neutral-bg">
                      <th className="text-left px-4 py-3 font-semibold text-neutral-text">Date</th>
                      <th className="text-right px-4 py-3 font-semibold text-neutral-text">Litres</th>
                      <th className="text-right px-4 py-3 font-semibold text-neutral-text">Fuel Amount</th>
                      <th className="text-right px-4 py-3 font-semibold text-neutral-text">Income</th>
                      <th className="text-right px-4 py-3 font-semibold text-neutral-text">Expense</th>
                      <th className="text-right px-4 py-3 font-semibold text-neutral-text">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.daily_breakdown.map((row, i) => (
                      <tr key={i} className="border-b border-neutral-border last:border-0 hover:bg-neutral-bg/50">
                        <td className="px-4 py-3">{row.date}</td>
                        <td className="px-4 py-3 text-right">{parseFloat(row.litres || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">₹ {parseFloat(row.fuel_amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-success">₹ {parseFloat(row.income || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-danger">₹ {parseFloat(row.expense || 0).toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${parseFloat(row.net || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                          ₹ {parseFloat(row.net || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      )}
    </>
  );
}
