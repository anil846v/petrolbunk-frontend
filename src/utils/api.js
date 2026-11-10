const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// ─── Auth session helpers ─────────────────────────────────────────────────────
export const auth = {
  setSession:   (user) => localStorage.setItem('pb_user', JSON.stringify(user)),
  clearSession: ()     => localStorage.removeItem('pb_user'),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('pb_user')); }
    catch { return null; }
  },
};

// ─── Core request ─────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const headers = {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err    = new Error(data.message || `HTTP ${res.status}`);
    err.status   = res.status;
    err.data     = data;
    throw err;
  }

  if (data && data.success && Array.isArray(data.data) && data.meta) {
    data.data = {
      rows: data.data,
      meta: data.meta
    };
  }

  return data;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
const get = (path, params) => {
  if (!params) return request(path);
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = Object.keys(clean).length ? '?' + new URLSearchParams(clean).toString() : '';
  return request(`${path}${qs}`);
};
const post  = (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) });
const put   = (path, body) => request(path, { method: 'PUT',    body: JSON.stringify(body) });
const patch = (path, body) => request(path, { method: 'PATCH',  body: JSON.stringify(body) });
const del   = (path)       => request(path, { method: 'DELETE' });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (body)  => post('/auth/login', body),
  logout:         ()      => post('/auth/logout'),
  me:             ()      => get('/auth/me'),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  verifyOtp:      (body)  => post('/auth/verify-otp', body),
  resetPassword:  (body)  => post('/auth/reset-password', body),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoryApi = {
  list:         (params)     => get('/categories', params),
  getById:      (id)         => get(`/categories/${id}`),
  create:       (body)       => post('/categories', body),
  update:       (id, body)   => put(`/categories/${id}`, body),
  toggleStatus: (id)         => patch(`/categories/${id}/toggle-status`),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const userApi = {
  list:          (params)   => get('/users', params),
  getById:       (id)       => get(`/users/${id}`),
  create:        (body)     => post('/users', body),
  update:        (id, body) => put(`/users/${id}`, body),
  toggleStatus:  (id)       => patch(`/users/${id}/toggle-status`),
  resetPassword: (id, body) => patch(`/users/${id}/reset-password`, body),
};

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const vendorApi = {
  list:         (params)      => get('/vendors', params),
  getById:      (id)          => get(`/vendors/${id}`),
  create:       (body)        => post('/vendors', body),
  update:       (id, body)    => put(`/vendors/${id}`, body),
  toggleStatus: (id)          => patch(`/vendors/${id}/toggle-status`),
  getLedger:    (id, params)  => get(`/vendors/${id}/ledger`, params),
};

// ─── Transactions (Day Book) ─────────────────────────────────────────────────
export const transactionApi = {
  list:       (params)   => get('/transactions', params),
  getSummary: (params)   => get('/transactions/summary', params),
  getById:    (id)       => get(`/transactions/${id}`),
  create:     (body)     => post('/transactions', body),
  update:     (id, body) => put(`/transactions/${id}`, body),
  remove:     (id)       => del(`/transactions/${id}`),
};

// ─── Loans ────────────────────────────────────────────────────────────────────
export const loanApi = {
  list:           (params) => get('/loans', params),
  getOutstanding: (params) => get('/loans/outstanding', params),
  getById:        (id)     => get(`/loans/${id}`),
  create:         (body)   => post('/loans', body),
  update:         (id, body)=> put(`/loans/${id}`, body),
  close:          (id)     => patch(`/loans/${id}/close`),
  getLedger:      (id)     => get(`/loans/${id}/ledger`),
};

// ─── Loan Transactions ────────────────────────────────────────────────────────
export const loanTransactionApi = {
  list:    (params) => get('/loan-transactions', params),
  getById: (id)     => get(`/loan-transactions/${id}`),
  create:  (body)   => post('/loan-transactions', body),
  remove:  (id)     => del(`/loan-transactions/${id}`),
};

// ─── Daily Daybook (Unified Prototype 2 Shift System) ─────────────────────────
export const dailyDaybookApi = {
  getByDate:      (date)         => get(`/daily-daybook/date/${date}`),
  saveDay:        (body)         => post('/daily-daybook', body),
  listHistory:    (params)       => get('/daily-daybook/history', params),
  deleteDay:      (date)         => del(`/daily-daybook/date/${date}`),
  getLatestRates: (params)       => get('/daily-daybook/rates/latest', params),
  getRateByDate:  (date)         => get(`/daily-daybook/rates/date/${date}`),
  fetchLiveRates: (body)         => post('/daily-daybook/rates/fetch-live', body),
  getRateHistory: (params)       => get('/daily-daybook/rates/history', params),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary:           (params) => get('/dashboard', params),
  getFuelTrend:         (days)   => get('/dashboard/chart/fuel-trend', { days }),
  getIncomeExpenseTrend:(days)   => get('/dashboard/chart/income-expense', { days }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportApi = {
  monthly:        (params)          => get('/reports/monthly', params),
  fuelDaily:      (params)          => get('/reports/fuel/daily', params),
  fuelMonthly:    (params)          => get('/reports/fuel/monthly', params),
  fuelByType:     (params)          => get('/reports/fuel/by-type', params),
  fuelCommission: (params)          => get('/reports/fuel/commission', params),
  incomeExpense:  (params)          => get('/reports/financial/income-expense', params),
  profit:         (params)          => get('/reports/financial/profit', params),
  paymentMode:    (params)          => get('/reports/financial/payment-mode', params),
  loansActive:    (params)          => get('/reports/loans/active', params),
  loansClosed:    (params)          => get('/reports/loans/closed', params),
  loansInterest:  ()                => get('/reports/loans/interest'),
  vendorLedger:   (vendorId, params)=> get(`/reports/vendor/${vendorId}/ledger`, params),
  categoryWise:   (params)          => get('/reports/transactions/category-wise', params),
};
