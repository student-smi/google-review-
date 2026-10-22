import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  MessageSquareQuote,
  TrendingUp,
  MapPin,
  Settings,
  Palette,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'QR Studio', to: '/dashboard/qr', icon: QrCode },
    { label: 'Reviews & Replies', to: '/dashboard/replies', icon: MessageSquareQuote },
    { label: 'Analytics', to: '/dashboard/analytics', icon: TrendingUp },
    { label: 'Local SEO', to: '/dashboard/local-seo', icon: MapPin },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings }
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0 select-none z-20',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/70">
        <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm glow-indigo shrink-0">
            <span className="text-base tracking-tighter">RQ</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight text-foreground truncate">
                Review<span className="text-accent">QR</span>
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                India Local SaaS
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        <div className={cn('px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80', collapsed && 'text-center')}>
          {collapsed ? '•' : 'Main Menu'}
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-105" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-border/60">
          <div className={cn('px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80', collapsed && 'text-center')}>
            {collapsed ? '•' : 'Developer & Design'}
          </div>

          <NavLink
            to="/design"
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-accent/15 text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <Palette className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-105 text-accent" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="truncate">Style Guide</span>
                <span className="text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded font-mono">/design</span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Free Tier Status & Compliance Pill */}
      <div className="p-3 border-t border-border/60">
        {!collapsed ? (
          <div className="rounded-xl border border-border/80 bg-secondary/40 p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-foreground">Cloudflare Free</span>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              100% policy-compliant. Real reviews only.
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
