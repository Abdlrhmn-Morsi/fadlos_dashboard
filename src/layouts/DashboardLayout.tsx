import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Map,
  MapPin,
  Briefcase,
  LayoutGrid,
  Truck,
  LucideIcon,
  Bell,
  Shield,
  Layers,
  TrendingUp,
  DollarSign,
  CreditCard,
  BarChart3,
  Tag,
  MessageSquare,
  Crown,
  ShieldCheck,
  BadgeCheck
} from 'lucide-react';
import clsx from 'clsx';
import appLogo from '../assets/app_logo_primary.png';
import StatusModal from '../components/common/StatusModal';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import ThemeToggle from '../components/common/ThemeToggle';
import { UserRole } from '../types/user-role';
import { useLanguage } from '../contexts/LanguageContext';
import { NotificationBadge } from '../features/notification/components/NotificationBadge';
import { NotificationList } from '../features/notification/components/NotificationList';
import { useAuth } from '../contexts/AuthContext';
import { Permissions } from '../types/permissions';
import { AdminPermissions } from '../types/admin-permissions';
import { useSubscription } from '../hooks/useSubscription';
import { PlanFeature } from '../types/plan-feature';

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  replace?: boolean;
  end?: boolean;
  isPremium?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, collapsed, replace, end, isPremium }) => {
  const { isRTL } = useLanguage();
  const location = useLocation();

  const isActive = (() => {
    if (end) return location.pathname === to;
    if (to === '/' && location.pathname !== '/') return false;
    
    // special cases for stores and drivers overlapping with their /verification paths
    if (to === '/stores') {
      return location.pathname === '/stores' || (location.pathname.startsWith('/stores/') && !location.pathname.startsWith('/stores/verification'));
    }
    if (to === '/drivers') {
      return location.pathname === '/drivers' || (location.pathname.startsWith('/drivers/') && !location.pathname.startsWith('/drivers/verification'));
    }

    return location.pathname === to || location.pathname.startsWith(to + '/');
  })();

  return (
    <Link
      to={to}
      replace={replace}
      className={clsx(
        'flex items-center rounded-[4px] transition-all duration-200 group relative',
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3',
        isActive
          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
          : 'text-slate-500 hover:bg-primary-light hover:text-primary'
      )}
    >
      <Icon
        size={20}
        className={clsx(
          'shrink-0 transition-transform duration-200 group-hover:scale-110',
          collapsed ? 'mx-auto' : (isRTL ? 'ml-3' : 'mr-3')
        )}
      />
      {!collapsed && (
        <>
          <span className="font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300">
            {label}
          </span>
          {isPremium && (
            <div className={clsx("flex-1 flex justify-end", isRTL ? "mr-4" : "ml-4")}>
              <Crown size={14} className="text-amber-500 shrink-0" />
            </div>
          )}
        </>
      )}
      {collapsed && (
        <div className={clsx(
          "absolute px-2 py-1 bg-slate-900 text-white text-xs rounded-[4px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 flex items-center gap-1.5",
          isRTL ? "right-full mr-2" : "left-full ml-2"
        )}>
          {label}
          {isPremium && <Crown size={10} className="text-amber-400" />}
        </div>
      )}
    </Link>
  );
};

interface LockedSidebarItemProps {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}

const LockedSidebarItem: React.FC<LockedSidebarItemProps> = ({ icon: Icon, label, collapsed }) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/subscription')}
      className={clsx(
        'flex items-center rounded-[4px] transition-all duration-200 group relative w-full',
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3',
        'text-slate-300 dark:text-slate-500 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
      )}
    >
      <Icon
        size={20}
        className={clsx(
          'shrink-0 transition-transform duration-200 group-hover:scale-110',
          collapsed ? 'mx-auto' : (isRTL ? 'ml-3' : 'mr-3')
        )}
      />
      {!collapsed && (
        <>
          <span className="font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300">
            {label}
          </span>
          <div className={clsx("flex-1 flex justify-end", isRTL ? "mr-4" : "ml-4")}>
            <Crown size={14} className="text-amber-500 shrink-0" />
          </div>
        </>
      )}
      {collapsed && (
        <div className={clsx(
          "absolute px-2 py-1 bg-slate-900 text-white text-xs rounded-[4px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 flex items-center gap-1.5",
          isRTL ? "right-full mr-2" : "left-full ml-2"
        )}>
          {label}
          <Crown size={10} className="text-amber-400" />
        </div>
      )}
    </button>
  );
};

