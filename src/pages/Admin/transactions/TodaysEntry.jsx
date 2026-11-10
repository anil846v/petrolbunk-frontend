import { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle2, AlertCircle, Save, Plus, Trash2, Printer,
  RotateCcw, History, RefreshCw, Eye, Download
} from 'lucide-react';
import { dailyDaybookApi, categoryApi, vendorApi } from '../../../utils/api';
import { useToast } from '../../../components/common/Toaster';
import { exportToCsv } from '../../../utils/exportToCsv';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import Badge from '../../../components/common/Badge';
import Loader from '../../../components/common/Loader';
import Table from '../../../components/common/Table';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Salaries', 'Electricity', 'Rent', 'Maintenance', 'Transport',
  'Driver Batha', 'Police/Govt', 'IOCL/Company', 'Office', 'Other'
];

const fmt = (n) => Math.round(Number(n || 0)).toLocaleString('en-IN');
const fmtD = (n) => Number(n || 0).toFixed(2);
const todayStr = () => new Date().toISOString().split('T')[0];

export default function TodaysEntry() {
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const { toast } = useToast();

  // Dynamic Categories and Vendors loaded directly from Database
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [vendorOptions, setVendorOptions] = useState([]);

  // Fuel Rates & Dealer Margins (loaded directly from DB)
  const [msPrice, setMsPrice] = useState(104.50);
  const [msMargin, setMsMargin] = useState(3.50);
  const [hsdPrice, setHsdPrice] = useState(91.20);
  const [hsdMargin, setHsdMargin] = useState(3.00);

  // Meter Readings
  const [msOpen, setMsOpen] = useState('');
  const [msClose, setMsClose] = useState('');
  const [msDipOpen, setMsDipOpen] = useState('');
  const [msDipClose, setMsDipClose] = useState('');

  const [hsdOpen, setHsdOpen] = useState('');
  const [hsdClose, setHsdClose] = useState('');
  const [hsdDipOpen, setHsdDipOpen] = useState('');
  const [hsdDipClose, setHsdDipClose] = useState('');

  // Collections
  const [cash, setCash] = useState('');
  const [upi, setUpi] = useState('');
  const [card, setCard] = useState('');
  const [credit, setCredit] = useState('');

  // Expenses & Notes
  const [expenses, setExpenses] = useState([]);
  const [notes, setNotes] = useState('');

  // Live Auto-fetch state
  const [fetchingRates, setFetchingRates] = useState(false);
  const [rateSource, setRateSource] = useState('');
  const [selectedCity, setSelectedCity] = useState(localStorage.getItem('bunk_fuel_city') || 'chittoor');

  // Past Shifts & Rate History Modal State
  const [showHistory, setShowHistory] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(todayStr().substring(0, 7));
  const [historyRows, setHistoryRows] = useState([]);
  const [historySummary, setHistorySummary] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load Categories & Vendors from Database on mount
  useEffect(() => {
    categoryApi.list({ limit: 100, is_active: true, type: 'EXPENSE' })
      .then(res => {
        const rows = res?.data?.rows || [];
        if (rows.length > 0) {
          const names = rows.map(c => c.name);
          setCategoryOptions([...new Set([...names, ...DEFAULT_EXPENSE_CATEGORIES])]);
        }
      })
      .catch(console.error);

    vendorApi.list({ limit: 200, is_active: true })
      .then(res => {
        const rows = res?.data?.rows || [];
        setVendorOptions(rows);
      })
      .catch(console.error);
  }, []);

  const handleFetchLiveRates = async (cityOverride) => {
    const city = cityOverride || selectedCity;
    setFetchingRates(true);
    try {
      const res = await dailyDaybookApi.fetchLiveRates({ city });
      const data = res?.data;
      if (data && data.ms_price && data.hsd_price) {
        setMsPrice(data.ms_price);
        setHsdPrice(data.hsd_price);
        setRateSource(data.source || `Live OMC Feed (${city.toUpperCase()})`);
        toast(`Live rates updated for ${city.toUpperCase()}: MS ₹${data.ms_price}, HSD ₹${data.hsd_price}`, 'success');
      } else {
        toast('Live rates unavailable, using current values', 'info');
      }
    } catch (err) {
      toast(err.message || 'Could not fetch live rates', 'error');
    } finally {
      setFetchingRates(false);
    }
  };

  // Fetch record for selected date
  useEffect(() => {
    let ignore = false;
    dailyDaybookApi.getByDate(date).then(res => {
      if (ignore) return;
      const data = res?.data?.entry || {};
      const recorded = !res?.data?.is_new;

      setIsRecorded(recorded);
      setCreatorName(data.creator?.username || '');

      setMsPrice(data.ms_price || 104.50);
      setMsMargin(data.ms_margin !== undefined && data.ms_margin !== null ? data.ms_margin : 3.50);
      setHsdPrice(data.hsd_price || 91.20);
      setHsdMargin(data.hsd_margin !== undefined && data.hsd_margin !== null ? data.hsd_margin : 3.00);

      setMsOpen(data.ms_open ?? '');
      setMsClose(data.ms_close ?? '');
      setMsDipOpen(data.ms_dip_open ?? '');
      setMsDipClose(data.ms_dip_close ?? '');

      setHsdOpen(data.hsd_open ?? '');
      setHsdClose(data.hsd_close ?? '');
      setHsdDipOpen(data.hsd_dip_open ?? '');
      setHsdDipClose(data.hsd_dip_close ?? '');

      setCash(data.cash_collected ?? '');
      setUpi(data.upi_collected ?? '');
      setCard(data.card_collected ?? '');
      setCredit(data.credit_collected ?? '');

      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      setNotes(data.notes || '');
    }).catch(err => {
      if (!ignore) toast(err.message || 'Failed to load day sheet', 'error');
    });

    return () => { ignore = true; };
  }, [date, toast]);

  // Load Past Shifts History
  const loadHistory = async (month) => {
    setHistoryLoading(true);
    try {
      const res = await dailyDaybookApi.listHistory({ month });
      setHistoryRows(res?.data?.rows || []);
      setHistorySummary(res?.data?.summary || null);
    } catch (err) {
      toast(err.message || 'Failed to load history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryModal = () => {
    const currentM = date.substring(0, 7);
    setHistoryMonth(currentM);
    setShowHistory(true);
    loadHistory(currentM);
  };

  const handleExportHistoryCsv = () => {
    if (!historyRows || historyRows.length === 0) {
      toast('No shift records to export', 'info');
      return;
    }

    const columns = [
      { label: 'Date', key: 'entry_date' },
      { label: 'MS Rate (₹/L)', key: 'ms_price', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'MS Margin (₹/L)', key: 'ms_margin', formatter: (v) => parseFloat(v || 3.50).toFixed(2) },
      { label: 'MS Open Meter', key: 'ms_open' },
      { label: 'MS Close Meter', key: 'ms_close' },
      { label: 'MS Sold (L)', key: 'ms_sold', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'MS Amount (₹)', key: 'ms_amount', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'HSD Rate (₹/L)', key: 'hsd_price', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'HSD Margin (₹/L)', key: 'hsd_margin', formatter: (v) => parseFloat(v || 3.00).toFixed(2) },
      { label: 'HSD Open Meter', key: 'hsd_open' },
      { label: 'HSD Close Meter', key: 'hsd_close' },
      { label: 'HSD Sold (L)', key: 'hsd_sold', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'HSD Amount (₹)', key: 'hsd_amount', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      {
        label: 'Total Litres Sold (L)',
        formatter: (_, r) => (parseFloat(r.ms_sold || 0) + parseFloat(r.hsd_sold || 0)).toFixed(2)
      },
      { label: 'Total Sales (₹)', key: 'total_sales', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Cash Collected (₹)', key: 'cash_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'UPI Collected (₹)', key: 'upi_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Card Collected (₹)', key: 'card_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Credit Collected (₹)', key: 'credit_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Total Collected (₹)', key: 'total_collected', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Shortage / Excess (₹)', key: 'short_excess', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Shift Expenses (₹)', key: 'day_expenses', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Gross Commission (₹)', key: 'total_margin', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Net Profit (₹)', key: 'net_profit', formatter: (v) => parseFloat(v || 0).toFixed(2) },
      { label: 'Notes', key: 'notes' }
    ];

    const summaryRows = [];
    if (historySummary) {
      summaryRows.push([
        'TOTALS',
        '', '', '', '',
        Number(historySummary.total_ms_litres || 0).toFixed(2),
        '', '', '', '', '',
        Number(historySummary.total_hsd_litres || 0).toFixed(2),
        '',
        (Number(historySummary.total_ms_litres || 0) + Number(historySummary.total_hsd_litres || 0)).toFixed(2),
        Number(historySummary.total_sales || 0).toFixed(2),
        '', '', '', '',
        Number(historySummary.total_collected || 0).toFixed(2),
        Number(historySummary.total_shortage || 0).toFixed(2),
        Number(historySummary.total_expenses || 0).toFixed(2),
        Number(historySummary.total_margin || 0).toFixed(2),
        Number(historySummary.net_profit || 0).toFixed(2),
        `Logged: ${historySummary.days_recorded || 0} days`
      ]);
    }

    exportToCsv({
      filename: `shift_history_${historyMonth}.csv`,
      title: `Petrol Bunk IOCL Enterprise Suite (IOCL) — Shift Register for ${historyMonth}`,
      metadata: [
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        `Month: ${historyMonth}`,
        `Total Days Logged: ${historyRows.length}`
      ],
      columns,
      data: historyRows,
      summaryRows
    });
    toast(`Exported shifts for ${historyMonth}`, 'success');
  };

  // Date Nav
  const changeDate = (offset) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  // Calculations
  const msSold = Math.max(0, (parseFloat(msClose) || 0) - (parseFloat(msOpen) || 0));
  const msDipDiff = (parseFloat(msDipOpen) || 0) - (parseFloat(msDipClose) || 0);
  const msAmount = msSold * (parseFloat(msPrice) || 0);
  const msMarginAmt = msSold * (parseFloat(msMargin) || 0);

  const hsdSold = Math.max(0, (parseFloat(hsdClose) || 0) - (parseFloat(hsdOpen) || 0));
  const hsdDipDiff = (parseFloat(hsdDipOpen) || 0) - (parseFloat(hsdDipClose) || 0);
  const hsdAmount = hsdSold * (parseFloat(hsdPrice) || 0);
  const hsdMarginAmt = hsdSold * (parseFloat(hsdMargin) || 0);

  const totalSales = msAmount + hsdAmount;
  const totalMargin = msMarginAmt + hsdMarginAmt;

  const totalCollected = (parseFloat(cash) || 0) + (parseFloat(upi) || 0) +
    (parseFloat(card) || 0) + (parseFloat(credit) || 0);

  const diff = totalCollected - totalSales;

  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amt) || 0), 0);
  const netAmount = totalCollected - totalExpenses;
  const netProfit = totalMargin - totalExpenses;

  // Expense Handlers
  const addExpense = () => {
    setExpenses([...expenses, { id: Date.now() + Math.random(), cat: 'Salaries', desc: '', to: '', amt: '' }]);
  };

  const updateExpense = (id, field, val) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // Clear Form
  const handleClear = () => {
    if (!window.confirm('Reset this day sheet to defaults?')) return;
    setMsClose('');
    setMsDipOpen('');
    setMsDipClose('');
    setHsdClose('');
    setHsdDipOpen('');
    setHsdDipClose('');
    setCash('');
    setUpi('');
    setCard('');
    setCredit('');
    setExpenses([]);
    setNotes('');
  };

  // Save / Submit to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        entry_date: date,
        ms_price: msPrice,
        ms_open: msOpen,
        ms_close: msClose,
        ms_dip_open: msDipOpen,
        ms_dip_close: msDipClose,
        ms_margin: msMargin,

        hsd_price: hsdPrice,
        hsd_open: hsdOpen,
        hsd_close: hsdClose,
        hsd_dip_open: hsdDipOpen,
        hsd_dip_close: hsdDipClose,
        hsd_margin: hsdMargin,

        cash_collected: cash,
        upi_collected: upi,
        card_collected: card,
        credit_collected: credit,

        expenses,
        notes,
      };

      await dailyDaybookApi.saveDay(payload);
      setIsRecorded(true);
      toast(`Day Book saved! Shift expenses auto-synced into Daybook ledger.`, 'success');
    } catch (err) {
      toast(err.message || 'Failed to save day book', 'error');
    } finally {
      setSaving(false);
    }
  };

  const historyColumns = [
    { key: 'entry_date', label: 'Date', sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    {
      key: 'ms_price', label: 'MS Rate & Margin', align: 'right', sortable: true,
      render: (v, r) => (
        <span className="font-medium text-blue-700">
          ₹{parseFloat(v || 0).toFixed(2)}
          <span className="text-[10px] text-amber-700 font-bold block">₹{parseFloat(r.ms_margin || 3.50).toFixed(2)}/L</span>
        </span>
      )
    },
    {
      key: 'hsd_price', label: 'HSD Rate & Margin', align: 'right', sortable: true,
      render: (v, r) => (
        <span className="font-medium text-emerald-700">
          ₹{parseFloat(v || 0).toFixed(2)}
          <span className="text-[10px] text-amber-700 font-bold block">₹{parseFloat(r.hsd_margin || 3.00).toFixed(2)}/L</span>
        </span>
      )
    },
    {
      key: 'total_litres', label: 'Total Litres', align: 'right', sortable: true,
      render: (_, r) => {
        const total = parseFloat(r.ms_sold || 0) + parseFloat(r.hsd_sold || 0);
        return `${fmtD(total)} L`;
      }
    },
    { key: 'total_sales', label: 'Sales (₹)', align: 'right', sortable: true, render: (v) => <strong className="text-neutral-text">₹ {fmt(v)}</strong> },
    {
      key: 'total_margin', label: 'Gross Margin (₹)', align: 'right', sortable: true,
      render: (v, r) => {
        const msL = parseFloat(r.ms_sold || 0);
        const hsdL = parseFloat(r.hsd_sold || 0);
        const msMgn = parseFloat(r.ms_margin || 3.50);
        const hsdMgn = parseFloat(r.hsd_margin || 3.00);
        const margin = parseFloat(v || 0) || ((msL * msMgn) + (hsdL * hsdMgn));
        return <strong className="text-blue-800">₹ {fmt(margin)}</strong>;
      }
    },
    {
      key: 'net_profit', label: 'Net Profit (₹)', align: 'right', sortable: true,
      render: (v, r) => {
        const msL = parseFloat(r.ms_sold || 0);
        const hsdL = parseFloat(r.hsd_sold || 0);
        const msMgn = parseFloat(r.ms_margin || 3.50);
        const hsdMgn = parseFloat(r.hsd_margin || 3.00);
        const margin = parseFloat(r.total_margin || 0) || ((msL * msMgn) + (hsdL * hsdMgn));
        const profit = parseFloat(v || 0) || (margin - parseFloat(r.day_expenses || 0));
        return <strong className={profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>₹ {fmt(profit)}</strong>;
      }
    },
    {
      key: 'status', label: 'Status', align: 'center', sortable: false,
      render: (_, r) => {
        const shortAmt = parseFloat(r.short_excess || 0);
        if (Math.abs(shortAmt) < 1) return <Badge variant="success">Balanced</Badge>;
        if (shortAmt < 0) return <Badge variant="danger">-₹{fmt(Math.abs(shortAmt))}</Badge>;
        return <Badge variant="warning">+₹{fmt(shortAmt)}</Badge>;
      }
    },
    {
      key: 'actions', label: 'Action', align: 'center', sortable: false,
      render: (_, r) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setDate(r.entry_date);
            setShowHistory(false);
          }}
        >
          <Eye size={13} className="mr-1 text-primary" /> Inspect Date
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Calendar size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-text">Daily Day Book & Shift Reconciliation</h1>
              {isRecorded ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Audited {creatorName ? `by ${creatorName}` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  <AlertCircle size={12} /> Draft Shift
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-muted">Petrol Bunk IOCL Enterprise Suite (IOCL) — Single Sheet Register</p>
          </div>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-neutral-bg border border-neutral-border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => changeDate(-1)}
              className="px-2.5 py-1 text-sm font-bold text-neutral-muted hover:text-neutral-text transition"
              title="Previous Day"
            >
              ◀
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-0 text-sm font-semibold text-neutral-text px-2 py-1 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => changeDate(1)}
              className="px-2.5 py-1 text-sm font-bold text-neutral-muted hover:text-neutral-text transition"
              title="Next Day"
            >
              ▶
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setDate(todayStr())}
            title="Jump to Today"
          >
            Today
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={openHistoryModal}
            className="border-primary/40 text-primary hover:bg-primary/5"
            title="Inspect historical shifts and audited fuel rates"
          >
            <History size={14} className="mr-1" /> Shift History
          </Button>

          <Button size="sm" variant="outline" onClick={() => window.print()} title="Print Shift Summary Sheet">
            <Printer size={14} className="mr-1" /> Print Slip
          </Button>

          <Button size="sm" variant="secondary" onClick={handleClear} title="Reset shift numbers">
            <RotateCcw size={14} className="mr-1" /> Clear
          </Button>

          <Button size="sm" variant="primary" onClick={handleSave} loading={saving}>
            <Save size={14} className="mr-1" /> Save Shift
          </Button>
        </div>
      </div>

      {/* Live District Fuel Rates & Commission Banner */}
      <div className="bg-white rounded-xl border border-neutral-border shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-muted flex items-center gap-1.5">
              ⚡ District Pricing & Dealer Margins
            </span>
            {fetchingRates ? (
              <span className="text-[11px] text-primary flex items-center gap-1 animate-pulse">
                <RefreshCw size={11} className="animate-spin" /> Fetching live OMC rates...
              </span>
            ) : rateSource ? (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                ● {rateSource}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCity(val);
                localStorage.setItem('bunk_fuel_city', val);
                handleFetchLiveRates(val);
              }}
              className="text-xs font-semibold border border-neutral-border rounded-lg px-2.5 py-1.5 bg-white text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
              title="Select your bunk district for official live pricing"
            >
              <option value="chittoor">Chittoor (AP)</option>
              <option value="madanapalle">Madanapalle (AP)</option>
              <option value="tirupati">Tirupati (AP)</option>
              <option value="vijayawada">Vijayawada (AP)</option>
              <option value="visakhapatnam">Visakhapatnam (AP)</option>
              <option value="hyderabad">Hyderabad (TS)</option>
              <option value="bangalore">Bangalore (KA)</option>
              <option value="chennai">Chennai (TN)</option>
            </select>
            <Button size="sm" variant="secondary" onClick={() => handleFetchLiveRates(selectedCity)} loading={fetchingRates}>
              <RefreshCw size={13} className="mr-1.5 text-neutral-muted" /> Auto-Fetch District Rates
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MS Box with Rate & Margin */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide block">MS (Petrol)</span>
                <span className="text-[11px] text-blue-700">Retail Rate & Margin</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-blue-800">Rate: ₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={msPrice}
                  onChange={(e) => setMsPrice(parseFloat(e.target.value) || 0)}
                  className="w-20 text-right font-bold text-sm bg-white border border-blue-300 rounded px-2 py-1 text-blue-900"
                  title="Retail Selling Price per Litre"
                />
              </div>
              <div className="flex items-center gap-1 pl-2 border-l border-blue-200">
                <span className="text-xs font-bold text-amber-700">Margin: ₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={msMargin}
                  onChange={(e) => setMsMargin(parseFloat(e.target.value) || 0)}
                  className="w-16 text-right font-bold text-sm bg-amber-50 border border-amber-300 rounded px-2 py-1 text-amber-900"
                  title="Dealer Commission per Litre (Saved to DB)"
                />
                <span className="text-[11px] text-amber-800">/L</span>
              </div>
            </div>
          </div>

          {/* HSD Box with Rate & Margin */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <div>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block">HSD (Diesel)</span>
                <span className="text-[11px] text-emerald-700">Retail Rate & Margin</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-emerald-800">Rate: ₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={hsdPrice}
                  onChange={(e) => setHsdPrice(parseFloat(e.target.value) || 0)}
                  className="w-20 text-right font-bold text-sm bg-white border border-emerald-300 rounded px-2 py-1 text-emerald-900"
                  title="Retail Selling Price per Litre"
                />
              </div>
              <div className="flex items-center gap-1 pl-2 border-l border-emerald-200">
                <span className="text-xs font-bold text-amber-700">Margin: ₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={hsdMargin}
                  onChange={(e) => setHsdMargin(parseFloat(e.target.value) || 0)}
                  className="w-16 text-right font-bold text-sm bg-amber-50 border border-amber-300 rounded px-2 py-1 text-amber-900"
                  title="Dealer Commission per Litre (Saved to DB)"
                />
                <span className="text-[11px] text-amber-800">/L</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Meter Readings & Fuel Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Petrol (MS) Panel */}
        <div className="bg-white rounded-xl border border-neutral-border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 className="font-bold text-sm text-neutral-text">MS — Petrol</h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-blue-700 block">@ ₹{fmtD(msPrice)}/L</span>
              <span className="text-[10px] text-amber-700 font-bold">Margin: ₹{fmtD(msMargin)}/L</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-muted uppercase">Opening Meter</label>
              <Input type="number" step="0.01" value={msOpen} onChange={(e) => setMsOpen(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-muted uppercase">Closing Meter</label>
              <Input type="number" step="0.01" value={msClose} onChange={(e) => setMsClose(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-muted uppercase">Dip Opening (L)</label>
              <Input type="number" step="0.01" value={msDipOpen} onChange={(e) => setMsDipOpen(e.target.value)} placeholder="Stock" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-muted uppercase">Dip Closing (L)</label>
              <Input type="number" step="0.01" value={msDipClose} onChange={(e) => setMsDipClose(e.target.value)} placeholder="Stock" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-neutral-border">
            <div className="bg-neutral-bg p-2.5 rounded-lg">
              <span className="text-xs text-neutral-muted font-medium">Litres Sold:</span>
              <p className="text-lg font-bold text-blue-700">{fmtD(msSold)} L</p>
            </div>
            <div className="bg-neutral-bg p-2.5 rounded-lg">
              <span className="text-xs text-neutral-muted font-medium">Dip Difference:</span>
              <p className="text-lg font-bold text-neutral-text">{fmtD(msDipDiff)} L</p>
            </div>
          </div>

          <div className="bg-blue-50/80 p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-900 uppercase block">MS Sales Amount</span>
              <span className="text-[11px] text-blue-700">Margin Earned: <strong>₹ {fmt(msMarginAmt)}</strong> (@ ₹{fmtD(msMargin)}/L)</span>
            </div>
            <span className="text-xl font-bold text-blue-700">₹ {fmt(msAmount)}</span>
          </div>
        </div>

        {/* Diesel (HSD) Panel */}
        <div className="bg-white rounded-xl border border-neutral-border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h2 className="font-bold text-sm text-neutral-text">HSD — Diesel</h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-700 block">@ ₹{fmtD(hsdPrice)}/L</span>
              <span className="text-[10px] text-amber-700 font-bold">Margin: ₹{fmtD(hsdMargin)}/L</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-muted uppercase">Opening Meter</label>
              <Input type="number" step="0.01" value={hsdOpen} onChange={(e) => setHsdOpen(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-muted uppercase">Closing Meter</label>
              <Input type="number" step="0.01" value={hsdClose} onChange={(e) => setHsdClose(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-muted uppercase">Dip Opening (L)</label>
              <Input type="number" step="0.01" value={hsdDipOpen} onChange={(e) => setHsdDipOpen(e.target.value)} placeholder="Stock" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-muted uppercase">Dip Closing (L)</label>
              <Input type="number" step="0.01" value={hsdDipClose} onChange={(e) => setHsdDipClose(e.target.value)} placeholder="Stock" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-neutral-border">
            <div className="bg-neutral-bg p-2.5 rounded-lg">
              <span className="text-xs text-neutral-muted font-medium">Litres Sold:</span>
              <p className="text-lg font-bold text-emerald-700">{fmtD(hsdSold)} L</p>
            </div>
            <div className="bg-neutral-bg p-2.5 rounded-lg">
              <span className="text-xs text-neutral-muted font-medium">Dip Difference:</span>
              <p className="text-lg font-bold text-neutral-text">{fmtD(hsdDipDiff)} L</p>
            </div>
          </div>

          <div className="bg-emerald-50/80 p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-900 uppercase block">HSD Sales Amount</span>
              <span className="text-[11px] text-emerald-700">Margin Earned: <strong>₹ {fmt(hsdMarginAmt)}</strong> (@ ₹{fmtD(hsdMargin)}/L)</span>
            </div>
            <span className="text-xl font-bold text-emerald-700">₹ {fmt(hsdAmount)}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Collection Breakdown */}
      <div className="bg-white rounded-xl border border-neutral-border shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-sm text-neutral-text uppercase tracking-wide flex items-center gap-2">
          💳 Daily Collection Breakdown
          <span className="text-xs font-normal text-neutral-muted lowercase">(enter how payment arrived)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 border border-neutral-border rounded-lg bg-neutral-bg/30">
            <label className="text-xs font-bold text-neutral-muted uppercase block mb-1">💵 Cash</label>
            <Input type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0.00" className="font-bold text-right text-lg" />
            <span className="text-[11px] text-neutral-muted mt-1 block">Physical notes collected</span>
          </div>

          <div className="p-3 border border-neutral-border rounded-lg bg-neutral-bg/30">
            <label className="text-xs font-bold text-neutral-muted uppercase block mb-1">📱 PhonePe / UPI</label>
            <Input type="number" step="0.01" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="0.00" className="font-bold text-right text-lg" />
            <span className="text-[11px] text-neutral-muted mt-1 block">Digital QR payments</span>
          </div>

          <div className="p-3 border border-neutral-border rounded-lg bg-neutral-bg/30">
            <label className="text-xs font-bold text-neutral-muted uppercase block mb-1">💳 Card / POS</label>
            <Input type="number" step="0.01" value={card} onChange={(e) => setCard(e.target.value)} placeholder="0.00" className="font-bold text-right text-lg" />
            <span className="text-[11px] text-neutral-muted mt-1 block">Debit / Credit swipe</span>
          </div>

          <div className="p-3 border border-neutral-border rounded-lg bg-neutral-bg/30">
            <label className="text-xs font-bold text-neutral-muted uppercase block mb-1">🏢 Company / Credit</label>
            <Input type="number" step="0.01" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="0.00" className="font-bold text-right text-lg" />
            <span className="text-[11px] text-neutral-muted mt-1 block">Govt / Fleet vehicle slips</span>
          </div>
        </div>
      </div>

      {/* Section 3: The Real-Time Total & Shortage Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border-2 border-neutral-text overflow-hidden shadow">
        <div className="bg-slate-900 text-white p-4 text-center border-b sm:border-r border-slate-700">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Expected (Sales)</span>
          <p className="text-2xl font-bold mt-1">₹ {fmt(totalSales)}</p>
          <span className="text-[11px] text-slate-400">MS + HSD amount</span>
        </div>

        <div className="bg-emerald-800 text-white p-4 text-center border-b lg:border-r border-emerald-700">
          <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider block">Total Collected</span>
          <p className="text-2xl font-bold mt-1">₹ {fmt(totalCollected)}</p>
          <span className="text-[11px] text-emerald-200">Cash + UPI + Card + Credit</span>
        </div>

        {/* Shortage Gauge */}
        <div className={`p-4 text-center text-white border-b sm:border-b-0 sm:border-r ${Math.abs(diff) < 1
            ? 'bg-emerald-700'
            : diff < 0
              ? 'bg-rose-700'
              : 'bg-amber-600'
          }`}>
          <span className="text-xs uppercase font-bold tracking-wider block opacity-90">
            {Math.abs(diff) < 1 ? 'Difference' : diff < 0 ? 'Shortage ▼' : 'Excess ▲'}
          </span>
          <p className="text-2xl font-bold mt-1">₹ {fmt(Math.abs(diff))}</p>
          <span className="text-[11px] font-medium opacity-90 block">
            {Math.abs(diff) < 1 ? 'Matched ✓' : diff < 0 ? `Collected ₹${fmt(Math.abs(diff))} less` : `Collected ₹${fmt(diff)} extra`}
          </span>
        </div>

        <div className="bg-amber-950 text-white p-4 text-center">
          <span className="text-xs text-amber-200 font-semibold uppercase tracking-wider block">Day Expenses</span>
          <p className="text-2xl font-bold mt-1">₹ {fmt(totalExpenses)}</p>
          <span className="text-[11px] text-amber-300">Net Cash: ₹ {fmt(netAmount)}</span>
        </div>
      </div>

      {/* Section 3.5: Dealer Profit & Commission Bar (Live From DB) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 rounded-xl shadow-sm border border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-blue-300 tracking-wider block">
              ⭐ Dealer Commission (Gross Profit)
            </span>
            <p className="text-2xl font-bold mt-1 text-white">₹ {fmt(totalMargin)}</p>
            <span className="text-[11px] text-blue-200">
              MS: ₹{fmt(msMarginAmt)} + HSD: ₹{fmt(hsdMarginAmt)} (direct from DB)
            </span>
          </div>
          <div className="bg-white/10 px-3 py-2 rounded-lg text-right text-xs">
            <span className="text-blue-200 block">Commission Rates</span>
            <span className="font-bold text-amber-300">MS ₹{fmtD(msMargin)} | HSD ₹{fmtD(hsdMargin)}</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl shadow-sm text-white flex items-center justify-between ${netProfit >= 0
            ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border border-emerald-700'
            : 'bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 border border-rose-700'
          }`}>
          <div>
            <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider block">
              💰 True Net Shift Profit
            </span>
            <p className="text-2xl font-bold mt-1 text-white">₹ {fmt(netProfit)}</p>
            <span className="text-[11px] opacity-90">
              Gross Commission (₹{fmt(totalMargin)}) - Day Expenses (₹{fmt(totalExpenses)})
            </span>
          </div>
          <div className="bg-white/10 px-3 py-2 rounded-lg text-right text-xs">
            <span className="opacity-80 block">Day Shift Status</span>
            <span className="font-bold">{netProfit >= 0 ? 'Profitable ✓' : 'Deficit ⚠️'}</span>
          </div>
        </div>
      </div>

      {/* Section 4: Daily Expenses Table */}
      <div className="bg-white rounded-xl border border-neutral-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-neutral-text uppercase tracking-wide">
              💸 Daily Expenses (Petty Cash)
            </h3>
            <p className="text-[11px] text-neutral-muted">
              Auto-synced into Central Day Book ledger upon saving
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={addExpense}>
            <Plus size={14} className="mr-1" /> Add Expense
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-neutral-bg/60 text-left text-xs font-semibold text-neutral-muted uppercase">
                <th className="p-3 w-48">Category (DB)</th>
                <th className="p-3">Description</th>
                <th className="p-3 w-48">Paid To (Vendor/Staff)</th>
                <th className="p-3 w-36 text-right">Amount (₹)</th>
                <th className="p-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-xs text-neutral-muted">
                    No petty cash expenses logged for this shift yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-bg/30">
                    <td className="p-2.5">
                      <select
                        value={exp.cat}
                        onChange={(e) => updateExpense(exp.id, 'cat', e.target.value)}
                        className="w-full text-xs font-medium border border-neutral-border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="p-2.5">
                      <Input
                        value={exp.desc}
                        onChange={(e) => updateExpense(exp.id, 'desc', e.target.value)}
                        placeholder="e.g. Staff tea, generator oil"
                        className="text-xs"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        list="vendor-autocomplete"
                        value={exp.to}
                        onChange={(e) => updateExpense(exp.id, 'to', e.target.value)}
                        placeholder="Person / Staff / Vendor"
                        className="w-full text-xs border border-neutral-border rounded px-2.5 py-1.5 bg-white text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={exp.amt}
                        onChange={(e) => updateExpense(exp.id, 'amt', e.target.value)}
                        placeholder="0.00"
                        className="text-xs text-right font-bold"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => deleteExpense(exp.id)}
                        className="text-neutral-muted hover:text-danger p-1 transition"
                        title="Delete expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {expenses.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-bg/70 font-bold border-t border-neutral-border">
                  <td colSpan={3} className="p-3 text-right uppercase text-xs text-neutral-muted">Total Shift Expenses:</td>
                  <td className="p-3 text-right text-rose-700 text-sm">₹ {fmt(totalExpenses)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Datalist for Vendor Autocomplete */}
      <datalist id="vendor-autocomplete">
        {vendorOptions.map(v => (
          <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
        ))}
      </datalist>

      {/* Section 5: Shift Remarks & Bottom Actions */}
      <div className="bg-white rounded-xl border border-neutral-border shadow-sm p-4 space-y-3">
        <label className="text-xs font-bold text-neutral-muted uppercase block">
          📝 Shift Operator Notes & Audit Observations
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter shift notes (e.g. Nozzle 2 calibration checked, power outage 2 hours, tanker decanted 12KL)..."
          className="w-full text-xs border border-neutral-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex justify-between items-center pt-2 border-t border-neutral-border">
          <span className="text-xs text-neutral-muted font-medium">
            Shift Net Cash for Bank Deposit: <strong className="text-neutral-text">₹ {fmt(netAmount)}</strong>
          </span>
          <Button size="md" variant="primary" onClick={handleSave} loading={saving}>
            <Save size={15} className="mr-1.5" /> Save & Finalize Shift
          </Button>
        </div>
      </div>

      {/* ── Modal: Past Shifts & Rate History Finder ── */}
      <Modal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        title="Past Shifts & Fuel Rate History"
        size="xl"
      >
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-neutral-border">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-neutral-muted uppercase">Select Month:</label>
              <Input
                type="month"
                value={historyMonth}
                onChange={(e) => {
                  setHistoryMonth(e.target.value);
                  loadHistory(e.target.value);
                }}
                className="w-44 text-sm font-semibold"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportHistoryCsv}
                disabled={historyLoading || historyRows.length === 0}
                title="Export monthly shift register to Excel/CSV"
              >
                <Download size={14} className="mr-1 text-primary" /> Export CSV
              </Button>
              <Button size="sm" variant="secondary" onClick={() => loadHistory(historyMonth)} loading={historyLoading}>
                <RefreshCw size={14} className="mr-1" /> Refresh
              </Button>
            </div>
          </div>

          {/* Month Summary Bar */}
          {historySummary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-neutral-bg/60 p-3 rounded-lg border border-neutral-border text-xs">
              <div>
                <span className="text-neutral-muted block">Days Logged:</span>
                <span className="text-base font-bold text-neutral-text">{historySummary.days_recorded} days</span>
              </div>
              <div>
                <span className="text-neutral-muted block">Total Volume:</span>
                <span className="text-base font-bold text-neutral-text">{fmtD(historySummary.total_ms_litres + historySummary.total_hsd_litres)} L</span>
              </div>
              <div>
                <span className="text-neutral-muted block">Total Sales:</span>
                <span className="text-base font-bold text-primary">₹ {fmt(historySummary.total_sales)}</span>
              </div>
              <div>
                <span className="text-neutral-muted block">Gross Margin:</span>
                <span className="text-base font-bold text-blue-700">₹ {fmt(historySummary.total_margin)}</span>
              </div>
              <div>
                <span className="text-neutral-muted block">Net Month Profit:</span>
                <span className={`text-base font-bold ${historySummary.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ₹ {fmt(historySummary.net_profit)}
                </span>
              </div>
            </div>
          )}

          {/* History Records Table */}
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : historyRows.length === 0 ? (
            <div className="text-center py-10 text-neutral-muted text-sm">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p>No shift sheets recorded for {historyMonth}.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table
                columns={historyColumns}
                rows={historyRows}
                keyField="entry_date"
                stickyHeader
                rowClassName={(r) => r.entry_date === date ? 'bg-primary/5 font-semibold' : ''}
                emptyText={`No shift sheets recorded for ${historyMonth}.`}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ── Printable Slip (Visible only during window.print()) ── */}
      <div id="print-area" className="hidden print:block p-6 bg-white text-black font-mono">
        <div className="text-center pb-4 mb-4 border-b-2 border-black">
          <h2 className="text-xl font-bold uppercase">Petrol Bunk IOCL Enterprise Suite</h2>
          <p className="text-xs">Daily Shift Closing & Audit Voucher — Date: <strong>{date}</strong></p>
        </div>

        <div className="grid grid-cols-3 gap-6 text-xs">
          <div>
            <h4 className="font-bold border-b pb-1 mb-2 uppercase">1. Fuel Sales</h4>
            <p>MS Sold: <strong>{fmtD(msSold)} L</strong> (@ ₹{fmtD(msPrice)} | Margin ₹{fmtD(msMargin)})</p>
            <p>MS Amount: <strong>₹ {fmt(msAmount)}</strong></p>
            <p className="mt-2">HSD Sold: <strong>{fmtD(hsdSold)} L</strong> (@ ₹{fmtD(hsdPrice)} | Margin ₹{fmtD(hsdMargin)})</p>
            <p>HSD Amount: <strong>₹ {fmt(hsdAmount)}</strong></p>
            <p className="mt-2 font-bold text-sm border-t pt-1">Total Sales: ₹ {fmt(totalSales)}</p>
            <p className="font-bold text-xs text-blue-900">Gross Margin: ₹ {fmt(totalMargin)}</p>
          </div>

          <div>
            <h4 className="font-bold border-b pb-1 mb-2 uppercase">2. Collections</h4>
            <p>Cash: ₹ {fmt(cash)}</p>
            <p>PhonePe/UPI: ₹ {fmt(upi)}</p>
            <p>Card POS: ₹ {fmt(card)}</p>
            <p>Company Credit: ₹ {fmt(credit)}</p>
            <p className="mt-2 font-bold text-sm border-t pt-1">Total: ₹ {fmt(totalCollected)}</p>
            <p className={`font-bold mt-1 ${diff < 0 ? 'text-red-700' : 'text-green-700'}`}>
              Difference: {diff < 0 ? `-₹${fmt(Math.abs(diff))} (SHORT)` : `₹${fmt(diff)}`}
            </p>
          </div>

          <div>
            <h4 className="font-bold border-b pb-1 mb-2 uppercase">3. Expenses & Net</h4>
            <p>Day Expenses: <strong>₹ {fmt(totalExpenses)}</strong></p>
            <p className="mt-2">Net Cash for Deposit: <strong>₹ {fmt(netAmount)}</strong></p>
            <p className="mt-4 font-bold text-base border-t-2 pt-2">
              True Net Shift Profit: ₹ {fmt(netProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
