import { useEffect, useState } from 'react';
import {
  HandCoins, Droplets, Fuel, TrendingUp, TrendingDown,
  Receipt, PiggyBank, Users, BookOpen,
} from 'lucide-react';
import { useApi } from '../../utils/useApi';
import { dashboardApi } from '../../utils/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

function StatCard({ icon: Icon, label, value, colorClass, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-border shadow p-5 animate-pulse">
        <div className="h-3 w-20 bg-neutral-border rounded mb-3" />
        <div className="h-7 w-32 bg-neutral-border rounded" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-neutral-border shadow p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-muted uppercase tracking-wide truncate">{label}</p>
        <p className="text-xl font-bold text-neutral-text mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

const fmt = (n, prefix = '') => {
  if (n === null || n === undefined) return '—';
  return `${prefix}${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const today = new Date().toISOString().split('T')[0];

const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export default function Dashboard() {
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const { data: res, loading, execute: load } = useApi(dashboardApi.getSummary);
  const d = res?.data || {};
  const fuel   = d.fuel        || {};
  const txns   = d.transactions || {};
  const profit = d.profit       || {};
  const loans  = d.loans        || {};

  useEffect(() => { load({ from_date: fromDate, to_date: toDate }); }, [fromDate, toDate, load]);

  // Row 1 — Fuel stats
  const fuelCards = [
    {
      icon: Droplets, label: 'Litres Sold',
      value: fuel.total_litres ? `${fmt(fuel.total_litres)} L` : '—',
      colorClass: 'bg-warning-light text-warning',
    },
    {
      icon: Fuel, label: 'Fuel Revenue',
      value: fmt(fuel.total_sales, '₹ '),
      colorClass: 'bg-warning-light text-warning',
    },
    {
      icon: HandCoins, label: 'Profit (Commission)',
      value: fmt(profit.total_commission, '₹ '),
      colorClass: 'bg-success-light text-success',
    },
  ];

  // Row 2 — Daybook / financial stats
  const finCards = [
    {
      icon: TrendingUp, label: 'Total Income',
      value: fmt(txns.total_income, '₹ '),
      colorClass: 'bg-primary-light text-primary',
    },
    {
      icon: Receipt, label: 'Total Expense',
      value: fmt(txns.total_expense, '₹ '),
      colorClass: 'bg-danger-light text-danger',
    },
    {
      icon: TrendingDown, label: 'Net (Profit + Income − Exp)',
      value: fmt(profit.net_profit, '₹ '),
      colorClass: parseFloat(profit.net_profit || 0) >= 0
        ? 'bg-success-light text-success'
        : 'bg-danger-light text-danger',
    },
  ];

  // Row 3 — Loan stats
  const loanCards = [
    {
      icon: Users, label: 'Active Loans',
      value: fmt(loans.active_count),
      colorClass: 'bg-primary-light text-primary',
    },
    {
      icon: BookOpen, label: 'Outstanding Loans',
      value: fmt(loans.total_outstanding, '₹ '),
      colorClass: 'bg-danger-light text-danger',
    },
  ];

  return (
    <>
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-neutral-text">Dashboard</h1>
        <span className="text-sm text-neutral-muted">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-muted mb-1">From Date</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-muted mb-1">To Date</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-44" />
        </div>
        <Button size="sm" variant="secondary" onClick={() => { setFromDate(today); setToDate(today); }}>Today</Button>
        <Button size="sm" variant="secondary" onClick={() => { setFromDate(firstOfMonth()); setToDate(today); }}>This Month</Button>
      </div>

      {/* Fuel stats */}
      <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">Fuel</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {fuelCards.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
      </div>

      {/* Financial stats */}
      <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">Financials</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {finCards.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
      </div>

      {/* Loan stats */}
      <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">Loans</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loanCards.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
      </div>
    </>
  );
}
