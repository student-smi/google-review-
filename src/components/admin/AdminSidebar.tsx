import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Receipt,
  ShieldCheck,
  KeyRound,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Database,
  Cpu,
  LogOut,
  ExternalLink,
  Crown,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logoutApi } from '@/lib/auth';

export type AdminTabType = 'leads' | 'customers' | 'billing' | 'team' | 'users';

interface AdminSidebarProps {
  activeTab: AdminTabType;
  onSelectTab: (tab: AdminTabType) => void;
  leadsCount: number;
  newLeadsCount: number;
  customersCount: number;
  invoicesCount: number;
  teamCount: number;
  usersCount: number;
  dbUsedMb?: number;
  neuronsPercent?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  leadsCount,
  newLeadsCount,
  customersCount,
  invoicesCount,
  teamCount,
  usersCount,
  dbUsedMb = 3.1,
  neuronsPercent = 0,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logoutApi();
    } catch {}
    navigate('/login', { replace: true });
  };

  const navGroups = [
    {
      groupLabel: 'CRM & SALES',
      items: [
        {
          id: 'leads' as AdminTabType,
          label: 'Leads CRM Pipeline',
          icon: Building2,
          count: leadsCount,
          badge: newLeadsCount > 0 ? `${newLeadsCount} New` : null,
          badgeColor: 'bg-amber-400 text-slate-900 font-black'
        },
        {
          id: 'customers' as AdminTabType,
          label: 'Customer 360',
          icon: Users,
          count: customersCount,
          badge: null,
          badgeColor: ''
        }
      ]
    },
    {
      groupLabel: 'FINANCE & BILLING',
      items: [
        {
          id: 'billing' as AdminTabType,
          label: 'Billing & Receipts',
          icon: Receipt,
          count: invoicesCount,
          badge: null,
          badgeColor: ''
        }
      ]
    },
    {
      groupLabel: 'PLATFORM GOVERNANCE',
      items: [
        {
          id: 'team' as AdminTabType,
          label: 'Roles & RBAC',
          icon: ShieldCheck,
          count: teamCount,
          badge: 'Staff',
          badgeColor: 'bg-purple-100 text-purple-700'
        },
        {
          id: 'users' as AdminTabType,
          label: 'Merchants Access',
          icon: KeyRound,
          count: usersCount,
          badge: null,
          badgeColor: ''
        }
      ]
    }
  ];

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-r border-slate-800 shadow-xl lg:shadow-none ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${collapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Brand & Admin Profile Header */}
      <div className="flex h-18 items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
            L
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-white">LOCTIMIZE</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 truncate">
                Super Admin Center
              </p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Super Admin Badge Strip */}
      {!collapsed && (
        <div className="mx-3 mt-3 p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-800/40 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-white text-[11px] truncate">smitpanchal734@gmail.com</p>
              <p className="text-[10px] text-purple-300 font-medium">Primary Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.groupLabel} className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {group.groupLabel}
              </span>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <span
                          className={`font-mono text-[11px] ${
                            isActive ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Cloudflare Telemetry & Storage Pill */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Cloudflare D1</span>
            </span>
            <span className="text-emerald-400 font-mono font-semibold">{dbUsedMb.toFixed(1)} MB / 500 MB</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Workers AI</span>
            </span>
            <span className="text-purple-300 font-mono font-semibold">{neuronsPercent}% Quota</span>
          </div>
        </div>
      )}

      {/* Bottom Shortcuts & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Switch to Merchant Dashboard"
        >
          <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" />
          {!collapsed && <span>Store Dashboard</span>}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
          title="Sign out of Admin Session"
        >
          <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
