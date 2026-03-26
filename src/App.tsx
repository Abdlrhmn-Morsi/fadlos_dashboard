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
import StoreDetail from './features/stores/StoreDetail';
import Cities from './features/cities/Cities';
import Towns from './features/towns/Towns';
import BusinessTypes from './features/business-types/BusinessTypes';
import BusinessCategories from './features/store-categories/BusinessCategories';
import StoreVerificationRequests from './features/stores/StoreVerificationRequests';
import ProductList from './features/products/ProductList';
import ProductForm from './features/products/ProductForm';
import ProductDetail from './features/products/ProductDetail';
import OrderList from './features/orders/OrderList';
import OrderDetail from './features/orders/OrderDetail';
import BatchAssign from './features/orders/BatchAssign';
import CashSettlement from './features/orders/CashSettlement';
import PromoCodeList from './features/promocodes/PromoCodeList';
import PromoCodeForm from './features/promocodes/PromoCodeForm';
import ReviewList from './features/reviews/ReviewList';
import ReportedReviewList from './features/reviews/ReportedReviewList';
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
import Analytics from './features/analytics/Analytics';
import AdminAnalytics from './features/analytics/pages/AdminAnalytics';
import AdminBillingTransactions from './features/analytics/pages/AdminBillingTransactions';
import DeliveryDriversPage from './features/delivery/pages/DeliveryDriversPage';
import DeliveryDriverForm from './features/delivery/components/DeliveryDriverForm';
import DriverDashboard from './features/delivery/pages/DriverDashboard';
import DriverVerificationPage from './features/delivery/pages/DriverVerificationPage';
import DriverDetail from './features/delivery/pages/DriverDetail';
import AdminDriverDetail from './features/delivery/pages/AdminDriverDetail';
import SubscriptionPage from './features/subscriptions/pages/SubscriptionPage';
import UsagePage from './features/subscriptions/pages/UsagePage';
import BillingHistory from './features/subscriptions/components/BillingHistory';
import PlansManagement from './features/subscriptions-admin/pages/PlansManagement';
import SendPromotionPage from './features/notification/pages/SendPromotionPage';
import PromotionHistoryPage from './features/notification/pages/PromotionHistoryPage';
import AdminRolesList from './features/admin-roles/components/AdminRolesList';
import AdminRoleForm from './features/admin-roles/components/AdminRoleForm';
import AdminEmployeesList from './features/admin-employees/components/AdminEmployeesList';
import AdminEmployeeForm from './features/admin-employees/components/AdminEmployeeForm';


import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Toaster } from './utils/toast';
import { NotificationProvider } from './features/notification/context/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { Permissions } from './types/permissions';
import { AdminPermissions } from './types/admin-permissions';
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

