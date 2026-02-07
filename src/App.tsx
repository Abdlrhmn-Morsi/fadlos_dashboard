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
import BusinessCategories from './features/store-categories/BusinessCategories';
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
import RolesList from './features/roles/components/RolesList';
import RoleForm from './features/roles/components/RoleForm';
import EmployeesList from './features/employees/components/EmployeesList';
import EmployeeForm from './features/employees/components/EmployeeForm';
import AddonsList from './features/addons/components/AddonsList';
import AddonForm from './features/addons/components/AddonForm';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Toaster } from './utils/toast';
import { NotificationProvider } from './features/notification/context/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { Permissions } from './types/permissions';
import { UserRole } from './types/user-role';

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

const PermissionGate = ({ permission, children }: { permission: string, children: React.ReactNode }) => {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) return null;

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { isDark } = useTheme();
  const { user, hasPermission } = useAuth();

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

            {/* Store Owner & Employee Routes */}
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<PermissionGate permission={Permissions.PRODUCTS_CREATE}><ProductForm /></PermissionGate>} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products/edit/:id" element={<PermissionGate permission={Permissions.PRODUCTS_UPDATE}><ProductForm /></PermissionGate>} />

            <Route path="addons" element={<AddonsList />} />
            <Route path="addons/new" element={<PermissionGate permission={Permissions.ADDONS_CREATE}><AddonForm /></PermissionGate>} />
            <Route path="addons/edit/:id" element={<AddonForm />} />

            <Route path="categories" element={<CategoryList />} />

            <Route path="orders" element={<PermissionGate permission={Permissions.ORDERS_VIEW}><OrderList /></PermissionGate>} />
            <Route path="orders/:id" element={
              (hasPermission(Permissions.ORDERS_VIEW) || hasPermission(Permissions.USERS_VIEW))
                ? <OrderDetail />
                : <Navigate to="/" replace />
            } />

            <Route path="promocodes" element={<PermissionGate permission={Permissions.PROMO_CODES_VIEW}><PromoCodeList /></PermissionGate>} />
            <Route path="promocodes/new" element={<PermissionGate permission={Permissions.PROMO_CODES_CREATE}><PromoCodeForm /></PermissionGate>} />
            <Route path="promocodes/edit/:id" element={<PermissionGate permission={Permissions.PROMO_CODES_UPDATE}><PromoCodeForm /></PermissionGate>} />

            <Route path="reviews" element={
              (hasPermission(Permissions.STORE_VIEW) || hasPermission(Permissions.USERS_VIEW))
                ? <ReviewList />
                : <Navigate to="/" replace />
            } />

            <Route path="clients" element={<PermissionGate permission={Permissions.USERS_VIEW}><ClientList /></PermissionGate>} />
            <Route path="followers" element={<PermissionGate permission={Permissions.USERS_VIEW}><FollowerList /></PermissionGate>} />
            <Route path="delivery-areas" element={<PermissionGate permission={Permissions.SETTINGS_VIEW}><DeliveryAreasPage /></PermissionGate>} />
            <Route path="branches" element={<PermissionGate permission={Permissions.SETTINGS_VIEW}><BranchesList /></PermissionGate>} />

            {/* Admin Routes */}
            <Route path="users" element={<Users />} />
            <Route path="stores" element={<Stores />} />
            <Route path="cities" element={<Cities />} />
            <Route path="towns" element={<Towns />} />
            <Route path="business-types" element={<BusinessTypes />} />
            <Route path="business-categories" element={<BusinessCategories />} />


            <Route path="store-settings" element={<PermissionGate permission={Permissions.STORE_VIEW}><StoreSettings /></PermissionGate>} />
            <Route path="profile-settings" element={<ProfileSettings />} />
            <Route path="settings" element={<Settings />} />
            <Route path="app-updates" element={<AppUpdateSettings />} />
            <Route path="app-version-history" element={<AppVersionHistory />} />
            <Route path="notifications" element={
              (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.STORE_OWNER ||
                hasPermission(Permissions.ORDERS_VIEW) || hasPermission(Permissions.ORDERS_UPDATE) ||
                hasPermission(Permissions.STORE_VIEW) || hasPermission(Permissions.STORE_UPDATE) ||
                hasPermission(Permissions.USERS_VIEW) || hasPermission(Permissions.USERS_UPDATE))
                ? <NotificationPage />
                : <Navigate to="/" replace />
            } />

            {/* Team Management Routes */}
            <Route path="roles" element={<PermissionGate permission={Permissions.ROLES_MANAGE}><RolesList /></PermissionGate>} />
            <Route path="roles/new" element={<PermissionGate permission={Permissions.ROLES_MANAGE}><RoleForm /></PermissionGate>} />
            <Route path="roles/edit/:id" element={<PermissionGate permission={Permissions.ROLES_MANAGE}><RoleForm /></PermissionGate>} />

            <Route path="employees" element={<PermissionGate permission={Permissions.EMPLOYEES_VIEW}><EmployeesList /></PermissionGate>} />
            <Route path="employees/new" element={<PermissionGate permission={Permissions.EMPLOYEES_CREATE}><EmployeeForm /></PermissionGate>} />
            <Route path="employees/edit/:id" element={<PermissionGate permission={Permissions.EMPLOYEES_UPDATE}><EmployeeForm /></PermissionGate>} />

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
      <CacheProvider>
        <AuthProvider>
          <NotificationProvider>
            <Toaster position="top-right" />
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </CacheProvider>
    </ThemeProvider>
  );
}

export default App;
