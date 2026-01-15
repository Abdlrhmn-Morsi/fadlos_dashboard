import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  Briefcase
} from 'lucide-react';
import clsx from 'clsx';
import './DashboardLayout.css';
import appLogo from '../assets/app_logo_primary.png';
import StatusModal from '../components/common/StatusModal';

const SidebarItem = ({ to, icon: Icon, label, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => clsx(
      'sidebar-item',
      isActive && 'active'
    )}
    title={collapsed ? label : ''}
  >
    <Icon size={20} />
    {!collapsed && <span>{label}</span>}
  </NavLink>
);

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx('sidebar', collapsed && 'collapsed', mobileOpen && 'mobile-open')}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src={appLogo} alt="Logo" className="sidebar-logo" />
          </div>
          <button
            className="collapse-btn desktop-only"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
          <SidebarItem to="/users" icon={Users} label="Users" collapsed={collapsed} />
          <SidebarItem to="/stores" icon={Store} label="Stores" collapsed={collapsed} />
          <div className="sidebar-divider">Administrative</div>
          <SidebarItem to="/cities" icon={Map} label="Cities" collapsed={collapsed} />
          <SidebarItem to="/towns" icon={MapPin} label="Towns" collapsed={collapsed} />
          <SidebarItem to="/business-types" icon={Briefcase} label="Business Types" collapsed={collapsed} />
          <SidebarItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="top-header">
          <button
            className="mobile-toggle mobile-only"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="header-title">
            <h1>Dashboard</h1>
          </div>

          <div className="header-actions">
            <div className="user-profile">
              <div className="avatar">A</div>
              <span className="username">Admin</span>
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      <StatusModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        type="confirm"
        title="Logout"
        message="Are you sure you want to log out?"
        onConfirm={confirmLogout}
        confirmText="Logout"
      />
    </div>
  );
};

export default DashboardLayout;
