import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
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
  Layers
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

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  replace?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, collapsed, replace }) => {
  const { isRTL } = useLanguage();
  return (
    <NavLink
      to={to}
      replace={replace}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-4 py-3 rounded-none-none transition-all duration-200 group relative',
        isActive
          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
          : 'text-slate-500 hover:bg-primary-light hover:text-primary'
      )}
    >
      <Icon size={20} className={clsx('shrink-0', collapsed ? 'mx-auto' : '')} />
      {!collapsed && (
        <span className={clsx(
          "font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 flex-1",
          isRTL ? "text-right" : "text-left"
        )}>
          {label}
        </span>
      )}
      {collapsed && (
        <div className={clsx(
          "absolute px-2 py-1 bg-slate-900 text-white text-xs rounded-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50",
          isRTL ? "right-full mr-2" : "left-full ml-2"
        )}>
          {label}
        </div>
      )}
    </NavLink>
  );
};

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { isRTL } = useLanguage();
  const { user, logout, hasPermission } = useAuth(); // Use AuthContext

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
    <div className={clsx('flex h-screen overflow-hidden bg-slate-50 font-inter', isRTL ? 'text-right' : 'text-left')}>
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
          'fixed inset-y-0 z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col',
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
            className="hidden lg:flex p-1.5 rounded-none text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors dark:hover:bg-slate-800"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 custom-scrollbar">

          <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} collapsed={collapsed} replace={true} />

          {/* Admin Links */}
          {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
            <>
              <SidebarItem to="/users" icon={Users} label={t('users')} collapsed={collapsed} />
              <SidebarItem to="/stores" icon={Store} label={t('stores')} collapsed={collapsed} />

              {!collapsed && (
                <div className={clsx(
                  "pt-6 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
                  isRTL ? "text-right" : "text-left"
                )}>
                  {t('geoAndOrg')}
                </div>
              )}
              {collapsed && <div className="h-[1px] bg-slate-100 my-4" />}

              <SidebarItem to="/cities" icon={Map} label={t('cities')} collapsed={collapsed} />
              <SidebarItem to="/towns" icon={MapPin} label={t('towns')} collapsed={collapsed} />
              <SidebarItem to="/business-types" icon={Briefcase} label={t('businessTypes')} collapsed={collapsed} />
              <SidebarItem to="/business-categories" icon={LayoutGrid} label={t('businessCategories')} collapsed={collapsed} />
            </>
          )}

          {/* Store Owner & Employee Links */}
          {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
            <>
              {!collapsed && (
                <div className={clsx(
                  "pt-6 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
                  isRTL ? "text-right" : "text-left"
                )}>
                  {t('management')}
                </div>
              )}
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
                <SidebarItem to="/orders" icon={Briefcase} label={t('orders')} collapsed={collapsed} />
              )}
              {hasPermission(Permissions.STORE_VIEW) && ( // Assuming feedback is store view? Or we need feedback perm
                <SidebarItem to="/reviews" icon={Briefcase} label={t('feedback')} collapsed={collapsed} />
              )}
              {(hasPermission(Permissions.PROMO_CODES_VIEW) || hasPermission(Permissions.PROMO_CODES_CREATE) || hasPermission(Permissions.PROMO_CODES_UPDATE)) && (
                <SidebarItem to="/promocodes" icon={Briefcase} label={t('promoCodes')} collapsed={collapsed} />
              )}
              {hasPermission(Permissions.USERS_VIEW) && ( // View customers?
                <>
                  <SidebarItem to="/clients" icon={Users} label={t('clients')} collapsed={collapsed} />
                  <SidebarItem to="/followers" icon={Users} label={t('followers')} collapsed={collapsed} />
                </>
              )}
              {hasPermission(Permissions.SETTINGS_VIEW) && (
                <>
                  <SidebarItem to="/delivery-areas" icon={Truck} label={t('deliveryAreas')} collapsed={collapsed} />
                  <SidebarItem to="/branches" icon={MapPin} label={t('branches')} collapsed={collapsed} />
                </>
              )}

              {!collapsed && (
                <div className={clsx(
                  "pt-6 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
                  isRTL ? "text-right" : "text-left"
                )}>
                  {t('team')}
                </div>
              )}
              {hasPermission(Permissions.EMPLOYEES_VIEW) && (
                <SidebarItem to="/employees" icon={Users} label={t('employees')} collapsed={collapsed} />
              )}
              {hasPermission(Permissions.ROLES_MANAGE) && (
                <SidebarItem to="/roles" icon={Shield} label={t('roles')} collapsed={collapsed} />
              )}
            </>
          )}



          <SidebarItem to="/notifications" icon={Bell} label={t('notifications') || 'Notifications'} collapsed={collapsed} />
          {(hasPermission(Permissions.SETTINGS_VIEW) || user?.role === UserRole.EMPLOYEE) && (
            <SidebarItem to="/settings" icon={Settings} label={t('settings')} collapsed={collapsed} />
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            className={clsx(
              'flex items-center gap-3 w-full px-4 py-3 rounded-none-none transition-all duration-200 group text-rose-500 hover:bg-rose-50',
              collapsed && 'justify-center'
            )}
            onClick={handleLogout}
          >
            <LogOut size={20} className={isRTL ? 'rotate-180' : ''} />
            {!collapsed && (
              <span className={clsx(
                "font-bold text-sm flex-1",
                isRTL ? "text-right" : "text-left"
              )}>
                {t('logout')}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={clsx(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300",
        isRTL
          ? (collapsed ? 'lg:mr-20' : 'lg:mr-64')
          : (collapsed ? 'lg:ml-20' : 'lg:ml-64')
      )}>
        <header className="h-[70px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 relative z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -mx-2 text-slate-500 hover:text-primary transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={24} className={isRTL ? "rotate-180" : ""} />
            </button>
            <div className="flex items-center gap-3">
              {user?.store?.logo && (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white">
                  <img src={user.store.logo} alt="" className="w-full h-full object-contain" />
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
              <div className={clsx("flex flex-col", isRTL ? "ml-3 text-left items-start" : "mr-3 text-right items-end")}>
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
            <div className="relative">
              <NotificationBadge />
              <NotificationList />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative z-10 custom-scrollbar transition-colors">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
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
    </div>
  );
};

export default DashboardLayout;

