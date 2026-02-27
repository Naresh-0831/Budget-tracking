import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Savings from './pages/Savings';
import BudgetSettings from './pages/BudgetSettings';
import AIInsights from './pages/AIInsights';
import SetupIncome from './pages/SetupIncome';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63)' }}>
    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Block unauthenticated users → /login
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

// Block logged-in users from seeing /login or /register
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : children;
}

// After login: if income not set → force /setup-income; else let through
function IncomeGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  // Income is unset if monthlyIncome is null, 0, or undefined
  const hasIncome = user.monthlyIncome != null && user.monthlyIncome > 0;
  // Fall back to monthlySalary for existing users who set income before this feature
  const hasSalary = user.monthlySalary != null && user.monthlySalary > 0;
  if (!hasIncome && !hasSalary) return <Navigate to="/setup-income" replace />;
  return children;
}

// On /setup-income: if income already set → redirect to dashboard
function SetupRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  const hasIncome = (user.monthlyIncome != null && user.monthlyIncome > 0)
    || (user.monthlySalary != null && user.monthlySalary > 0);
  return hasIncome ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Income setup gate – authenticated but no income yet */}
      <Route
        path="/setup-income"
        element={<SetupRoute><SetupIncome /></SetupRoute>}
      />

      {/* All main app routes – need auth + income */}
      <Route element={<ProtectedRoute><IncomeGuard><AppLayout /></IncomeGuard></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="savings" element={<Savings />} />
        <Route path="budget-settings" element={<BudgetSettings />} />
        <Route path="ai-insights" element={<AIInsights />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1b4b',
              color: '#e2e8f0',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1e1b4b' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e1b4b' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
