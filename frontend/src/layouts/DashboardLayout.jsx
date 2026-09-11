/**
 * layouts/DashboardLayout.jsx
 * KrushiMitra AI — Main Application Shell
 * Collapsible sidebar, header with profile menu, theme toggle, breadcrumbs.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import {
  LayoutDashboard, Package, Tags, Users, Truck,
  ShoppingCart, Boxes, Receipt, BarChart3, UserCog,
  Settings, LogOut, Menu, X, Sprout, Sun, Moon,
  ChevronLeft, Bell, User as UserIcon, Shield, Briefcase,
} from 'lucide-react';

// ── Sidebar navigation schema ──────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    section: 'Main',
    items: [
      { name: 'Dashboard',    path: '/dashboard',  icon: LayoutDashboard, roles: ['admin', 'employee'] },
      { name: 'Billing (POS)',path: '/pos',         icon: ShoppingCart,    roles: ['admin', 'employee'] },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { name: 'Products',     path: '/products',   icon: Package,         roles: ['admin'] },
      { name: 'Categories',   path: '/categories', icon: Tags,            roles: ['admin'] },
      { name: 'Inventory',    path: '/inventory',  icon: Boxes,           roles: ['admin'] },
    ],
  },
  {
    section: 'Contacts',
    items: [
      { name: 'Customers',    path: '/customers',  icon: Users,           roles: ['admin', 'employee'] },
      { name: 'Suppliers',    path: '/suppliers',  icon: Truck,           roles: ['admin'] },
    ],
  },
  {
    section: 'Finance',
    items: [
      { name: 'Expenses',     path: '/expenses',   icon: Receipt,         roles: ['admin'] },
      { name: 'Reports',      path: '/reports',    icon: BarChart3,       roles: ['admin'] },
    ],
  },
  {
    section: 'Admin',
    items: [
      { name: 'Users',        path: '/users',      icon: UserCog,         roles: ['admin'] },
      { name: 'Settings',     path: '/settings',   icon: Settings,        roles: ['admin'] },
    ],
  },
];

const DashboardLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme }    = useTheme();
  useKeyboardShortcuts();
  
  const [sidebarOpen, setSidebarOpen]       = useState(false);   // Mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse
  const [profileOpen, setProfileOpen]       = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter nav by user role
  const filteredNav = NAV_ITEMS
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(user?.role || 'employee')),
    }))
    .filter(section => section.items.length > 0);

  // Breadcrumb from path
  const crumb = location.pathname.replace('/', '') || 'dashboard';
  const crumbLabel = crumb.charAt(0).toUpperCase() + crumb.slice(1).replace('-', ' ');

  // User initials
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const sidebarWidth = sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]';

  return (
    <div className="min-h-screen bg-background text-slate-100 flex font-sans">

      {/* ── Mobile Backdrop ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-divider/60
        transition-all duration-300 ease-in-out
        ${sidebarWidth}
        w-[260px] lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className={`flex h-16 items-center px-4 border-b border-divider/60 shrink-0 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={() => setSidebarOpen(false)}>
            <div className="h-9 w-9 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
              <Sprout className="h-5 w-5 text-content" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-content tracking-tight truncate">KrushiMitra AI</span>
            )}
          </Link>

          {/* Desktop collapse button */}
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-content-muted hover:bg-surface-hover hover:text-content transition-colors ml-1">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Mobile close */}
          <button onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-content-muted hover:bg-surface-hover hover:text-content lg:hidden transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex items-center justify-center h-8 mx-3 mt-3 rounded-lg
              text-content-muted hover:bg-surface-hover hover:text-content border border-divider/40 transition-colors">
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 select-none">
          {filteredNav.map((section) => (
            <div key={section.section} className="mb-2">
              {/* Section label */}
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1.5">
                  {section.section}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : ''}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                      ${sidebarCollapsed ? 'justify-center' : ''}
                      ${isActive
                        ? 'bg-gradient-to-r from-primary-500/20 to-emerald-500/5 text-primary-400 border-l-2 border-primary-500 shadow-sm shadow-primary-500/5'
                        : 'text-content-muted hover:bg-surface-hover/60 hover:text-content'
                      }
                    `}
                  >
                    <IconComp className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary-400' : 'text-content-muted group-hover:text-content'}`} style={{ height: '18px', width: '18px' }} />
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t border-divider/60 bg-background/30 shrink-0 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          {sidebarCollapsed ? (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-emerald-500/10 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
              {initials}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-emerald-500/10 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400 shrink-0">
                {user?.photoURL
                  ? <img src={user.photoURL} alt="" className="h-full w-full rounded-xl object-cover" />
                  : initials
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-content truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  {isAdmin
                    ? <Shield className="h-3 w-3 text-primary-400" />
                    : <Briefcase className="h-3 w-3 text-amber-400" />
                  }
                  <p className="text-xs capitalize text-content-muted">{user?.role}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-red-950/20 hover:text-red-400 transition-colors" title="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-16 border-b border-divider/60 bg-surface/60 backdrop-blur-md
          flex items-center justify-between px-5 sticky top-0 z-30 shrink-0">

          {/* Left: Mobile menu + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-content-muted hover:bg-surface-hover hover:text-content lg:hidden transition-colors border border-divider/40">
              <Menu className="h-4.5 w-4.5" style={{ height: '18px', width: '18px' }} />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-xs text-content-muted">
              <Sprout className="h-3.5 w-3.5 text-primary-500/70" />
              <span>KrushiMitra AI</span>
              <span className="text-slate-700">/</span>
              <span className="text-content font-medium">{crumbLabel}</span>
            </div>
          </div>

          {/* Right: Theme + Status + Profile */}
          <div className="flex items-center gap-2">
            {/* Live status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 mr-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 font-medium">Live</span>
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className="p-2 rounded-xl text-content-muted hover:bg-surface-hover hover:text-content transition-colors border border-divider/40">
              {theme === 'dark'
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />
              }
            </button>

            {/* Notifications (placeholder) */}
            <button className="p-2 rounded-xl text-content-muted hover:bg-surface-hover hover:text-content transition-colors border border-divider/40 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-red-500 rounded-full" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-hover border border-divider/40 transition-colors">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500/20 to-emerald-500/10 border border-primary-500/20 flex items-center justify-center text-[11px] font-bold text-primary-400 shrink-0">
                  {user?.photoURL
                    ? <img src={user.photoURL} alt="" className="h-full w-full rounded-lg object-cover" />
                    : initials
                  }
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-content leading-none">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-content-muted capitalize leading-none mt-0.5">{user?.role}</p>
                </div>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl border border-divider/60 shadow-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-divider/40">
                      <p className="text-sm font-semibold text-content truncate">{user?.name}</p>
                      <p className="text-xs text-content-muted truncate">{user?.email}</p>
                      <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {isAdmin ? <Shield className="h-2.5 w-2.5" /> : <Briefcase className="h-2.5 w-2.5" />}
                        {user?.role}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <Link to="/settings" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-content-muted hover:bg-surface-hover hover:text-content transition-colors">
                        <Settings className="h-4 w-4" />Profile & Settings
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-950/20 transition-colors">
                        <LogOut className="h-4 w-4" />Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
