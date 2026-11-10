import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../utils/api';
import { 
  Fuel, Lock, Mail, Eye, EyeOff, TrendingUp, ClipboardList, 
  DollarSign, KeyRound, CheckCircle2, ArrowLeft, RefreshCw, X, ShieldCheck 
} from 'lucide-react';
import logo from '../assets/logo.png';

const FEATURES = [
  { icon: Fuel,          title: 'Fuel Sales Tracking', desc: 'Record daily meter readings and auto-compute litres sold' },
  { icon: ClipboardList, title: 'Day Book Ledger',     desc: 'Track every income and expense with full audit trail' },
  { icon: DollarSign,    title: 'Loan Management',     desc: 'Manage given / received loans and repayment schedules' },
  { icon: TrendingUp,    title: 'Reports & Analytics', desc: 'Monthly summaries with fuel and transaction breakdowns' },
];

export default function Login() {
  const { login, loading, isLoggedIn, initializing } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Login form state
  const [form,  setForm]  = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [show,  setShow]  = useState(false);

  // Forgot password modal state
  // Steps: 'request' -> 'verify_otp' -> 'new_password' -> 'success'
  const [forgotOpen,    setForgotOpen]    = useState(false);
  const [forgotStep,    setForgotStep]    = useState('request');
  const [resetEmail,    setResetEmail]    = useState('');
  const [resetOtp,      setResetOtp]      = useState('');
  const [newPassword,   setNewPassword]   = useState('');
  const [confirmPass,   setConfirmPass]   = useState('');
  const [showNewPass,   setShowNewPass]   = useState(false);
  const [showConfPass,  setShowConfPass]  = useState(false);
  const [resetLoading,  setResetLoading]  = useState(false);
  const [resetError,    setResetError]    = useState('');
  const [countdown,     setCountdown]     = useState(0);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!initializing && isLoggedIn) navigate('/admin', { replace: true });
  }, [initializing, isLoggedIn, navigate]);

  // Handle URL query parameters from email reset link (?reset_email=...&otp=...)
  useEffect(() => {
    const qEmail = searchParams.get('reset_email');
    const qOtp   = searchParams.get('otp');
    if (qEmail || qOtp) {
      if (qEmail) setResetEmail(qEmail);
      if (qOtp)   setResetOtp(qOtp);
      setForgotStep('verify_otp');
      setForgotOpen(true);
    }
  }, [searchParams]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

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

  const handleOpenForgot = () => {
    setForgotOpen(true);
    setForgotStep('request');
    setResetError('');
    setResetOtp('');
    setNewPassword('');
    setConfirmPass('');
    if (form.email) setResetEmail(form.email);
  };

  // STEP 1: Request OTP email
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    if (!resetEmail) {
      setResetError('Please enter your email or username');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await authApi.forgotPassword(resetEmail);
      setForgotStep('verify_otp');
      setCountdown(60);
    } catch (err) {
      setResetError(err.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setResetLoading(false);
    }
  };

  // STEP 2: Verify OTP code only
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!resetOtp || resetOtp.trim().length !== 6) {
      setResetError('Please enter the 6-digit verification code');
      return;
    }

    setResetLoading(true);
    try {
      await authApi.verifyOtp({
        email: resetEmail,
        otp: resetOtp.trim(),
      });
      // Move to step 3 only after code is verified!
      setForgotStep('new_password');
    } catch (err) {
      setResetError(err.message || 'Invalid or expired verification code');
    } finally {
      setResetLoading(false);
    }
  };

  // STEP 3: Enter new password and update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPass) {
      setResetError('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      await authApi.resetPassword({
        email: resetEmail,
        otp: resetOtp.trim(),
        new_password: newPassword,
      });
      setForgotStep('success');
      setForm((p) => ({ ...p, email: resetEmail }));
    } catch (err) {
      setResetError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-bg">

      {/* Left — brand panel (hidden on small screens) */}
      <div className="hidden lg:flex flex-col justify-between flex-1 bg-gradient-to-br from-[#070d1e] via-[#0b1329] to-[#1e293b] text-white p-12 overflow-hidden relative">

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-[-60px] left-[-60px] w-72 h-72 rounded-full bg-orange-500 blur-3xl" />
          <div className="absolute bottom-[-80px] right-[-40px] w-96 h-96 rounded-full bg-blue-600 blur-3xl" />
        </div>

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center">
              <img
                src={logo}
                alt="Petrol Bunk Logo"
                className="h-16 w-auto max-w-[180px] object-contain drop-shadow-md"
              />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Petrol Bunk</h1>
              <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mt-0.5">IOCL Enterprise Suite</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="p-2 bg-white/10 text-orange-400 border border-white/10 rounded-lg flex-shrink-0 mt-0.5">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-100">{title}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-slate-400 text-xs">
          &copy; {new Date().getFullYear()} Petrol Bunk Management System (IOCL)
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 lg:flex-none lg:w-[440px] flex flex-col justify-center px-8 py-12 bg-white relative">

        {/* Header with Prominent Logo */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left mb-7">
          <div className="p-3 bg-neutral-bg/60 border border-neutral-border shadow-sm rounded-2xl mb-4 inline-flex items-center justify-center">
            <img
              src={logo}
              alt="Petrol Bunk Management System"
              className="h-16 sm:h-20 w-auto max-w-[220px] object-contain drop-shadow-sm"
            />
          </div>
          <h2 className="text-2xl font-bold text-neutral-text leading-tight">Welcome back</h2>
          <p className="text-xs text-neutral-muted mt-1">Sign in to your IOCL admin dashboard</p>
        </div>

        {error && (
          <div className="bg-danger-light border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email / Username */}
          <div>
            <label className="block text-xs font-semibold text-neutral-text mb-1.5 uppercase tracking-wide">
              Email or Username
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none" />
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="admin or admin@petrolbunk.com"
                required
                className="w-full border border-neutral-border rounded-lg pl-9 pr-3 py-2.5 text-sm bg-neutral-bg
                  text-neutral-text placeholder:text-neutral-muted outline-none
                  focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          {/* Password with Forgot Password link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-text uppercase tracking-wide">
                Password
              </label>
              <button
                type="button"
                onClick={handleOpenForgot}
                className="text-xs font-semibold text-primary hover:text-primary-dark transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
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
              focus:ring-2 focus:ring-primary/30 focus:outline-none cursor-pointer"
          >
            <Lock size={14} />
            {loading ? 'Signing in…' : 'Sign in to Dashboard'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-muted">
          Admin access only — contact your system administrator for credentials.
        </p>
      </div>

      {/* Forgot Password Modal (Sequential 3-step workflow) */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-border relative">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* STEP 1: Enter email */}
            {forgotStep === 'request' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <KeyRound size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-text">Forgot Password</h3>
                    <p className="text-xs text-neutral-muted">Step 1 of 3: Enter your account email</p>
                  </div>
                </div>

                {resetError && (
                  <div className="bg-danger-light border border-danger/20 text-danger rounded-lg px-3.5 py-2.5 text-xs mb-4">
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-text mb-1.5 uppercase tracking-wide">
                      Registered Email or Username
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none" />
                      <input
                        type="text"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. settianilkumar62v@gmail.com or admin"
                        required
                        autoFocus
                        className="w-full border border-neutral-border rounded-lg pl-9 pr-3 py-2.5 text-sm bg-neutral-bg
                          text-neutral-text placeholder:text-neutral-muted outline-none
                          focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold
                      rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition shadow-sm
                      focus:ring-2 focus:ring-primary/30 focus:outline-none cursor-pointer"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Sending verification code…
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      className="text-xs text-neutral-muted hover:text-neutral-text font-medium transition cursor-pointer"
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: Enter OTP ONLY (Verification step) */}
            {forgotStep === 'verify_otp' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-text">Verify Code</h3>
                    <p className="text-xs text-neutral-muted">Step 2 of 3: Enter the 6-digit code sent to your email</p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-neutral-700 mb-4 flex items-center justify-between">
                  <span>Code sent to: <strong className="text-primary font-semibold">{resetEmail}</strong></span>
                  <button
                    type="button"
                    onClick={() => { setForgotStep('request'); setResetError(''); }}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    Change
                  </button>
                </div>

                {resetError && (
                  <div className="bg-danger-light border border-danger/20 text-danger rounded-lg px-3.5 py-2.5 text-xs mb-4">
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-text uppercase tracking-wide">
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={resetLoading || countdown > 0}
                        className="text-[11px] font-semibold text-primary hover:text-primary-dark disabled:text-neutral-400 transition cursor-pointer"
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full text-center tracking-[10px] font-mono text-2xl font-bold border border-neutral-border
                        rounded-lg py-3 bg-neutral-bg text-neutral-text outline-none
                        focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold
                      rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition shadow-sm
                      focus:ring-2 focus:ring-primary/30 focus:outline-none cursor-pointer"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Verifying code…
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => { setForgotStep('request'); setResetError(''); }}
                      className="text-xs text-neutral-muted hover:text-neutral-text flex items-center gap-1 font-medium transition cursor-pointer"
                    >
                      <ArrowLeft size={13} /> Change email
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      className="text-xs text-neutral-muted hover:text-neutral-text font-medium transition cursor-pointer"
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: Enter New Password ONLY (Unlocked after OTP is verified!) */}
            {forgotStep === 'new_password' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-success-light text-success rounded-xl border border-success/20">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-text">Set New Password</h3>
                    <p className="text-xs text-neutral-muted">Step 3 of 3: Code verified! Choose your new password</p>
                  </div>
                </div>

                {resetError && (
                  <div className="bg-danger-light border border-danger/20 text-danger rounded-lg px-3.5 py-2.5 text-xs mb-4">
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-text mb-1.5 uppercase tracking-wide">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        autoFocus
                        className="w-full border border-neutral-border rounded-lg pl-9 pr-10 py-2.5 text-sm bg-neutral-bg
                          text-neutral-text placeholder:text-neutral-muted outline-none
                          focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                      <button type="button" onClick={() => setShowNewPass((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-neutral-text">
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-text mb-1.5 uppercase tracking-wide">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none" />
                      <input
                        type={showConfPass ? 'text' : 'password'}
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="w-full border border-neutral-border rounded-lg pl-9 pr-10 py-2.5 text-sm bg-neutral-bg
                          text-neutral-text placeholder:text-neutral-muted outline-none
                          focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                      <button type="button" onClick={() => setShowConfPass((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-neutral-text">
                        {showConfPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold
                      rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition shadow-sm
                      focus:ring-2 focus:ring-primary/30 focus:outline-none cursor-pointer"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Updating password…
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: Success confirmation */}
            {forgotStep === 'success' && (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-success-light text-success rounded-full flex items-center justify-center mx-auto mb-4 border border-success/20">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-neutral-text mb-1">Password Reset Complete!</h3>
                <p className="text-xs text-neutral-muted mb-6 leading-relaxed">
                  Your password has been successfully updated. You can now log in using your new credentials.
                </p>
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold
                    rounded-lg py-2.5 text-sm transition shadow-sm cursor-pointer"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
