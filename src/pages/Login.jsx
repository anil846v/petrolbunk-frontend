import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Fuel, Lock, Mail, Eye, EyeOff, TrendingUp, ClipboardList, DollarSign } from 'lucide-react';

const FEATURES = [
  { icon: Fuel,          title: 'Fuel Sales Tracking', desc: 'Record daily meter readings and auto-compute litres sold' },
  { icon: ClipboardList, title: 'Day Book Ledger',     desc: 'Track every income and expense with full audit trail' },
  { icon: DollarSign,    title: 'Loan Management',     desc: 'Manage given / received loans and repayment schedules' },
  { icon: TrendingUp,    title: 'Reports & Analytics', desc: 'Monthly summaries with fuel and transaction breakdowns' },
];

export default function Login() {
  const { login, loading, isLoggedIn, initializing } = useAuth();
  const navigate = useNavigate();
  const [form,  setForm]  = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [show,  setShow]  = useState(false);

  useEffect(() => {
    if (!initializing && isLoggedIn) navigate('/admin', { replace: true });
  }, [initializing, isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-bg">

      {/* Left — brand panel (hidden on small screens) */}
      <div className="hidden lg:flex flex-col justify-between flex-1 bg-primary text-white p-12 overflow-hidden relative">

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-60px] left-[-60px] w-72 h-72 rounded-full bg-white" />
          <div className="absolute bottom-[-80px] right-[-40px] w-96 h-96 rounded-full bg-white" />
        </div>

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Fuel size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Petrol Bunk</h1>
              <p className="text-primary-light text-sm">Management System</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="p-2 bg-white/15 rounded-lg flex-shrink-0 mt-0.5">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-primary-light text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-primary-light text-xs">
          &copy; {new Date().getFullYear()} Petrol Bunk Management System
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 lg:flex-none lg:w-[440px] flex flex-col justify-center px-8 py-12 bg-white">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <Fuel size={24} className="text-primary" />
          <span className="font-bold text-neutral-text">Petrol Bunk</span>
        </div>

        <h2 className="text-2xl font-bold text-neutral-text mb-1">Welcome back</h2>
        <p className="text-sm text-neutral-muted mb-8">Sign in to your admin dashboard</p>

        {error && (
          <div className="bg-danger-light border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-neutral-text mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="admin@petrolbunk.com"
                required
                className="w-full border border-neutral-border rounded-lg pl-9 pr-3 py-2.5 text-sm bg-neutral-bg
                  text-neutral-text placeholder:text-neutral-muted outline-none
                  focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-text mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none" />
              <input
                type={show ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter your password"
                required
                className="w-full border border-neutral-border rounded-lg pl-9 pr-10 py-2.5 text-sm bg-neutral-bg
                  text-neutral-text placeholder:text-neutral-muted outline-none
                  focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <button type="button" onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-neutral-text">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold
              rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition shadow-sm
              focus:ring-2 focus:ring-primary/30 focus:outline-none"
          >
            <Lock size={14} />
            {loading ? 'Signing in…' : 'Sign in to Dashboard'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-muted">
          Admin access only — contact your system administrator for credentials.
        </p>
      </div>
    </div>
  );
}