const AdminPermissionGate = ({ permission, children }: { permission: string, children: React.ReactNode }) => {
  const { hasAdminPermission, isLoading } = useAuth();

  if (isLoading) return null;

  if (!hasAdminPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { isDark } = useTheme();
  const { user, hasPermission, hasAdminPermission } = useAuth();

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
            <Route path="analytics" element={<PermissionGate permission={Permissions.ANALYTICS_VIEW}><Analytics /></PermissionGate>} />

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
            <Route path="orders/batch-assign" element={<PermissionGate permission={Permissions.ORDERS_UPDATE}><BatchAssign /></PermissionGate>} />
            <Route path="orders/settlement" element={<PermissionGate permission={Permissions.CASH_SETTLEMENT_READ}><CashSettlement /></PermissionGate>} />
            <Route path="orders/:id" element={
              (hasPermission(Permissions.ORDERS_VIEW) || hasPermission(Permissions.CLIENTS_VIEW))
                ? <OrderDetail />
                : <Navigate to="/" replace />
            } />

            <Route path="promocodes" element={<PermissionGate permission={Permissions.PROMO_CODES_VIEW}><PromoCodeList /></PermissionGate>} />
            <Route path="promocodes/new" element={<PermissionGate permission={Permissions.PROMO_CODES_CREATE}><PromoCodeForm /></PermissionGate>} />
            <Route path="promocodes/edit/:id" element={<PermissionGate permission={Permissions.PROMO_CODES_UPDATE}><PromoCodeForm /></PermissionGate>} />

            <Route path="reviews" element={
              (hasPermission(Permissions.STORE_VIEW) || hasPermission(Permissions.CLIENTS_VIEW))
                ? <ReviewList />
                : <Navigate to="/" replace />
            } />

            <Route path="clients" element={<PermissionGate permission={Permissions.CLIENTS_VIEW}><ClientList /></PermissionGate>} />
            <Route path="clients/:id" element={<PermissionGate permission={Permissions.CLIENTS_VIEW}><ClientList /></PermissionGate>} />
            <Route path="followers" element={<PermissionGate permission={Permissions.FOLLOWERS_VIEW}><FollowerList /></PermissionGate>} />
            <Route path="delivery-areas" element={<PermissionGate permission={Permissions.SETTINGS_VIEW}><DeliveryAreasPage /></PermissionGate>} />
            <Route path="branches" element={<PermissionGate permission={Permissions.SETTINGS_VIEW}><BranchesList /></PermissionGate>} />

            {/* Admin Routes */}
            <Route path="users" element={<AdminPermissionGate permission={AdminPermissions.USERS_VIEW}><Users /></AdminPermissionGate>} />
            <Route path="stores" element={<AdminPermissionGate permission={AdminPermissions.STORES_VIEW}><Stores /></AdminPermissionGate>} />
            <Route path="stores/:id" element={<AdminPermissionGate permission={AdminPermissions.STORES_VIEW}><StoreDetail /></AdminPermissionGate>} />
            <Route path="cities" element={<AdminPermissionGate permission={AdminPermissions.CITIES_VIEW}><Cities /></AdminPermissionGate>} />
            <Route path="towns" element={<AdminPermissionGate permission={AdminPermissions.TOWNS_VIEW}><Towns /></AdminPermissionGate>} />
            <Route path="business-types" element={<AdminPermissionGate permission={AdminPermissions.BUSINESS_TYPES_VIEW}><BusinessTypes /></AdminPermissionGate>} />
            <Route path="business-categories" element={<AdminPermissionGate permission={AdminPermissions.BUSINESS_CATEGORIES_VIEW}><BusinessCategories /></AdminPermissionGate>} />
            <Route path="reported-reviews" element={<AdminPermissionGate permission={AdminPermissions.REPORTED_REVIEWS_VIEW}><ReportedReviewList /></AdminPermissionGate>} />
            <Route path="drivers/verification" element={<AdminPermissionGate permission={AdminPermissions.DRIVER_VERIFICATION_VIEW}><DriverVerificationPage /></AdminPermissionGate>} />
            <Route path="drivers/verification/:id" element={<AdminPermissionGate permission={AdminPermissions.DRIVER_VERIFICATION_VIEW}><AdminDriverDetail /></AdminPermissionGate>} />
            <Route path="stores/verification" element={<AdminPermissionGate permission={AdminPermissions.STORE_VERIFICATION_VIEW}><StoreVerificationRequests /></AdminPermissionGate>} />
            <Route path="plans-management" element={
              user?.role === UserRole.SUPER_ADMIN ? <PlansManagement /> : <Navigate to="/" replace />
            } />
            <Route path="billing-transactions" element={
              (user?.role === UserRole.SUPER_ADMIN || (user?.role === UserRole.ADMIN && hasAdminPermission(AdminPermissions.ANALYTICS_VIEW)))
                ? <AdminBillingTransactions />
                : <Navigate to="/" replace />
            } />
            <Route path="admin-analytics" element={
              (user?.role === UserRole.SUPER_ADMIN || (user?.role === UserRole.ADMIN && hasAdminPermission(AdminPermissions.ANALYTICS_VIEW)))
                ? <AdminAnalytics />
                : <Navigate to="/" replace />
            } />

            <Route path="admin-roles" element={<AdminPermissionGate permission={AdminPermissions.ADMIN_ROLES_MANAGE}><AdminRolesList /></AdminPermissionGate>} />
            <Route path="admin-roles/new" element={<AdminPermissionGate permission={AdminPermissions.ADMIN_ROLES_MANAGE}><AdminRoleForm /></AdminPermissionGate>} />
            <Route path="admin-roles/edit/:id" element={<AdminPermissionGate permission={AdminPermissions.ADMIN_ROLES_MANAGE}><AdminRoleForm /></AdminPermissionGate>} />

            <Route path="admin-employees" element={<AdminPermissionGate permission={AdminPermissions.ADMIN_EMPLOYEES_VIEW}><AdminEmployeesList /></AdminPermissionGate>} />
            <Route path="admin-employees/new" element={<AdminPermissionGate permission={AdminPermissions.ADMIN_EMPLOYEES_MANAGE}><AdminEmployeeForm /></AdminPermissionGate>} />
            <Route path="admin-employees/edit/:id" element={<AdminPermissionGate permission={AdminPermissions.ADMIN_EMPLOYEES_MANAGE}><AdminEmployeeForm /></AdminPermissionGate>} />

            <Route path="store-settings" element={<PermissionGate permission={Permissions.STORE_VIEW}><StoreSettings /></PermissionGate>} />
            <Route path="profile-settings" element={<ProfileSettings />} />
            <Route path="settings" element={<Settings />} />
            <Route path="app-updates" element={<AppUpdateSettings />} />
            <Route path="app-version-history" element={<AppVersionHistory />} />
            <Route path="subscription" element={
              (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN)
                ? <SubscriptionPage />
                : <Navigate to="/" replace />
            } />
            <Route path="billing-history" element={
              (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN)
                ? <BillingHistory />
                : <Navigate to="/" replace />
            } />
            <Route path="usage" element={
              (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN)
                ? <UsagePage />
                : <Navigate to="/" replace />
            } />
            <Route path="send-promotion" element={<SendPromotionPage />} />
            <Route path="promotions/history" element={<PromotionHistoryPage />} />

            <Route path="notifications" element={
              (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.STORE_OWNER ||
                hasPermission(Permissions.ORDERS_VIEW) || hasPermission(Permissions.ORDERS_UPDATE) ||
                hasPermission(Permissions.STORE_VIEW) || hasPermission(Permissions.STORE_UPDATE) ||
                hasPermission(Permissions.CLIENTS_VIEW) || hasPermission(Permissions.FOLLOWERS_VIEW) || hasPermission(Permissions.USERS_UPDATE))
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

            {/* Delivery Drivers */}
            <Route path="delivery-drivers" element={<PermissionGate permission={Permissions.DELIVERY_DRIVERS_VIEW}><DeliveryDriversPage /></PermissionGate>} />
            <Route path="delivery-drivers/new" element={<PermissionGate permission={Permissions.DELIVERY_DRIVERS_CREATE}><DeliveryDriverForm /></PermissionGate>} />
            <Route path="delivery-drivers/:id" element={<PermissionGate permission={Permissions.DELIVERY_DRIVERS_VIEW}><DriverDetail /></PermissionGate>} />
            <Route path="delivery-drivers/edit/:id" element={<PermissionGate permission={Permissions.DELIVERY_DRIVERS_UPDATE}><DeliveryDriverForm /></PermissionGate>} />
            <Route path="delivery-dashboard" element={<PermissionGate permission={Permissions.DELIVERY_DRIVERS_VIEW}><DriverDashboard /></PermissionGate>} />

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
