import { useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || null);

  function handleLogin(newToken) {
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem('adminToken');
    setToken(null);
  }

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
