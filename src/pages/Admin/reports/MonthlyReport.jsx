import { useState } from 'react';
import { 
  FileBarChart, Download, Fuel, Wallet, 
  Smartphone, CreditCard, Building2, TrendingUp, TrendingDown, 
  Layers, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useApi } from '../../../utils/useApi';
import { reportApi } from '../../../utils/api';
import { exportToCsv } from '../../../utils/exportToCsv';
import PageHeader from '../../../components/common/PageHeader';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Loader from '../../../components/common/Loader';
import Table from '../../../components/common/Table';

const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const today = () => new Date().toISOString().split('T')[0];

function StatCard({ label, value, sub, icon: Icon, borderAccent, bgAccent }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden ${borderAccent || ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${bgAccent || 'bg-slate-100 text-slate-600'}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview',    label: 'Executive Overview & P&L', icon: Layers },
  { id: 'collections', label: 'Collections Breakdown',   icon: Wallet },
  { id: 'expenses',    label: 'Expenses & Incomes',      icon: PieChart },
  { id: 'throughput',  label: 'Fuel Throughput',         icon: Fuel },
];

export default function MonthlyReport() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo]     = useState(today());
  const [activeTab, setActiveTab] = useState('overview');

  const { data: res, loading, execute: generate } = useApi(reportApi.monthly);
  const report = res?.data || null;

  const handleGenerate = () => {
    if (!from || !to) return;
    generate({ from_date: from, to_date: to });
  };

  // Quick Preset Handlers
  const handlePreset = (type) => {
    const d = new Date();
    if (type === 'this_month') {
      setFrom(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
      setTo(d.toISOString().split('T')[0]);
    } else if (type === 'last_month') {
      const lastMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const lastMonthEnd = new Date(d.getFullYear(), d.getMonth(), 0);
      setFrom(lastMonth.toISOString().split('T')[0]);
      setTo(lastMonthEnd.toISOString().split('T')[0]);
    } else if (type === 'last_30') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setFrom(past30.toISOString().split('T')[0]);
      setTo(d.toISOString().split('T')[0]);
    }
  };

  // CSV Export Logic tailored for each tab
  const handleExportCsv = () => {
    if (!report || !report.daily_breakdown || report.daily_breakdown.length === 0) return;

    if (activeTab === 'collections') {
      // Collections Export
      const columns = [
        { label: 'Date', key: 'date' },
        { label: 'Fuel Sales Value (₹)', key: 'fuel_amount', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'Cash in Hand (₹)', key: 'cash_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'PhonePe / UPI (₹)', key: 'upi_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'Card / POS (₹)', key: 'card_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'Fleet Credit (₹)', key: 'credit_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'Total Handed Over (₹)', key: 'total_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'Short / Excess (₹)', key: 'short_excess', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      ];

      const summaryRows = [
        ['COLLECTIONS TOTALS', '', '', '', '', '', '', ''],
        ['Total Shift Sales', Number(report.collections?.total_sales || 0).toFixed(2), '', '', '', '', '', ''],
        ['Cash Collected', '', Number(report.collections?.cash_collected || 0).toFixed(2), '', '', '', '', ''],
        ['PhonePe / UPI Collected', '', '', Number(report.collections?.upi_collected || 0).toFixed(2), '', '', '', ''],
        ['Card / POS Swipes', '', '', '', Number(report.collections?.card_collected || 0).toFixed(2), '', '', ''],
        ['Company / Fleet Credit', '', '', '', '', Number(report.collections?.credit_collected || 0).toFixed(2), '', ''],
        ['Total Collections Handed Over', '', '', '', '', '', Number(report.collections?.total_collected || 0).toFixed(2), ''],
        ['Total Shortage / Excess', '', '', '', '', '', '', Number(report.collections?.short_excess || 0).toFixed(2)],
      ];

      exportToCsv({
        filename: `forecourt_collections_${from}_to_${to}.csv`,
        title: 'Sri Balaji Petrol Pump (IOCL) — 4-Way Payment Collections Audit',
        metadata: [`Period: ${from} to ${to}`, `Generated: ${new Date().toLocaleString('en-IN')}`],
        columns,
        data: report.daily_breakdown,
        summaryRows,
      });
      return;
    }

    if (activeTab === 'throughput') {
      // Fuel Throughput Export
      const columns = [
        { label: 'Date', key: 'date' },
        { label: 'MS Petrol (Litres)', key: 'ms_litres', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'MS Petrol (₹)', key: 'ms_amount', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'HSD Diesel (Litres)', key: 'hsd_litres', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'HSD Diesel (₹)', key: 'hsd_amount', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'Total Volume (Litres)', key: 'litres', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'Gross Fuel Amount (₹)', key: 'fuel_amount', formatter: (v) => parseFloat(v || 0).toFixed(2) },
        { label: 'Dealer Commission (₹)', key: 'commission', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      ];

      const summaryRows = [
        ['FUEL THROUGHPUT TOTALS', '', '', '', '', '', '', ''],
        ['Total MS Litres', Number(report.fuel?.ms?.litres || 0).toFixed(2), '', '', '', '', '', ''],
        ['Total MS Revenue', '', Number(report.fuel?.ms?.amount || 0).toFixed(2), '', '', '', '', ''],
        ['Total HSD Litres', '', '', Number(report.fuel?.hsd?.litres || 0).toFixed(2), '', '', '', ''],
        ['Total HSD Revenue', '', '', '', Number(report.fuel?.hsd?.amount || 0).toFixed(2), '', '', ''],
        ['Total Combined Litres', '', '', '', '', Number(report.fuel?.total_litres || 0).toFixed(2), '', ''],
        ['Total Gross Revenue', '', '', '', '', '', Number(report.fuel?.total_amount || 0).toFixed(2), ''],
        ['Total Commission Earned', '', '', '', '', '', '', Number(report.fuel?.total_commission || 0).toFixed(2)],
      ];

      exportToCsv({
        filename: `fuel_throughput_${from}_to_${to}.csv`,
        title: 'Sri Balaji Petrol Pump (IOCL) — OMC Fuel Throughput Statement',
        metadata: [`Period: ${from} to ${to}`, `Generated: ${new Date().toLocaleString('en-IN')}`],
        columns,
        data: report.daily_breakdown,
        summaryRows,
      });
      return;
    }

    // Default: Executive P&L Overview Export
    const columns = [
      { label: 'Date', key: 'date' },
      { label: 'Litres', key: 'litres', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Fuel Sales (₹)', key: 'fuel_amount', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Commission (₹)', key: 'commission', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Cash (₹)', key: 'cash_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'PhonePe/UPI (₹)', key: 'upi_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Card (₹)', key: 'card_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Credit (₹)', key: 'credit_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Station Income (₹)', key: 'income', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Station Expense (₹)', key: 'expense', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Net Profit (₹)', key: 'net_profit', formatter: (v) => parseFloat(v || 0).toFixed(2) },
    ];

    const summaryRows = [
      ['EXECUTIVE PERIOD AUDIT TOTALS', '', '', '', '', '', '', '', '', '', ''],
      ['Total Litres Dispensed', Number(report.fuel?.total_litres || 0).toFixed(2), '', '', '', '', '', '', '', '', ''],
      ['Gross Fuel Sales', '', Number(report.fuel?.total_amount || 0).toFixed(2), '', '', '', '', '', '', '', ''],
      ['Fuel Dealer Commission', '', '', Number(report.fuel?.total_commission || 0).toFixed(2), '', '', '', '', '', '', ''],
      ['Cash Collected', '', '', '', Number(report.collections?.cash_collected || 0).toFixed(2), '', '', '', '', '', ''],
      ['PhonePe / UPI Collected', '', '', '', '', Number(report.collections?.upi_collected || 0).toFixed(2), '', '', '', '', ''],
      ['Card / POS Swipes', '', '', '', '', '', Number(report.collections?.card_collected || 0).toFixed(2), '', '', '', ''],
      ['Fleet / Company Credit', '', '', '', '', '', '', Number(report.collections?.credit_collected || 0).toFixed(2), '', '', ''],
      ['Other Station Income', '', '', '', '', '', '', '', Number(report.financials?.total_income || 0).toFixed(2), '', ''],
      ['Operating Expenses', '', '', '', '', '', '', '', '', Number(report.financials?.total_expense || 0).toFixed(2), ''],
      ['Net Station Operating Profit', '', '', '', '', '', '', '', '', '', Number(report.financials?.net_profit || 0).toFixed(2)],
    ];

    exportToCsv({
      filename: `executive_pnl_statement_${from}_to_${to}.csv`,
      title: 'Sri Balaji Petrol Pump (IOCL) — Executive Audit & P&L Statement',
      metadata: [
        `Period: ${from} to ${to}`,
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        `Days Recorded: ${report.daily_breakdown.length}`,
      ],
      columns,
      data: report.daily_breakdown,
      summaryRows,
    });
  };

  // Master Table Columns
  const masterColumns = [
    { key: 'date', label: 'Date', align: 'left', sortable: true },
    { key: 'litres', label: 'Litres', align: 'right', sortable: true, render: (v) => parseFloat(v || 0).toFixed(2) },
    { key: 'fuel_amount', label: 'Fuel Sales', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'commission', label: 'Margin (₹)', align: 'right', sortable: true, render: (v) => <span className="text-amber-600 font-medium">₹ {parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'cash_collected', label: 'Cash (₹)', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'upi_collected', label: 'UPI (₹)', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'card_collected', label: 'Card (₹)', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'credit_collected', label: 'Credit (₹)', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'income', label: 'Income', align: 'right', sortable: true, render: (v) => <span className="text-emerald-600 font-medium">+₹ {parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'expense', label: 'Expense', align: 'right', sortable: true, render: (v) => <span className="text-rose-600 font-medium">-₹ {parseFloat(v || 0).toFixed(2)}</span> },
    {
      key: 'net_profit', label: 'Net Profit', align: 'right', sortable: true,
      render: (v) => (
        <span className={parseFloat(v || 0) >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
          ₹ {parseFloat(v || 0).toFixed(2)}
        </span>
      )
    },
  ];

  // Collections Table Columns
  const collectionsColumns = [
    { key: 'date', label: 'Shift Date', align: 'left', sortable: true },
    { key: 'fuel_amount', label: 'Shift Sales', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'cash_collected', label: '💵 Cash in Hand', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'upi_collected', label: '📱 PhonePe / UPI', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'card_collected', label: '💳 Card / POS', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'credit_collected', label: '🏢 Fleet Credit', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'total_collected', label: 'Total Collected', align: 'right', sortable: true, render: (v) => <span className="font-semibold text-slate-800">₹ {parseFloat(v || 0).toFixed(2)}</span> },
    {
      key: 'short_excess', label: 'Short / Excess', align: 'right', sortable: true,
      render: (v) => {
        const val = parseFloat(v || 0);
        if (val === 0) return <span className="text-slate-400 font-mono">₹ 0.00</span>;
        if (val > 0) return <span className="text-emerald-600 font-semibold font-mono">+₹ {val.toFixed(2)} (Excess)</span>;
        return <span className="text-rose-600 font-semibold font-mono">-₹ {Math.abs(val).toFixed(2)} (Short)</span>;
      }
    },
  ];

  // Fuel Throughput Columns
  const throughputColumns = [
    { key: 'date', label: 'Date', align: 'left', sortable: true },
    { key: 'ms_litres', label: 'MS Petrol (L)', align: 'right', sortable: true, render: (v) => parseFloat(v || 0).toFixed(2) },
    { key: 'ms_amount', label: 'MS Amount', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'hsd_litres', label: 'HSD Diesel (L)', align: 'right', sortable: true, render: (v) => parseFloat(v || 0).toFixed(2) },
    { key: 'hsd_amount', label: 'HSD Amount', align: 'right', sortable: true, render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { key: 'litres', label: 'Total Litres', align: 'right', sortable: true, render: (v) => <span className="font-semibold">{parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'fuel_amount', label: 'Total Sales', align: 'right', sortable: true, render: (v) => <span className="font-semibold">₹ {parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'commission', label: 'Dealer Margin', align: 'right', sortable: true, render: (v) => <span className="text-emerald-600 font-bold">₹ {parseFloat(v || 0).toFixed(2)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Reports & Analytics Center"
        subtitle="Forecourt 4-way collections, fuel throughput, operational expenses, and net profit audit"
        icon={FileBarChart}
        action={
          report && (
            <Button variant="outline" onClick={handleExportCsv} title="Export current report tab to Excel/CSV">
              <Download size={16} className="mr-1.5 text-primary" />
              Export Statement (CSV)
            </Button>
          )
        }
      />

      {/* Date Filter & Preset Bar */}
      <div className="bg-white rounded-xl border border-neutral-border shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-44" />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-44" />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 py-1">
            <button
              type="button"
              onClick={() => handlePreset('this_month')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last_month')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last_30')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Last 30 Days
            </button>
          </div>

          <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
            <Button onClick={handleGenerate} loading={loading} className="w-full sm:w-auto">
              <FileBarChart size={16} className="mr-1.5" />
              Generate Statement
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        {report && (
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto">
            {TABS.map(({ id, label, icon: TabIcon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <TabIcon size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader size="lg" />
        </div>
      )}

      {!loading && !report && (
        <Card>
          <div className="text-center py-16 text-neutral-muted">
            <FileBarChart size={48} className="mx-auto mb-3 opacity-30 text-primary" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Ready to Generate Bunk Statement</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Select your date range and click <strong>Generate Statement</strong> to audit forecourt collections, fuel throughput, categorized expenses, and net profit.
            </p>
          </div>
        </Card>
      )}

      {!loading && report && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* ========================================================
              TAB 1: EXECUTIVE OVERVIEW & P&L
             ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Fuel Sales"
                  value={`₹ ${parseFloat(report.fuel?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub={`${parseFloat(report.fuel?.total_litres || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} litres sold`}
                  icon={Fuel}
                  borderAccent="border-l-4 border-l-blue-600"
                  bgAccent="bg-blue-50 text-blue-600"
                />
                <StatCard
                  label="Total Collections"
                  value={`₹ ${parseFloat(report.collections?.total_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub={`Short/Excess: ₹ ${parseFloat(report.collections?.short_excess || 0).toFixed(2)}`}
                  icon={Wallet}
                  borderAccent="border-l-4 border-l-emerald-500"
                  bgAccent="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  label="Operating Expenses"
                  value={`₹ ${parseFloat(report.financials?.total_expense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub={`Other Income: +₹ ${parseFloat(report.financials?.total_income || 0).toFixed(2)}`}
                  icon={TrendingDown}
                  borderAccent="border-l-4 border-l-rose-500"
                  bgAccent="bg-rose-50 text-rose-600"
                />
                <StatCard
                  label="Net Station Profit"
                  value={`₹ ${parseFloat(report.financials?.net_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub="Commission + Incomes - Expenses"
                  icon={TrendingUp}
                  borderAccent="border-l-4 border-l-amber-500"
                  bgAccent="bg-amber-50 text-amber-600"
                />
              </div>

              {/* 4-Way Collection Snapshot Bar */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">4-Way Forecourt Collections Summary</h3>
                    <p className="text-xs text-slate-500">Breakdown of physical cash, digital QR, card swipes, and credit slips</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Total Forecourt</span>
                    <p className="text-base font-extrabold text-slate-900">
                      ₹ {parseFloat(report.collections?.total_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-1 text-emerald-700">
                      <Wallet size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Cash in Hand</span>
                    </div>
                    <p className="text-lg font-extrabold text-emerald-900">
                      ₹ {parseFloat(report.collections?.cash_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {report.collections?.breakdown?.find(b => b.mode === 'CASH')?.percent || 0}% of collections
                    </span>
                  </div>

                  <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-1 text-blue-700">
                      <Smartphone size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">PhonePe / UPI</span>
                    </div>
                    <p className="text-lg font-extrabold text-blue-900">
                      ₹ {parseFloat(report.collections?.upi_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[11px] font-semibold text-blue-600">
                      {report.collections?.breakdown?.find(b => b.mode === 'UPI')?.percent || 0}% of collections
                    </span>
                  </div>

                  <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-1 text-violet-700">
                      <CreditCard size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Card / POS</span>
                    </div>
                    <p className="text-lg font-extrabold text-violet-900">
                      ₹ {parseFloat(report.collections?.card_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[11px] font-semibold text-violet-600">
                      {report.collections?.breakdown?.find(b => b.mode === 'CARD')?.percent || 0}% of collections
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-1 text-amber-700">
                      <Building2 size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Fleet Credit</span>
                    </div>
                    <p className="text-lg font-extrabold text-amber-900">
                      ₹ {parseFloat(report.collections?.credit_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[11px] font-semibold text-amber-600">
                      {report.collections?.breakdown?.find(b => b.mode === 'CREDIT')?.percent || 0}% of collections
                    </span>
                  </div>
                </div>
              </div>

              {/* Master Daily Reconciliation Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Master Daily Reconciliation</h3>
                    <p className="text-xs text-slate-500">Day-by-day fuel throughput, 4-way collections, station expenses, and net profit</p>
                  </div>
                </div>

                <Table
                  columns={masterColumns}
                  rows={report.daily_breakdown}
                  keyField="date"
                  stickyHeader
                  emptyText="No daily breakdown records found for this period."
                />
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 2: FORECOURT COLLECTIONS (MOP)
             ======================================================== */}
          {activeTab === 'collections' && (
            <div className="space-y-6">

              {/* Collections Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Cash in Hand"
                  value={`₹ ${parseFloat(report.collections?.cash_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  sub="Physical forecourt currency"
                  icon={Wallet}
                  borderAccent="border-l-4 border-l-emerald-500"
                  bgAccent="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  label="PhonePe / GPay / UPI"
                  value={`₹ ${parseFloat(report.collections?.upi_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  sub="Direct current account credits"
                  icon={Smartphone}
                  borderAccent="border-l-4 border-l-blue-500"
                  bgAccent="bg-blue-50 text-blue-600"
                />
                <StatCard
                  label="Card / POS Swipes"
                  value={`₹ ${parseFloat(report.collections?.card_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  sub="EDC batch settlements"
                  icon={CreditCard}
                  borderAccent="border-l-4 border-l-violet-500"
                  bgAccent="bg-violet-50 text-violet-600"
                />
                <StatCard
                  label="Company / Fleet Credit"
                  value={`₹ ${parseFloat(report.collections?.credit_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  sub="Khata / Credit slips issued"
                  icon={Building2}
                  borderAccent="border-l-4 border-l-amber-500"
                  bgAccent="bg-amber-50 text-amber-600"
                />
              </div>

              {/* Collections Share Progress Bar */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Mode of Payment Share (MOP)</h3>
                <div className="w-full bg-slate-100 rounded-full h-3.5 flex overflow-hidden mb-3">
                  <div
                    style={{ width: `${report.collections?.breakdown?.find(b => b.mode === 'CASH')?.percent || 0}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Cash: ${report.collections?.breakdown?.find(b => b.mode === 'CASH')?.percent}%`}
                  />
                  <div
                    style={{ width: `${report.collections?.breakdown?.find(b => b.mode === 'UPI')?.percent || 0}%` }}
                    className="bg-blue-500 h-full"
                    title={`UPI: ${report.collections?.breakdown?.find(b => b.mode === 'UPI')?.percent}%`}
                  />
                  <div
                    style={{ width: `${report.collections?.breakdown?.find(b => b.mode === 'CARD')?.percent || 0}%` }}
                    className="bg-violet-500 h-full"
                    title={`Card: ${report.collections?.breakdown?.find(b => b.mode === 'CARD')?.percent}%`}
                  />
                  <div
                    style={{ width: `${report.collections?.breakdown?.find(b => b.mode === 'CREDIT')?.percent || 0}%` }}
                    className="bg-amber-500 h-full"
                    title={`Credit: ${report.collections?.breakdown?.find(b => b.mode === 'CREDIT')?.percent}%`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Cash: {report.collections?.breakdown?.find(b => b.mode === 'CASH')?.percent}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    UPI / QR: {report.collections?.breakdown?.find(b => b.mode === 'UPI')?.percent}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-violet-500" />
                    Card POS: {report.collections?.breakdown?.find(b => b.mode === 'CARD')?.percent}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Fleet Credit: {report.collections?.breakdown?.find(b => b.mode === 'CREDIT')?.percent}%
                  </span>
                </div>
              </div>

              {/* Collections Daily Ledger */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Forecourt Shift Cashier Ledger</h3>
                    <p className="text-xs text-slate-500">Daily verification of cash in hand, digital QR, POS slips, and pump boy shortages</p>
                  </div>
                </div>

                <Table
                  columns={collectionsColumns}
                  rows={report.daily_breakdown}
                  keyField="date"
                  stickyHeader
                  emptyText="No collection records found for this period."
                />
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 3: EXPENSES & INCOMES AUDIT
             ======================================================== */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">

              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Fuel Commission (Gross)"
                  value={`₹ ${parseFloat(report.financials?.fuel_commission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  sub="Base dealer margin"
                  icon={TrendingUp}
                  borderAccent="border-l-4 border-l-blue-600"
                  bgAccent="bg-blue-50 text-blue-600"
                />
                <StatCard
                  label="Non-Fuel Station Incomes"
                  value={`₹ ${parseFloat(report.financials?.total_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  sub="Lubricants, recoveries, air"
                  icon={ArrowUpRight}
                  borderAccent="border-l-4 border-l-emerald-500"
                  bgAccent="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  label="Total Station Expenses"
                  value={`₹ ${parseFloat(report.financials?.total_expense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  sub="Salaries, power, batha, repairs"
                  icon={ArrowDownRight}
                  borderAccent="border-l-4 border-l-rose-500"
                  bgAccent="bg-rose-50 text-rose-600"
                />
              </div>

              {/* Side-by-Side Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Operating Expenses Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                        <TrendingDown size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">Station Operating Expenses</h3>
                    </div>
                    <span className="text-sm font-extrabold text-rose-600">
                      ₹ {parseFloat(report.financials?.total_expense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {report.financials?.expenses_by_category?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No categorized expenses recorded in this period.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {report.financials?.expenses_by_category?.map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{cat.name}</span>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 mr-2">₹ {cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              <span className="text-[11px] text-slate-400 font-medium">({cat.percent}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div style={{ width: `${cat.percent}%` }} className="bg-rose-500 h-full rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Station Incomes Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">Non-Fuel Station Incomes</h3>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-600">
                      ₹ {parseFloat(report.financials?.total_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {report.financials?.incomes_by_category?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No non-fuel income recorded in this period.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {report.financials?.incomes_by_category?.map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{cat.name}</span>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 mr-2">₹ {cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              <span className="text-[11px] text-slate-400 font-medium">({cat.percent}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div style={{ width: `${cat.percent}%` }} className="bg-emerald-500 h-full rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Net P&L Equation Card */}
              <div className="bg-gradient-to-r from-slate-900 to-[#0f2440] text-white rounded-xl p-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">Final Station Net Profit</span>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight">
                      ₹ {parseFloat(report.financials?.net_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Formula: Fuel Margin (₹{parseFloat(report.financials?.fuel_commission || 0).toLocaleString('en-IN')}) + Other Incomes (₹{parseFloat(report.financials?.total_income || 0).toLocaleString('en-IN')}) - Operating Expenses (₹{parseFloat(report.financials?.total_expense || 0).toLocaleString('en-IN')})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleExportCsv} className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs">
                      <Download size={14} className="mr-1.5" />
                      Export P&L
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 4: FUEL THROUGHPUT (MS vs HSD)
             ======================================================== */}
          {activeTab === 'throughput' && (
            <div className="space-y-6">

              {/* MS vs HSD Split Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Petrol (MS) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-4 border-t-amber-500">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-amber-100 text-amber-800">MS</span>
                      <h3 className="text-base font-bold text-slate-800">Motor Spirit (Petrol)</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">Margin: ₹ 3.552 / L</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Litres Dispensed</span>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                        {parseFloat(report.fuel?.ms?.litres || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} L
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Gross Sales</span>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                        ₹ {parseFloat(report.fuel?.ms?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <span className="text-[11px] text-amber-700 uppercase font-bold">Dealer Margin</span>
                      <p className="text-lg font-extrabold text-amber-900 mt-0.5">
                        ₹ {parseFloat(report.fuel?.ms?.commission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diesel (HSD) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-4 border-t-blue-600">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-blue-100 text-blue-800">HSD</span>
                      <h3 className="text-base font-bold text-slate-800">High Speed Diesel</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">Margin: ₹ 3.026 / L</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Litres Dispensed</span>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                        {parseFloat(report.fuel?.hsd?.litres || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} L
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Gross Sales</span>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                        ₹ {parseFloat(report.fuel?.hsd?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <span className="text-[11px] text-blue-700 uppercase font-bold">Dealer Margin</span>
                      <p className="text-lg font-extrabold text-blue-900 mt-0.5">
                        ₹ {parseFloat(report.fuel?.hsd?.commission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Fuel Throughput Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Daily Product Throughput Ledger</h3>
                    <p className="text-xs text-slate-500">OMC inspection statement comparing MS Petrol and HSD Diesel daily dispensing</p>
                  </div>
                </div>

                <Table
                  columns={throughputColumns}
                  rows={report.daily_breakdown}
                  keyField="date"
                  stickyHeader
                  emptyText="No fuel throughput records found for this period."
                />
              </div>

            </div>
          )}

        </div>
      )}
    </>
  );
}
