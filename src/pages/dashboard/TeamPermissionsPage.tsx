import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Building2,
  Store,
  Layers,
  Trash2,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHierarchy, type MembershipItem } from '@/context/HierarchyContext';
import { apiFetch } from '@/lib/api';

const roleLabels: Record<string, { title: string; color: string; desc: string }> = {
  super_admin: {
    title: 'Platform Super Admin',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'All client organizations and commercial operations'
  },
  brand_admin: {
    title: 'Brand Admin',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Consolidated data and permitted management of participating businesses'
  },
  business_admin: {
    title: 'Business Owner/Admin',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'All branches within their business'
  },
  branch_manager: {
    title: 'Branch Manager',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Assigned branch reviews, QR, reports and reply workflow'
  },
  review_executive: {
    title: 'Review Executive',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Assigned reviews and draft/reply permissions'
  },
  finance_manager: {
    title: 'Finance Manager',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Packages, invoices, payments and billing records'
  }
};

export function TeamPermissionsPage() {
  const {
    currentLevel,
    activeBrand,
    activeBusiness,
    activeBranch,
    brands,
    businesses,
    branches,
    memberships,
    refreshHierarchy
  } = useHierarchy();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('branch_manager');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeBrand?.id) setSelectedBrandId(activeBrand.id);
    if (activeBusiness?.id) setSelectedBusinessId(activeBusiness.id);
    if (activeBranch?.id) setSelectedBranchId(activeBranch.id);
  }, [activeBrand, activeBusiness, activeBranch]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRole) return;

    setIsSubmitting(true);
    try {
      await apiFetch('/api/hierarchy/memberships', {
        method: 'POST',
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          brandId: selectedBrandId || undefined,
          businessId: selectedBusinessId || undefined,
          branchId: selectedBranchId || undefined
        })
      });

      alert(`✓ Role ${roleLabels[inviteRole]?.title || inviteRole} assigned to ${inviteEmail}!`);
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      await refreshHierarchy();
    } catch (err: any) {
      alert('Failed to assign role: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Membership-Based RBAC</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Team & Permissions Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control member roles, brand oversight, business management, and branch-level execution.
          </p>
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Assign New Member</span>
        </Button>
      </div>

      {/* Franchise Data Isolation Info Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-0.5">
          <p className="font-bold">Franchise Privacy & Scoped Permission Guarantee</p>
          <p className="text-amber-800/90 leading-relaxed">
            Permissions are membership-based rather than hardcoded email domains. A franchise sharing your brand name only accesses its own branch reviews and analytics, keeping private customer data strictly isolated.
          </p>
        </div>
      </div>

      {/* Roles Hierarchy Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(roleLabels).map(([key, item]) => (
          <div key={key} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${item.color}`}>
                {item.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">
            Authorized Organization Members ({memberships.length})
          </h2>
        </div>

        {memberships.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <User className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No additional team members assigned yet</p>
            <p className="text-[11px] text-slate-400">Click 'Assign New Member' to invite branch managers or executives.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Scope Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {memberships.map((mem) => {
                  const roleCfg = roleLabels[mem.role] || {
                    title: mem.role,
                    color: 'bg-slate-50 text-slate-700 border-slate-200'
                  };

                  let scopeName = 'Organization Wide';
                  if (mem.branchId) {
                    const br = branches.find((b) => b.id === mem.branchId);
                    scopeName = `Branch: ${br?.name || mem.branchId}`;
                  } else if (mem.businessId) {
                    const bz = businesses.find((b) => b.id === mem.businessId);
                    scopeName = `Business: ${bz?.name || mem.businessId}`;
                  } else if (mem.brandId) {
                    const brd = brands.find((b) => b.id === mem.brandId);
                    scopeName = `Brand: ${brd?.name || mem.brandId}`;
                  }

                  return (
                    <tr key={mem.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs uppercase">
                            {mem.userName ? mem.userName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{mem.userName || 'Team Member'}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{mem.invitedEmail || mem.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${roleCfg.color}`}>
                          {roleCfg.title}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {scopeName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          title="Revoke access"
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsInviteOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-900 mb-1">Assign Team Member & Role</h3>
            <p className="text-xs text-slate-500 mb-4">Grant role-based access scoped to a Brand, Business, or Branch.</p>

            <form onSubmit={handleInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 bg-white"
                >
                  <option value="brand_admin">Brand Admin (All Participating Businesses)</option>
                  <option value="business_admin">Business Owner/Admin (All Branches in Business)</option>
                  <option value="branch_manager">Branch Manager (Single Branch Reviews & QR)</option>
                  <option value="review_executive">Review Executive (Draft & Reply)</option>
                  <option value="finance_manager">Finance Manager (Billing & Invoices)</option>
                </select>
              </div>

              {/* Target Entity Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Business Scope</label>
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 bg-white"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.businessType === 'franchise' ? 'Franchise' : 'Company-Owned'})
                    </option>
                  ))}
                </select>
              </div>

              {inviteRole === 'branch_manager' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Branch Scope</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 bg-white"
                  >
                    {branches
                      .filter((br) => !selectedBusinessId || br.businessId === selectedBusinessId)
                      .map((br) => (
                        <option key={br.id} value={br.id}>
                          {br.name} ({br.city || 'Location'})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {isSubmitting ? 'Assigning...' : 'Assign Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

