import { useEffect, useState } from 'react';
import {
  HandCoins, Droplets, Fuel, TrendingUp, TrendingDown,
  Receipt, Users, BookOpen, LayoutDashboard
} from 'lucide-react';
import { useApi } from '../../utils/useApi';
import { dashboardApi } from '../../utils/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

function StatCard({ icon: Icon, label, value, colorClass, borderAccent, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse">
        <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
        <div className="h-7 w-32 bg-slate-200 rounded" />
      </div>
    );
  }
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 ${borderAccent || ''}`}>
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5 truncate tracking-tight">{value}</p>
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
  const [toDate, setToDate]     = useState(today);
  const { data: res, loading, execute: load } = useApi(dashboardApi.getSummary);
  const d = res?.data || {};
  const fuel   = d.fuel        || {};
  const txns   = d.transactions || {};
  const profit = d.profit       || {};
  const loans  = d.loans        || {};

  useEffect(() => { 
    load({ from_date: fromDate, to_date: toDate }); 
  }, [fromDate, toDate, load]);

  // Fuel cards with IOCL color accents
  const fuelCards = [
    {
      icon: Droplets, label: 'Litres Sold',
      value: fuel.total_litres ? `${fmt(fuel.total_litres)} L` : '—',
      colorClass: 'bg-blue-100 text-blue-700',
      borderAccent: 'border-l-4 border-l-blue-600',
    },
    {
      icon: Fuel, label: 'Fuel Revenue',
      value: fmt(fuel.total_sales, '₹ '),
      colorClass: 'bg-amber-100 text-amber-700',
      borderAccent: 'border-l-4 border-l-amber-500',
    },
    {
      icon: HandCoins, label: 'Profit (Commission)',
      value: fmt(profit.total_commission, '₹ '),
      colorClass: 'bg-emerald-100 text-emerald-700',
      borderAccent: 'border-l-4 border-l-emerald-500',
    },
  ];

  // Daybook financial cards
  const finCards = [
    {
      icon: TrendingUp, label: 'Total Income',
      value: fmt(txns.total_income, '₹ '),
      colorClass: 'bg-emerald-100 text-emerald-700',
      borderAccent: 'border-l-4 border-l-emerald-500',
    },
    {
      icon: Receipt, label: 'Total Expense',
      value: fmt(txns.total_expense, '₹ '),
      colorClass: 'bg-rose-100 text-rose-700',
      borderAccent: 'border-l-4 border-l-rose-500',
    },
    {
      icon: TrendingDown, label: 'Net Balance',
      value: fmt(profit.net_profit, '₹ '),
      colorClass: parseFloat(profit.net_profit || 0) >= 0
        ? 'bg-orange-100 text-orange-700'
        : 'bg-rose-100 text-rose-700',
      borderAccent: parseFloat(profit.net_profit || 0) >= 0
        ? 'border-l-4 border-l-orange-500'
        : 'border-l-4 border-l-rose-500',
    },
  ];

  // Loan cards
  const loanCards = [
    {
      icon: Users, label: 'Active Loans',
      value: fmt(loans.active_count),
      colorClass: 'bg-indigo-100 text-indigo-700',
      borderAccent: 'border-l-4 border-l-indigo-500',
    },
    {
      icon: BookOpen, label: 'Outstanding Loans',
      value: fmt(loans.total_outstanding, '₹ '),
      colorClass: 'bg-rose-100 text-rose-700',
      borderAccent: 'border-l-4 border-l-rose-500',
    },
  ];

  return (
    <>
      {/* Dashboard Top Header Card with Border */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/25 flex-shrink-0">
            <LayoutDashboard size={22} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-lg">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-muted uppercase">From</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-32 text-xs" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-muted uppercase">To</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-32 text-xs" />
          </div>
          <Button size="sm" variant="secondary" onClick={() => { setFromDate(today); setToDate(today); }}>Today</Button>
          <Button size="sm" variant="secondary" onClick={() => { setFromDate(firstOfMonth()); setToDate(today); }}>This Month</Button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">Overview</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {fuelCards.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
        {finCards.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
        {loanCards.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
      </div>
    </>
  );
}
