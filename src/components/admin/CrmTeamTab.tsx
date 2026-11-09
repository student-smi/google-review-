import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Crown,
  Briefcase,
  Headphones,
  Building,
  KeyRound,
  Users,
  Search,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  assignedLeadsCount: number;
  createdAt: number;
  lastLoginAt?: number | null;
}

interface CrmTeamTabProps {
  team: TeamMemberItem[];
  onRefresh: () => Promise<void>;
  showNotice: (text: string, type?: 'success' | 'error') => void;
}

export const CrmTeamTab: React.FC<CrmTeamTabProps> = ({
  team,
  onRefresh,
  showNotice
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const ROLE_CONFIGS = [
    {
      id: 'admin',
      label: 'Super Admin',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Crown,
      description: 'Complete unrestricted platform ownership, billing, user deletion, and settings.'
    },
    {
      id: 'manager',
      label: 'Sales & Ops Manager',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Briefcase,
      description: 'Oversee all incoming leads, assign leads to executives, view customer 360 & invoices.'
    },
    {
      id: 'executive',
      label: 'Sales / Support Executive',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Headphones,
      description: 'Manage assigned leads, schedule follow-ups, update lead stages & log call notes.'
    },
    {
      id: 'agency',
      label: 'Agency (B2B Partner)',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Building,
      description: 'Multi-client partner access to onboard and manage sub-merchant review standees.'
    },
    {
      id: 'owner',
      label: 'Store Merchant (Customer)',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Users,
      description: 'Standard single store/business dashboard access.'
    }
  ];

  const filteredTeam = team.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUpdateRole = async (user: TeamMemberItem, newRole: string) => {
    if (user.email === 'smitpanchal734@gmail.com') {
      showNotice('Primary Super Administrator role cannot be changed', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to change ${user.name}'s role to ${newRole.toUpperCase()}?`)) return;

    try {
      await apiFetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: newRole })
      });
      showNotice(`Role updated to ${newRole.toUpperCase()} successfully!`);
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to update role', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Permission Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {ROLE_CONFIGS.slice(0, 4).map((r) => {
          const Icon = r.icon;
          const count = team.filter((m) => m.role === r.id).length;
          return (
            <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black ${r.badge}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {r.label}
                </span>
                <span className="font-mono font-bold text-xs text-slate-500">{count} Active</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{r.description}</p>
            </div>
          );
        })}
      </div>

      {/* Team Table Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team member by name or email..."
            className="pl-9 h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter team members by role"
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Roles ({team.length})</option>
            <option value="admin">Super Admin</option>
            <option value="manager">Manager</option>
            <option value="executive">Executive</option>
            <option value="agency">Agency (B2B)</option>
            <option value="owner">Standard Merchant</option>
          </select>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Member Name & Email</th>
                <th className="py-3 px-4">Current Platform Role</th>
                <th className="py-3 px-4 text-center">Assigned CRM Leads</th>
                <th className="py-3 px-4">Member Since</th>
                <th className="py-3 px-4 text-right">Change Role (RBAC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeam.map((m) => {
                const isSuperAdmin = m.email === 'smitpanchal734@gmail.com';
                const currentRoleConfig = ROLE_CONFIGS.find((r) => r.id === m.role) || ROLE_CONFIGS[4];
                const Icon = currentRoleConfig.icon;

                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Member Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        {isSuperAdmin && (
                          <Badge className="bg-purple-600 text-white border-none text-[10px] font-black h-4 px-1.5">
                            Primary Super Admin
                          </Badge>
                        )}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">{m.email}</div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${currentRoleConfig.badge}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {currentRoleConfig.label}
                      </span>
                    </td>

                    {/* Assigned Leads Workload */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full font-bold font-mono text-xs bg-slate-100 text-slate-700">
                        {m.assignedLeadsCount} Leads
                      </span>
                    </td>

                    {/* Member Since */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(m.createdAt * (m.createdAt < 10000000000 ? 1000 : 1)).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Role Select Dropdown */}
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m, e.target.value)}
                          aria-label={`Change role for ${m.name}`}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="manager">Manager</option>
                          <option value="executive">Sales Executive</option>
                          <option value="agency">Agency (B2B)</option>
                          <option value="owner">Store Merchant</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

