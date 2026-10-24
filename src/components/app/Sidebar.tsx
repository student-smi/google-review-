import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  QrCode,
  Image as ImageIcon,
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
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutApi } from '@/lib/auth';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logoutApi();
    } catch {}
    navigate('/', { replace: true });
  };

  const primaryNavItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Businesses', to: '/dashboard/businesses', icon: Building2, badge: null },
    { label: 'QR Studio', to: '/dashboard/qr', icon: QrCode, badge: 'Standees' },
    { label: 'Media Library', to: '/dashboard/media', icon: ImageIcon, badge: 'Photos' },
    { label: 'Reviews & Replies', to: '/dashboard/replies', icon: MessageSquareQuote, badge: 'AI Copilot' },
    { label: 'Analytics', to: '/dashboard/analytics', icon: TrendingUp, badge: null },
    { label: 'Local SEO', to: '/dashboard/local-seo', icon: MapPin, badge: null },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings, badge: null }
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0 select-none z-20 font-sans',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          {/* ReviewBoost AI Brand Mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#7B68EE] text-white font-black text-sm shadow-md shadow-blue-500/20 shrink-0">
            RB
          </div>
          {!collapsed && (
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

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-4 p-3 overflow-y-auto">
        {/* Workspace Quick Switcher / Home Pill */}
        {!collapsed && (
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
              collapsed && 'text-center'
            )}
          >
            {collapsed ? '•' : 'Core Tools'}
          </div>

          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
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
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
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
        </div>

        {/* Section: Account & Logout */}
        <div className="pt-2 border-t border-slate-200">
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sign Out / Landing Page' : undefined}
            className={cn(
              'group flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </nav>

      {/* Free Tier Status & Compliance Pill */}
      <div className="p-3 border-t border-slate-200">
        {!collapsed ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Cloudflare Free
                </span>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              100% Policy-compliant • Zero Gating
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="Cloudflare Free Tier Active">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
