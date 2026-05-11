import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import AdminLayout from './components/AdminLayout';
import AdminPackages from './pages/AdminPackages';
import AdminContent from './pages/AdminContent';
import AdminSettings from './pages/AdminSettings';
import AdminUsers from './pages/AdminUsers';
import AdminRoutes from './pages/AdminRoutes';
import AdminNotifications from './pages/AdminNotifications';

// Placeholder components for other admin pages
const Dashboard = () => (
  <div className="space-y-8">
    <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Dashboard Overview</h1>
    <div className="grid md:grid-cols-3 gap-8">
      <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
        <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">Revenue (MTD)</h3>
        <p className="text-4xl font-bold text-stone-900">$124,500</p>
        <div className="mt-4 text-green-500 text-sm font-bold flex items-center gap-1">
          <span>+12.5%</span>
          <span className="text-stone-400 font-normal">vs last month</span>
        </div>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
        <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">Active Deliveries</h3>
        <p className="text-4xl font-bold text-stone-900">1,284</p>
        <div className="mt-4 text-blue-500 text-sm font-bold flex items-center gap-1">
          <span>842</span>
          <span className="text-stone-400 font-normal">on schedule</span>
        </div>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
        <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">Customer Satisfaction</h3>
        <p className="text-4xl font-bold text-stone-900">98.2%</p>
        <div className="mt-4 text-yellow-500 text-sm font-bold flex items-center gap-1">
          <span>4.9/5</span>
          <span className="text-stone-400 font-normal">average rating</span>
        </div>
      </div>
    </div>
    <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm h-96 flex items-center justify-center text-stone-400 font-medium italic">
      Real-time analytics chart placeholder
    </div>
  </div>
);

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<SignUp />} />
        <Route path="/admin/forgot-password/reset" element={<ForgotPassword />} />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <PrivateRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="packages" element={<AdminPackages />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="routes" element={<AdminRoutes />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
              </Routes>
            </AdminLayout>
          </PrivateRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}
