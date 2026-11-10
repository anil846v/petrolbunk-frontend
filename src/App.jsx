import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import Loader from './components/common/Loader';
import PWAInstallBanner from './components/common/PWAInstallBanner';
import { useAuth } from './context/AuthContext';

// ─── Lazy page imports ────────────────────────────────────────────────────────
const Login    = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));

// Master
const Categories = lazy(() => import('./pages/Admin/master/Categories'));
const Users      = lazy(() => import('./pages/Admin/master/Users'));
const Vendors    = lazy(() => import('./pages/Admin/master/Vendors'));

// Transactions
const TodaysEntry      = lazy(() => import('./pages/Admin/transactions/TodaysEntry'));
const Daybook          = lazy(() => import('./pages/Admin/transactions/Daybook'));

// Loans
const Loans        = lazy(() => import('./pages/Admin/loans/Loans'));
const LoanPayments = lazy(() => import('./pages/Admin/loans/LoanPayments'));

// Reports
const MonthlyReport = lazy(() => import('./pages/Admin/reports/MonthlyReport'));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader size="lg" />
  </div>
);

function ProtectedRoute() {
  const { isLoggedIn, initializing } = useAuth();
  if (initializing) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/admin/login" element={<Login />} />

          {/* Protected — accessible to both Admin & Staff */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Transactions */}
              <Route path="transactions/todays-entry"      element={<TodaysEntry />} />
              <Route path="transactions/fuel-transactions" element={<Navigate to="/admin/transactions/todays-entry" replace />} />
              <Route path="transactions/daybook"           element={<Daybook />} />

              {/* Loans */}
              <Route path="loans"          element={<Loans />} />
              <Route path="loans/payments" element={<LoanPayments />} />

              {/* Reports */}
              <Route path="reports/monthly-report" element={<MonthlyReport />} />

              {/* Admin-only master routes */}
              <Route element={<AdminRoute />}>
                <Route path="master/categories" element={<Categories />} />
                <Route path="master/users"      element={<Users />} />
                <Route path="master/vendors"    element={<Vendors />} />
                <Route path="master/fuel-types" element={<Navigate to="/admin/transactions/todays-entry" replace />} />
              </Route>
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/"  element={<Navigate to="/admin/login" replace />} />
          <Route path="*"  element={<NotFound />} />
        </Routes>
      </Suspense>
      <PWAInstallBanner />
    </BrowserRouter>
  );
}