interface SidebarHeaderProps {
  label: string;
  collapsed: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ label, collapsed }) => {
  if (collapsed) return <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />;
  return (
    <div className="pt-6 pb-2 px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
      {label}
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'subscriptions', 'dashboard', 'analytics']);
  const { isRTL } = useLanguage();
  const { user, logout, hasPermission, hasAdminPermission } = useAuth(); // Use AuthContext
  const { hasFeature, usage } = useSubscription();

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleLabel = () => {
    if (!user) return '';

    // Show the custom employee role name if it exists (e.g., "AAAA", "Manager", etc.)
    if (user.employeeRole?.name) {
      return user.employeeRole.name;
    }

    // Fallback to translated role names
    if (user.role === UserRole.SUPER_ADMIN) return t('super_admin');
    if (user.role === UserRole.ADMIN) return t('admin');
    if (user.role === UserRole.STORE_OWNER) return t('store_owner');
    if (user.role === UserRole.CUSTOMER) return t('customer');
    if (user.role === UserRole.EMPLOYEE) return t('employee');

    return user.role;
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={clsx('flex h-screen overflow-hidden bg-slate-50 font-inter print:h-auto print:overflow-visible')}
    >
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in animate-fade duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col print:hidden',
          isRTL ? 'right-0 border-l' : 'left-0 border-r',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen
            ? 'translate-x-0'
            : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')
        )}
      >
        <div className="h-[70px] flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" replace className={clsx('flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity', collapsed && 'justify-center w-full')}>
            <img src={appLogo} alt="Logo" className="w-12 h-12 object-contain" />
          </Link>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          )}
          <button
            className="hidden lg:flex p-1.5 rounded-[4px] text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors dark:hover:bg-slate-800"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 custom-scrollbar">
          {/* Admin Links */}
          {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
            <>
              {/* System Data Section */}
              {(hasAdminPermission(AdminPermissions.ANALYTICS_VIEW) ||
                hasAdminPermission(AdminPermissions.USERS_VIEW) ||
                hasAdminPermission(AdminPermissions.STORES_VIEW)) && (
                  <>
                    <SidebarHeader label={t('System Data')} collapsed={collapsed} />
                    {hasAdminPermission(AdminPermissions.ANALYTICS_VIEW) && (
                      <>
                        <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} collapsed={collapsed} replace={true} />
                        <SidebarItem to="/admin-analytics" icon={BarChart3} label={t('dashboard:adminAnalytics', { defaultValue: 'Analytics' })} collapsed={collapsed} />
                      </>
                    )}
                    {hasAdminPermission(AdminPermissions.USERS_VIEW) && <SidebarItem to="/users" icon={Users} label={t('users')} collapsed={collapsed} />}
                    {hasAdminPermission(AdminPermissions.STORES_VIEW) && <SidebarItem to="/stores" icon={Store} label={t('stores')} collapsed={collapsed} />}
                  </>
                )}

              {/* Verification Section */}
              {(hasAdminPermission(AdminPermissions.STORE_VERIFICATION_VIEW) ||
                hasAdminPermission(AdminPermissions.DRIVER_VERIFICATION_VIEW)) && (
                  <>
                    <SidebarHeader label={t('Verification Requests')} collapsed={collapsed} />
                    {hasAdminPermission(AdminPermissions.STORE_VERIFICATION_VIEW) && (
                      <SidebarItem to="/stores/verification" icon={ShieldCheck} label={t('storeVerification', 'Store Verification')} collapsed={collapsed} />
                    )}
                    {hasAdminPermission(AdminPermissions.DRIVER_VERIFICATION_VIEW) && (
                      <SidebarItem to="/drivers/verification" icon={Shield} label={t('driverVerification', 'Driver Verification')} collapsed={collapsed} />
                    )}
                  </>
                )}

              {/* Content Section */}
              {hasAdminPermission(AdminPermissions.REPORTED_REVIEWS_VIEW) && (
                <>
                  <SidebarHeader label={t('Content Moderation')} collapsed={collapsed} />
                  <SidebarItem to="/reported-reviews" icon={Shield} label={t('reportedReviews')} collapsed={collapsed} />
                </>
              )}

              {/* Team Section */}
              {(hasAdminPermission(AdminPermissions.ADMIN_EMPLOYEES_VIEW) ||
                hasAdminPermission(AdminPermissions.ADMIN_ROLES_MANAGE)) && (
                  <>
                    <SidebarHeader label={t('Admin Team')} collapsed={collapsed} />
                    {hasAdminPermission(AdminPermissions.ADMIN_EMPLOYEES_VIEW) && (
                      <SidebarItem to="/admin-employees" icon={Users} label={t('adminEmployees', { defaultValue: 'Admin Employees' })} collapsed={collapsed} />
                    )}
                    {hasAdminPermission(AdminPermissions.ADMIN_ROLES_MANAGE) && (
                      <SidebarItem to="/admin-roles" icon={Shield} label={t('adminRoles', { defaultValue: 'Admin Roles' })} collapsed={collapsed} />
                    )}
                  </>
                )}

              {/* Geography Section */}
              {(hasAdminPermission(AdminPermissions.CITIES_VIEW) ||
                hasAdminPermission(AdminPermissions.TOWNS_VIEW)) && (
                  <>
                    <SidebarHeader label={t('Geography')} collapsed={collapsed} />
                    {hasAdminPermission(AdminPermissions.CITIES_VIEW) && <SidebarItem to="/cities" icon={Map} label={t('cities')} collapsed={collapsed} />}
                    {hasAdminPermission(AdminPermissions.TOWNS_VIEW) && <SidebarItem to="/towns" icon={MapPin} label={t('towns')} collapsed={collapsed} />}
                  </>
                )}

              {/* Configuration Section */}
              {(user?.role === UserRole.SUPER_ADMIN ||
                hasAdminPermission(AdminPermissions.BUSINESS_TYPES_VIEW) ||
                hasAdminPermission(AdminPermissions.BUSINESS_CATEGORIES_VIEW) ||
                hasAdminPermission(AdminPermissions.PLANS_VIEW) ||
                hasAdminPermission(AdminPermissions.ANALYTICS_VIEW)) && (
                  <>
                    <SidebarHeader label={t('System Configuration')} collapsed={collapsed} />
                    {hasAdminPermission(AdminPermissions.BUSINESS_TYPES_VIEW) && <SidebarItem to="/business-types" icon={Briefcase} label={t('businessTypes')} collapsed={collapsed} />}
                    {hasAdminPermission(AdminPermissions.BUSINESS_CATEGORIES_VIEW) && <SidebarItem to="/business-categories" icon={LayoutGrid} label={t('businessCategories')} collapsed={collapsed} />}
                    {user?.role === UserRole.SUPER_ADMIN && (
                      <SidebarItem to="/plans-management" icon={CreditCard} label={t('plansManagement', 'Plans Management')} collapsed={collapsed} />
                    )}
                    {(user?.role === UserRole.SUPER_ADMIN || hasAdminPermission(AdminPermissions.ANALYTICS_VIEW)) && (
                      <SidebarItem to="/billing-transactions" icon={CreditCard} label={t('billingTransactions')} collapsed={collapsed} />
                    )}
                  </>
                )}
            </>
          )}

          {/* Store Management Sections */}
          {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
            <>
              <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} collapsed={collapsed} replace={true} />

              {/* Analytics - Role-aware feature gating */}
              {user?.role === UserRole.STORE_OWNER ? (
                (hasFeature(PlanFeature.ADVANCED_ANALYTICS) || usage?.plan?.toLowerCase() === 'premium' || usage?.plan?.toLowerCase() === 'pro')
                  ? hasPermission(Permissions.ANALYTICS_VIEW) && <SidebarItem to="/analytics" icon={TrendingUp} label={t('analytics')} collapsed={collapsed} />
                  : <LockedSidebarItem icon={TrendingUp} label={t('analytics')} collapsed={collapsed} />
              ) : (
                (hasFeature(PlanFeature.ADVANCED_ANALYTICS) || usage?.plan?.toLowerCase() === 'premium' || usage?.plan?.toLowerCase() === 'pro') && hasPermission(Permissions.ANALYTICS_VIEW) && (
                  <SidebarItem to="/analytics" icon={TrendingUp} label={t('analytics')} collapsed={collapsed} />
                )
              )}

              {(hasPermission(Permissions.PRODUCTS_CREATE) ||
                hasPermission(Permissions.PRODUCTS_UPDATE) ||
                hasPermission(Permissions.CATEGORIES_CREATE) ||
                hasPermission(Permissions.CATEGORIES_UPDATE) ||
                hasPermission(Permissions.ADDONS_VIEW) ||
                hasPermission(Permissions.ADDONS_CREATE) ||
                hasPermission(Permissions.ORDERS_VIEW) ||
                hasPermission(Permissions.ORDERS_UPDATE) ||
                hasPermission(Permissions.CASH_SETTLEMENT_READ) ||
                user?.role === UserRole.EMPLOYEE) && (
                  <>
                    <SidebarHeader label={t('management')} collapsed={collapsed} />
                    {(hasPermission(Permissions.PRODUCTS_CREATE) || hasPermission(Permissions.PRODUCTS_UPDATE) || user?.role === UserRole.EMPLOYEE) && (
                      <SidebarItem to="/products" icon={Briefcase} label={t('products')} collapsed={collapsed} />
                    )}
                    {(hasPermission(Permissions.CATEGORIES_CREATE) || hasPermission(Permissions.CATEGORIES_UPDATE) || user?.role === UserRole.EMPLOYEE) && (
                      <SidebarItem to="/categories" icon={LayoutGrid} label={t('categories')} collapsed={collapsed} />
                    )}
                    {(hasPermission(Permissions.ADDONS_VIEW) || hasPermission(Permissions.ADDONS_CREATE) || user?.role === UserRole.EMPLOYEE) && (
                      <SidebarItem to="/addons" icon={Layers} label={t('addons')} collapsed={collapsed} />
                    )}
                    {(hasPermission(Permissions.ORDERS_VIEW) || hasPermission(Permissions.ORDERS_UPDATE)) && (
                      <SidebarItem to="/orders" icon={Briefcase} label={t('orders')} collapsed={collapsed} end={true} />
                    )}
                    {hasPermission(Permissions.CASH_SETTLEMENT_READ) && (
                      <SidebarItem to="/orders/settlement" icon={DollarSign} label={t('settlements', 'Cash Settlement')} collapsed={collapsed} />
                    )}
                  </>
                )}
              {(hasPermission(Permissions.PROMO_CODES_VIEW) || hasPermission(Permissions.PROMO_CODES_CREATE) || hasPermission(Permissions.PROMO_CODES_UPDATE) ||
                (user?.role === UserRole.STORE_OWNER ? hasPermission(Permissions.STORE_VIEW) : hasPermission(Permissions.CLIENTS_VIEW)) ||
                hasPermission(Permissions.CLIENTS_VIEW) || hasPermission(Permissions.FOLLOWERS_VIEW)) && (
                  <>
                    <SidebarHeader label={t('marketingAndCustomers')} collapsed={collapsed} />

                    {/* Reviews - Role-aware */}
                    {user?.role === UserRole.STORE_OWNER ? (
                      hasFeature(PlanFeature.REVIEWS_MANAGEMENT)
                        ? hasPermission(Permissions.STORE_VIEW) && <SidebarItem to="/reviews" icon={MessageSquare} label={t('feedback')} collapsed={collapsed} />
                        : <LockedSidebarItem icon={MessageSquare} label={t('feedback')} collapsed={collapsed} />
                    ) : (
                      hasFeature(PlanFeature.REVIEWS_MANAGEMENT) && hasPermission(Permissions.CLIENTS_VIEW) && (
                        <SidebarItem to="/reviews" icon={MessageSquare} label={t('feedback')} collapsed={collapsed} />
                      )
                    )}

                    {/* PromoCodes - Role-aware */}
                    {user?.role === UserRole.STORE_OWNER ? (
                      hasFeature(PlanFeature.PROMOCODES)
                        ? (hasPermission(Permissions.PROMO_CODES_VIEW) || hasPermission(Permissions.PROMO_CODES_CREATE) || hasPermission(Permissions.PROMO_CODES_UPDATE)) && <SidebarItem to="/promocodes" icon={Tag} label={t('promoCodes')} collapsed={collapsed} />
                        : <LockedSidebarItem icon={Tag} label={t('promoCodes')} collapsed={collapsed} />
                    ) : (
                      hasFeature(PlanFeature.PROMOCODES) && (hasPermission(Permissions.PROMO_CODES_VIEW) || hasPermission(Permissions.PROMO_CODES_CREATE) || hasPermission(Permissions.PROMO_CODES_UPDATE)) && (
                        <SidebarItem to="/promocodes" icon={Tag} label={t('promoCodes')} collapsed={collapsed} />
                      )
                    )}

                    {/* Clients - Role-aware */}
                    {user?.role === UserRole.STORE_OWNER ? (
                      <>
                        {hasFeature(PlanFeature.STORE_CLIENTS_MANAGEMENT)
                          ? hasPermission(Permissions.CLIENTS_VIEW) && <SidebarItem to="/clients" icon={Users} label={t('clients')} collapsed={collapsed} />
                          : <LockedSidebarItem icon={Users} label={t('clients')} collapsed={collapsed} />
                        }
                        {hasFeature(PlanFeature.STORE_FOLLOWERS_MANAGEMENT)
                          ? hasPermission(Permissions.CLIENTS_VIEW) && <SidebarItem to="/followers" icon={Users} label={t('followers')} collapsed={collapsed} />
                          : <LockedSidebarItem icon={Users} label={t('followers')} collapsed={collapsed} />
                        }
                      </>
                    ) : (
                      hasPermission(Permissions.CLIENTS_VIEW) && (
                        <>
                          {hasFeature(PlanFeature.STORE_CLIENTS_MANAGEMENT) && (
                            <SidebarItem to="/clients" icon={Users} label={t('clients')} collapsed={collapsed} />
                          )}
                          {hasFeature(PlanFeature.STORE_FOLLOWERS_MANAGEMENT) && (
                            <SidebarItem to="/followers" icon={Users} label={t('followers')} collapsed={collapsed} />
                          )}
                        </>
                      )
                    )}
                  </>
                )}

              {(hasPermission(Permissions.EMPLOYEES_VIEW) ||
                hasPermission(Permissions.ROLES_MANAGE) ||
                hasPermission(Permissions.DELIVERY_DRIVERS_VIEW)) && (
                  <>
                    <SidebarHeader label={t('team')} collapsed={collapsed} />
                    {hasPermission(Permissions.EMPLOYEES_VIEW) && (
                      <SidebarItem to="/employees" icon={Users} label={t('employees')} collapsed={collapsed} />
                    )}
                    {hasPermission(Permissions.ROLES_MANAGE) && (
                      <SidebarItem to="/roles" icon={Shield} label={t('roles')} collapsed={collapsed} />
                    )}
                    {hasPermission(Permissions.DELIVERY_DRIVERS_VIEW) && (
                      <SidebarItem to="/delivery-drivers" icon={Truck} label={t('deliveryDrivers')} collapsed={collapsed} />
                    )}
                  </>
                )}

              {user?.role === UserRole.STORE_OWNER && (
                <>
                  <SidebarHeader label={t('subscriptions:title')} collapsed={collapsed} />
                  <SidebarItem to="/subscription" icon={CreditCard} label={t('subscriptions:currentPlan')} collapsed={collapsed} />
                  <SidebarItem to="/billing-history" icon={DollarSign} label={t('subscriptions:billingHistory.title')} collapsed={collapsed} />
                  <SidebarItem to="/usage" icon={BarChart3} label={t('subscriptions:usage.title')} collapsed={collapsed} />
                </>
              )}
            </>
          )}

          {user?.role === UserRole.DELIVERY && (
            <>
              <SidebarItem to="/delivery-dashboard" icon={Truck} label={t('deliveryDashboard', 'Driver Dashboard')} collapsed={collapsed} />
            </>
          )}

          {/* Store Config Section - Shared by all authorized roles */}
          {(hasPermission(Permissions.SETTINGS_VIEW) || user?.role === UserRole.STORE_OWNER || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
            <>
              <SidebarHeader label={t('common:storeSettings')} collapsed={collapsed} />

              {user?.role !== UserRole.SUPER_ADMIN && (
                <>
                  {hasPermission(Permissions.SETTINGS_VIEW) && (
                    <SidebarItem to="/branches" icon={MapPin} label={t('branches')} collapsed={collapsed} />
                  )}
                  {(hasPermission(Permissions.SETTINGS_VIEW) || hasPermission(Permissions.DELIVERY_AREAS_VIEW)) && (
                    <SidebarItem to="/delivery-areas" icon={Truck} label={t('deliveryAreas')} collapsed={collapsed} />
                  )}
                </>
              )}
              {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN ||
                hasPermission(Permissions.ORDERS_VIEW) || hasPermission(Permissions.ORDERS_UPDATE) ||
                hasPermission(Permissions.STORE_VIEW) || hasPermission(Permissions.STORE_UPDATE) ||
                hasPermission(Permissions.CLIENTS_VIEW) || hasPermission(Permissions.FOLLOWERS_VIEW) || hasPermission(Permissions.USERS_UPDATE)) && (
                  <SidebarItem to="/notifications" icon={Bell} label={t('notifications') || 'Notifications'} collapsed={collapsed} />
                )}
              {(hasPermission(Permissions.SETTINGS_VIEW) || user?.role === UserRole.EMPLOYEE || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
                <SidebarItem to="/settings" icon={Settings} label={t('settings')} collapsed={collapsed} />
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            className={clsx(
              'flex items-center gap-3 w-full px-4 py-3 rounded-[4px] transition-all duration-200 group text-rose-500 hover:bg-rose-50',
              collapsed && 'justify-center'
            )}
            onClick={handleLogout}
          >
            <LogOut size={20} className={isRTL ? 'rotate-180' : ''} />
            {!collapsed && (
              <span className={clsx(
                "font-bold text-sm flex-1"
              )}>
                {t('logout')}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={clsx(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 print:overflow-visible print:bg-white print:!m-0",
        isRTL
          ? (collapsed ? 'lg:mr-20' : 'lg:mr-64')
          : (collapsed ? 'lg:ml-20' : 'lg:ml-64')
      )}>
        <header className="h-[70px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 relative z-30 transition-colors print:hidden">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -mx-2 text-slate-500 hover:text-primary transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={24} className={isRTL ? "rotate-180" : ""} />
            </button>
            <div className="flex items-center gap-3">
              {user?.store?.logo && (
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white">
                    <img src={user.store.logo} alt="" className="w-full h-full object-contain" />
                  </div>
                  {user?.store?.isVerified && (
                    <div className={clsx(
                      "absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-lg border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-500",
                      isRTL ? "-right-1" : "-right-1" // Physical right is fine for bottom-right badge
                    )}>
                      <BadgeCheck size={14} className="text-emerald-500" />
                    </div>
                  )}
                </div>
              )}
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 hidden sm:block">
                {user?.role === UserRole.SUPER_ADMIN
                  ? t('adminConsole')
                  : (isRTL ? (user?.store?.nameAr || user?.store?.name) : user?.store?.name) || t('adminConsole')}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "flex items-center gap-3 transition-all duration-200",
                (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && "cursor-pointer hover:opacity-80 active:scale-95"
              )}
              onClick={() => {
                if (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) {
                  navigate('/profile-settings');
                }
              }}
            >
              <div className={clsx("flex flex-col mx-3")}>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none mb-1">
                  {user?.name}
                </span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">
                  {getRoleLabel()}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center font-black shadow-lg shadow-primary/20 border-2 border-white dark:border-slate-800">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.username?.substring(0, 2).toUpperCase() || 'AD'
                )}
              </div>
            </div>
            {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.STORE_OWNER ||
              hasPermission(Permissions.ORDERS_VIEW) || hasPermission(Permissions.ORDERS_UPDATE) ||
              hasPermission(Permissions.STORE_VIEW) || hasPermission(Permissions.STORE_UPDATE) ||
              hasPermission(Permissions.CLIENTS_VIEW) || hasPermission(Permissions.FOLLOWERS_VIEW) || hasPermission(Permissions.USERS_UPDATE)) && (
                <div className="relative">
                  <NotificationBadge />
                  <NotificationList />
                </div>
              )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative custom-scrollbar transition-colors print:overflow-visible print:bg-white text-black">
          <Outlet />
        </main>
      </div>

      <StatusModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        type="confirm"
        title={t('logoutSession')}
        message={t('logoutMessage')}
        onConfirm={confirmLogout}
        confirmText={t('confirmLogout')}
      />
    </div >
  );
};

export default DashboardLayout;

