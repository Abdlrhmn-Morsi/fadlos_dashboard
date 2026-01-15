import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import Users from './features/users/Users';
import Stores from './features/stores/Stores';
import Cities from './features/cities/Cities';
import Towns from './features/towns/Towns';
import BusinessTypes from './features/business-types/BusinessTypes';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const AppContent = () => {
  const { isDark } = useTheme();

  return (
    <div className={isDark ? 'dark' : ''}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />

            {/* Placeholder Routes for planned features */}
            <Route path="users" element={<Users />} />
            <Route path="stores" element={<Stores />} />
            <Route path="cities" element={<Cities />} />
            <Route path="towns" element={<Towns />} />
            <Route path="business-types" element={<BusinessTypes />} />
            <Route path="settings" element={<div className="p-4"><h2>Settings (Coming Soon)</h2></div>} />

            {/* Redirect unknown to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
