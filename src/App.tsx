import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import VerifyEmail from './features/auth/VerifyEmail';
import ForgotPassword from './features/auth/ForgotPassword';
import Dashboard from './features/dashboard/Dashboard';
import Users from './features/users/Users';
import Stores from './features/stores/Stores';
import Cities from './features/cities/Cities';
import Towns from './features/towns/Towns';
import BusinessTypes from './features/business-types/BusinessTypes';
import ProductList from './features/products/ProductList';
import ProductForm from './features/products/ProductForm';
import ProductDetail from './features/products/ProductDetail';
import OrderList from './features/orders/OrderList';
import OrderDetail from './features/orders/OrderDetail';
import PromoCodeList from './features/promocodes/PromoCodeList';
import PromoCodeForm from './features/promocodes/PromoCodeForm';
import ReviewList from './features/reviews/ReviewList';
import ClientList from './features/clients/ClientList';
import FollowerList from './features/followers/FollowerList';
import CategoryList from './features/categories/CategoryList';
import Settings from './features/settings/Settings';
import StoreSettings from './features/settings/StoreSettings';
import ProfileSettings from './features/settings/ProfileSettings';
import DeliveryAreasPage from './features/stores/DeliveryAreasPage';
import { BranchesList } from './features/branches/BranchesList';
import AppUpdateSettings from './features/settings/AppUpdateSettings';
import AppVersionHistory from './features/settings/AppVersionHistory';
import { NotificationPage } from './features/notification/pages/NotificationPage';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Toaster } from './utils/toast';
import { NotificationProvider } from './features/notification/context/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const AppContent = () => {
  const { isDark } = useTheme();

  return (
    <div className={isDark ? 'dark' : ''}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />

            {/* Store Owner Routes */}
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />

            <Route path="categories" element={<CategoryList />} />

            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetail />} />

            <Route path="promocodes" element={<PromoCodeList />} />
            <Route path="promocodes/new" element={<PromoCodeForm />} />
            <Route path="promocodes/edit/:id" element={<PromoCodeForm />} />

            <Route path="reviews" element={<ReviewList />} />

            <Route path="clients" element={<ClientList />} />
            <Route path="followers" element={<FollowerList />} />
            <Route path="delivery-areas" element={<DeliveryAreasPage />} />
            <Route path="branches" element={<BranchesList />} />

            {/* Admin Routes */}
            <Route path="users" element={<Users />} />
            <Route path="stores" element={<Stores />} />
            <Route path="cities" element={<Cities />} />
            <Route path="towns" element={<Towns />} />
            <Route path="business-types" element={<BusinessTypes />} />

            <Route path="store-settings" element={<StoreSettings />} />
            <Route path="profile-settings" element={<ProfileSettings />} />
            <Route path="settings" element={<Settings />} />
            <Route path="app-updates" element={<AppUpdateSettings />} />
            <Route path="app-version-history" element={<AppVersionHistory />} />
            <Route path="notifications" element={<NotificationPage />} />

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
      <AuthProvider>
        <NotificationProvider>
          <Toaster position="top-right" />
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
