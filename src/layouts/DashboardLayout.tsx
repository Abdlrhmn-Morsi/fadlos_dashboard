import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  LucideIcon
} from 'lucide-react';
import clsx from 'clsx';
import appLogo from '../assets/app_logo_primary.png';
import StatusModal from '../components/common/StatusModal';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import ThemeToggle from '../components/common/ThemeToggle';
import { UserRole } from '../types/user-role';

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => clsx(
      'flex items-center gap-3 px-4 py-3 rounded-none-none transition-all duration-200 group relative',
      isActive
        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
        : 'text-slate-500 hover:bg-primary-light hover:text-primary'
    )}
  >
    <Icon size={20} className={clsx('shrink-0', collapsed ? 'mx-auto' : '')} />
    {!collapsed && (
      <span className="font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300">
        {label}
      </span>
    )}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </NavLink>
);

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-inter">
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
          'fixed inset-y-0 left-0 lg:relative z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-[70px] flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div className={clsx('flex items-center gap-3', collapsed && 'justify-center w-full')}>
            <img src={appLogo} alt="Logo" className="w-12 h-12 object-contain" />
          </div>
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
          <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} collapsed={collapsed} />

          {/* Admin Links */}
          {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
            <>
              <SidebarItem to="/users" icon={Users} label={t('users')} collapsed={collapsed} />
              <SidebarItem to="/stores" icon={Store} label={t('stores')} collapsed={collapsed} />

              {!collapsed && (
                <div className="pt-6 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {t('geoAndOrg')}
                </div>
              )}
              {collapsed && <div className="h-[1px] bg-slate-100 my-4" />}

              <SidebarItem to="/cities" icon={Map} label={t('cities')} collapsed={collapsed} />
              <SidebarItem to="/towns" icon={MapPin} label={t('towns')} collapsed={collapsed} />
              <SidebarItem to="/business-types" icon={Briefcase} label={t('businessTypes')} collapsed={collapsed} />
            </>
          )}

          {/* Store Owner Links */}
          {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
            <>
              {!collapsed && (
                <div className="pt-6 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {t('management')}
                </div>
              )}
              <SidebarItem to="/products" icon={Briefcase} label={t('products')} collapsed={collapsed} />
              <SidebarItem to="/categories" icon={LayoutGrid} label={t('categories')} collapsed={collapsed} />
              <SidebarItem to="/orders" icon={Briefcase} label={t('orders')} collapsed={collapsed} />
              <SidebarItem to="/reviews" icon={Briefcase} label={t('reviews')} collapsed={collapsed} />
              <SidebarItem to="/promocodes" icon={Briefcase} label={t('promoCodes')} collapsed={collapsed} />
              <SidebarItem to="/clients" icon={Users} label={t('clients')} collapsed={collapsed} />
              <SidebarItem to="/followers" icon={Users} label={t('followers')} collapsed={collapsed} />
              <SidebarItem to="/delivery-areas" icon={Truck} label={t('deliveryAreas', { defaultValue: 'Delivery Areas' })} collapsed={collapsed} />
            </>
          )}

          <SidebarItem to="/settings" icon={Settings} label={t('settings')} collapsed={collapsed} />
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            className={clsx(
              'flex items-center gap-3 w-full px-4 py-3 rounded-none-none transition-all duration-200 group text-rose-500 hover:bg-rose-50',
              collapsed && 'justify-center'
            )}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-bold text-sm">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-[70px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 relative z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-primary transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 hidden sm:block">
              {user?.role === UserRole.SUPER_ADMIN ? t('adminConsole') : (user?.store?.name || t('adminConsole'))}
            </h1>
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
              <div className="flex flex-col items-end mr-2 hidden xs:flex text-right">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tighter">
                  {user?.role === UserRole.SUPER_ADMIN ? t('administrator') : user?.role === UserRole.STORE_OWNER ? t('storeOwner') : user?.role}
                </span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{user?.role === UserRole.SUPER_ADMIN ? t('superControl') : t('dashboard')}</span>
              </div>
              <div className="w-10 h-10 rounded-none bg-primary text-white flex items-center justify-center font-black shadow-lg shadow-primary/20">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
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

