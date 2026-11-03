import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  QrCode,
  MessageSquareQuote,
  TrendingUp,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Inbox,
  CheckSquare,
  Sparkles,
  Store,
  Star,
  LogOut,
  Tag,
  Crown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutApi, isAdminUser } from '@/lib/auth';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    onCloseMobile?.();
    try {
      await logoutApi();
    } catch {}
    navigate('/', { replace: true });
  };

  const handleNavClick = () => {
    onCloseMobile?.();
  };

  const primaryNavItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Businesses', to: '/dashboard/businesses', icon: Building2, badge: null },
    { label: 'QR Studio', to: '/dashboard/qr', icon: QrCode, badge: 'Standees' },
    { label: 'Reviews & Replies', to: '/dashboard/replies', icon: MessageSquareQuote, badge: 'AI Copilot' },
    { label: 'Keyword Management', to: '/dashboard/keywords', icon: Tag, badge: 'Chips' },
    { label: 'Analytics', to: '/dashboard/analytics', icon: TrendingUp, badge: null },
    { label: 'Local SEO', to: '/dashboard/local-seo', icon: MapPin, badge: null },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings, badge: null }
  ];

  return (
    <aside
      className={cn(
        // Desktop styles (lg and up)
        'lg:relative lg:flex lg:flex-col lg:translate-x-0 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0 select-none font-sans',
        collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        // Mobile styles (< lg): slide-in drawer
        'fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl lg:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
        <NavLink to="/dashboard" onClick={handleNavClick} className="flex items-center gap-2.5 overflow-hidden">
          {/* ReviewBoost AI Brand Mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#7B68EE] text-white font-black text-sm shadow-md shadow-blue-500/20 shrink-0">
            RB
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base tracking-tight text-slate-900 truncate">
                ReviewBoost <span className="text-[#2563EB] bg-blue-50 px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider border border-blue-200">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Google Review QR
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Arrow Button */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile Close X Button */}
        <button
          onClick={onCloseMobile}
          title="Close Navigation"
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-4 p-3 overflow-y-auto">
        {/* Workspace Quick Switcher / Home Pill */}
        {(!collapsed || mobileOpen) && (
          <div className="p-1">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs">
              <span className="flex items-center gap-2 truncate">
                <span className="text-amber-500">⭐</span>
                <span className="truncate">Google Review Space</span>
              </span>
              <span className="text-[10px] text-slate-400">▾</span>
            </div>
          </div>
        )}

        {/* Section: Main Menu */}
        <div className="space-y-1">
          <div
            className={cn(
              'px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 font-mono',
              collapsed && !mobileOpen && 'text-center'
            )}
          >
            {collapsed && !mobileOpen ? '•' : 'Core Tools'}
          </div>

          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                <item.icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
              </div>

              {(!collapsed || mobileOpen) && item.badge && (
                <span
                  className={cn(
                    'h-4 px-1.5 rounded-full text-[9px] font-bold flex items-center justify-center font-mono',
                    item.badge === 'AI Copilot'
                      ? 'bg-pink-500/10 text-pink-600'
                      : 'bg-blue-500/10 text-blue-600'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Super Admin Panel Link */}
          {isAdminUser() && (
            <div className="pt-2">
              <NavLink
                to="/admin"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/80'
                  )
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                  {(!collapsed || mobileOpen) && <span className="truncate">Super Admin</span>}
                </div>
                {(!collapsed || mobileOpen) && (
                  <span className="h-4 px-1.5 rounded-full text-[9px] font-black bg-indigo-700 text-white uppercase tracking-wider font-mono">
                    Master
                  </span>
                )}
              </NavLink>
            </div>
          )}
        </div>

        {/* Section: Account & Logout */}
        <div className="pt-2 border-t border-slate-200">
          <button
            onClick={handleSignOut}
            title={collapsed && !mobileOpen ? 'Sign Out / Landing Page' : undefined}
            className={cn(
              'group flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer',
              collapsed && !mobileOpen && 'justify-center'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
