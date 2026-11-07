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
  Sparkles,
  Store,
  Star,
  LogOut,
  Tag,
  Crown,
  X,
  CreditCard,
  Layers,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutApi, isAdminUser } from '@/lib/auth';
import { useHierarchy } from '@/context/HierarchyContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const { currentLevel, activeBrand, activeBusiness, activeBranch, isSingleMode, roles } = useHierarchy();

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

  // 0. Single Store Nav Items (Clean, simple, unified for a single shop/clinic/salon)
  const singleNavItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Review Inbox', to: '/dashboard/replies', icon: MessageSquareQuote, badge: null },
    { label: 'AI Reply Assistant', to: '/dashboard/ai-replies', icon: Sparkles, badge: 'AI' },
    { label: 'Customer Requests', to: '/dashboard/customer-requests', icon: Inbox, badge: 'Private' },
    { label: 'Review QR & Standees', to: '/dashboard/qr', icon: QrCode, badge: 'Standee' },
    { label: 'Keyword Management', to: '/dashboard/keywords', icon: Tag, badge: 'SEO' },
    { label: 'Analytics & Reports', to: '/dashboard/analytics', icon: TrendingUp, badge: null },
    { label: 'Profile Settings', to: '/dashboard/settings', icon: Settings, badge: null }
  ];

  // 0b. Executive Scoped Nav Items (Restricted strictly to their assigned branch: Review, QR Score, QR Code & Reply)
  const executiveNavItems = [
    { label: 'Branch Overview', to: '/dashboard', icon: LayoutDashboard, badge: 'Live' },
    { label: 'Reviews', to: '/dashboard/replies', icon: MessageSquareQuote, badge: null },
    { label: 'Reply Assistant', to: '/dashboard/ai-replies', icon: Sparkles, badge: '1-Click' },
    { label: 'Customer Requests', to: '/dashboard/customer-requests', icon: Inbox, badge: 'Private' },
    { label: 'Review QR & Link', to: '/dashboard/qr', icon: QrCode, badge: 'Standee' }
  ];

  // 1. Brand Level Items (Image 2)
  const brandNavItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Businesses', to: '/dashboard/businesses', icon: Building2, badge: 'Entities' },
    { label: 'All Branches', to: '/dashboard/branches', icon: Store, badge: null },
    { label: 'All Reviews', to: '/dashboard/replies', icon: MessageSquareQuote, badge: null },
    { label: 'AI Reply Center', to: '/dashboard/ai-replies', icon: Sparkles, badge: 'AI' },
    { label: 'Customer Requests', to: '/dashboard/customer-requests', icon: Inbox, badge: 'Private' },
    { label: 'Keyword Management', to: '/dashboard/keywords', icon: Tag, badge: 'SEO' },
    { label: 'Review Campaigns', to: '/dashboard/qr', icon: QrCode, badge: 'Standees' },
    { label: 'Analytics & Reports', to: '/dashboard/analytics', icon: TrendingUp, badge: null },
    { label: 'Team & Permissions', to: '/dashboard/team', icon: ShieldCheck, badge: null },
    { label: 'Package & Billing', to: '/dashboard/billing', icon: Crown, badge: null },
    { label: 'Profile Settings', to: '/dashboard/settings', icon: Settings, badge: null }
  ];

  // 2. Business Level Items (Image 3)
  const businessNavItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Branches', to: '/dashboard/branches', icon: Store, badge: 'Outlets' },
    { label: 'Review Inbox', to: '/dashboard/replies', icon: MessageSquareQuote, badge: null },
    { label: 'AI Replies', to: '/dashboard/ai-replies', icon: Sparkles, badge: 'AI' },
    { label: 'Customer Requests', to: '/dashboard/customer-requests', icon: Inbox, badge: 'Private' },
    { label: 'Keyword Management', to: '/dashboard/keywords', icon: Tag, badge: 'SEO' },
    { label: 'Review Collection', to: '/dashboard/qr', icon: QrCode, badge: 'QR/NFC' },
    { label: 'Reports', to: '/dashboard/analytics', icon: TrendingUp, badge: null },
    { label: 'Staff & Roles', to: '/dashboard/team', icon: ShieldCheck, badge: null },
    { label: 'Subscription & Invoices', to: '/dashboard/billing', icon: CreditCard, badge: null },
    { label: 'Profile Settings', to: '/dashboard/settings', icon: Settings, badge: null }
  ];

  // 3. Branch Level Items (Image 4)
  const branchNavItems = [
    { label: 'Branch Overview', to: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Reviews', to: '/dashboard/replies', icon: MessageSquareQuote, badge: null },
    { label: 'Reply Assistant', to: '/dashboard/ai-replies', icon: Sparkles, badge: '1-Click' },
    { label: 'Customer Requests', to: '/dashboard/customer-requests', icon: Inbox, badge: 'Private' },
    { label: 'Keyword Management', to: '/dashboard/keywords', icon: Tag, badge: 'SEO' },
    { label: 'Review QR & Link', to: '/dashboard/qr', icon: QrCode, badge: 'Standee' },
    { label: 'Branch Analytics', to: '/dashboard/analytics', icon: TrendingUp, badge: null },
    { label: 'Staff', to: '/dashboard/team', icon: ShieldCheck, badge: null },
    { label: 'Profile Settings', to: '/dashboard/settings', icon: Settings, badge: null }
  ];

  const currentNavItems = roles.isExecutive
    ? executiveNavItems
    : isSingleMode
    ? singleNavItems
    : currentLevel === 'brand'
    ? brandNavItems
    : currentLevel === 'business'
    ? businessNavItems
    : branchNavItems;

  const currentContextTitle = roles.isExecutive
    ? {
        title: activeBranch?.name || 'Assigned Branch',
        subtitle: `${roles.assignedRole === 'branch_manager' ? 'Branch Manager' : 'Review Executive'} • Scoped Outlet`,
        icon: Store,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    : isSingleMode
    ? {
        title: activeBusiness?.name || 'My Store',
        subtitle: activeBusiness?.city ? `${activeBusiness.city} • Single Store` : 'Single Store Operations',
        icon: Store,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    : currentLevel === 'brand'
    ? {
        title: activeBrand?.name || 'Brand Group',
        subtitle: 'Consolidated management',
        icon: Network,
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      }
    : currentLevel === 'business'
    ? {
        title: activeBusiness?.name || 'Business operations',
        subtitle: activeBusiness?.businessType === 'franchise' ? 'Franchise entity' : 'Company-owned operations',
        icon: Building2,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
      }
    : {
        title: activeBranch?.name || activeBusiness?.name || 'Branch operations',
        subtitle: 'Location-specific operations',
        icon: Store,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };

  return (
    <aside
      className={cn(
        'lg:relative lg:flex lg:flex-col lg:translate-x-0 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0 select-none font-sans',
        collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        'fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl lg:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
        <NavLink to="/dashboard" onClick={handleNavClick} className="flex items-center gap-2 overflow-hidden">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center gap-2">
              <img
                src="/loctimize-logo.jpg"
                alt="Loctimize"
                className="h-10 max-w-[170px] object-contain rounded"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs shrink-0">
              <img
                src="/loctimize-logo.jpg"
                alt="Loctimize"
                className="h-9 w-9 object-cover object-left"
              />
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
      <nav className="flex-1 space-y-3 p-3 overflow-y-auto">
        {/* Active Context Card (Image 2, 3, 4 style) */}
        {(!collapsed || mobileOpen) && (
          <div className="p-1">
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-2.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs shrink-0">
                <currentContextTitle.icon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-xs font-black text-slate-900 truncate leading-tight">
                  {currentContextTitle.title}
                </span>
                <span className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                  {currentContextTitle.subtitle}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section: Main Menu */}
        <div className="space-y-0.5">
          <div
            className={cn(
              'px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 font-mono',
              collapsed && !mobileOpen && 'text-center'
            )}
          >
            {collapsed && !mobileOpen ? '•' : isSingleMode ? 'STORE MENU' : `${currentLevel.toUpperCase()} NAVIGATION`}
          </div>

          {currentNavItems.map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150',
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
                    item.badge === 'AI' || item.badge === 'Copilot'
                      ? 'bg-pink-500/10 text-pink-600'
                      : item.badge === 'SEO'
                      ? 'bg-purple-500/10 text-purple-700'
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
                    'group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150',
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
                    Platform
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
