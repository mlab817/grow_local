import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CustomerPortal } from './pages/customer/CustomerPortal';

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading GrowLocal...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return user.role === 'OWNER' ? <AdminDashboard /> : <CustomerPortal />;
}

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
