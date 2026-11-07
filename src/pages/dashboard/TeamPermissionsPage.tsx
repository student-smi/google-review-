import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Crown,
  Lock,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Sparkles
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
  const navigate = useNavigate();
  const {
    currentLevel,
    activeBrand,
    activeBusiness,
    activeBranch,
    brands,
    businesses,
    branches,
    memberships,
    roles,
    refreshHierarchy
  } = useHierarchy();

  // Guard: Executive cannot manage organization team members
  if (roles.isExecutive) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Restricted Access</h2>
        <p className="text-xs text-slate-500">
          You are signed in as an Executive for <strong className="text-slate-800">{activeBranch?.name || 'your assigned branch'}</strong>. Team & permission settings are restricted to organization owners.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer">
          Return to Branch Dashboard
        </Button>
      </div>
    );
  }

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteRole, setInviteRole] = useState('branch_manager');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State (Shows generated credentials to copy)
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password?: string;
    role: string;
    loginUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset Password Modal State
  const [resetModalMember, setResetModalMember] = useState<MembershipItem | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (activeBrand?.id) setSelectedBrandId(activeBrand.id);
    if (activeBusiness?.id) setSelectedBusinessId(activeBusiness.id);
    if (activeBranch?.id) setSelectedBranchId(activeBranch.id);
  }, [activeBrand, activeBusiness, activeBranch]);

  // Quick Random Password Generator
  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = 'Pass@';
    for (let i = 0; i < 5; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInvitePassword(pass);
    setShowPassword(true);
  };

  // Submit Role & Password Assignment
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRole) return;

    if (!invitePassword.trim() || invitePassword.trim().length < 6) {
      alert('Please enter a password of at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/api/hierarchy/memberships', {
        method: 'POST',
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          password: invitePassword.trim(),
          role: inviteRole,
          brandId: selectedBrandId || undefined,
          businessId: selectedBusinessId || undefined,
          branchId: selectedBranchId || undefined
        })
      });

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://loctimize.in';
      setCreatedCredentials({
        name: inviteName.trim() || inviteEmail.split('@')[0],
        email: inviteEmail.trim().toLowerCase(),
        password: invitePassword.trim(),
        role: roleLabels[inviteRole]?.title || inviteRole,
        loginUrl: `${origin}/login`
      });

      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      await refreshHierarchy();
    } catch (err: any) {
      alert('Failed to assign team member: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Credentials to Clipboard
  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `*ReviewQR Team Member Login Details*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Name: ${createdCredentials.name}\n📧 Email: ${createdCredentials.email}\n🔑 Password: ${createdCredentials.password}\n🛡️ Assigned Role: ${createdCredentials.role}\n🌐 Login URL: ${createdCredentials.loginUrl}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nYou can now log in separately to manage reviews & QR funnels!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Revoke Access
  const handleRevoke = async (memberId: string, memberEmail?: string | null) => {
    if (!confirm(`Are you sure you want to revoke access for ${memberEmail || 'this team member'}?`)) return;
    try {
      await apiFetch(`/api/hierarchy/memberships/${memberId}`, { method: 'DELETE' });
      await refreshHierarchy();
    } catch (err: any) {
      alert('Failed to revoke membership: ' + (err.message || 'Server error'));
    }
  };

  // Submit Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalMember || !resetPasswordValue.trim() || resetPasswordValue.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setIsResetting(true);
    try {
      await apiFetch(`/api/hierarchy/memberships/${resetModalMember.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: resetPasswordValue.trim() })
      });
      alert(`✓ Password updated for ${resetModalMember.invitedEmail || 'team member'}!`);
      setResetModalMember(null);
      setResetPasswordValue('');
    } catch (err: any) {
      alert('Failed to reset password: ' + (err.message || 'Server error'));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Membership-Based RBAC & Dedicated Login</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Team & Permissions Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Assign team members with email & login passwords to manage specific branches or brand operations.
          </p>
        </div>

        <Button
          onClick={() => {
            setIsInviteOpen(true);
            setInvitePassword('');
            handleGenerateRandomPassword();
          }}
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
          <span className="font-extrabold block">Dedicated Staff Login & Scoped Access:</span>
          <p className="text-amber-800 leading-relaxed">
            Team members can log in separately using their assigned Email & Password at{' '}
            <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-amber-950">
              /login
            </code>
            . A Branch Manager will only see reviews, keywords, and QR codes for their assigned location.
          </p>
        </div>
      </div>

      {/* Role Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(roleLabels).slice(1, 4).map(([roleKey, role]) => (
          <div key={roleKey} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${role.color}`}>
                {role.title}
              </span>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
          </div>
        ))}
      </div>

      {/* Memberships Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Authorized Team Members & Logins</h2>
            <p className="text-xs text-slate-500">List of users permitted to log in and manage your platform</p>
          </div>
          <Badge variant="outline" className="text-xs font-bold">
            {memberships.length} Active {memberships.length === 1 ? 'Member' : 'Members'}
          </Badge>
        </div>

        {memberships.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No external team members assigned yet. Click "Assign New Member" above to invite your branch manager or review executive.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Scope (Business / Branch)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberships.map((mem) => {
                  const roleCfg = roleLabels[mem.role] || {
                    title: mem.role,
                    color: 'bg-slate-50 text-slate-700 border-slate-200',
                    desc: ''
                  };

                  let scopeName = 'Entire Brand';
                  if (mem.branchId) {
                    const matchedBranch = branches.find((br) => br.id === mem.branchId);
                    scopeName = matchedBranch ? `🏪 ${matchedBranch.name}` : `Branch (${mem.branchId.slice(0, 8)}...)`;
                  } else if (mem.businessId) {
                    const matchedBiz = businesses.find((b) => b.id === mem.businessId);
                    scopeName = matchedBiz ? `🏢 ${matchedBiz.name}` : `Business (${mem.businessId.slice(0, 8)}...)`;
                  }

                  return (
                    <tr key={mem.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {mem.invitedEmail?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block truncate max-w-[160px]">
                              {mem.invitedEmail || mem.userId}
                            </span>
                            <span className="text-[10px] text-slate-400">Can log in via /login</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${roleCfg.color}`}>
                          {roleCfg.title}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-bold">
                        {scopeName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active Login</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalMember(mem);
                              setResetPasswordValue('');
                              setShowResetPassword(false);
                            }}
                            title="Reset member login password"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(mem.id, mem.invitedEmail)}
                            title="Revoke access"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. ASSIGN MEMBER & ROLE MODAL (WITH LOGIN PASSWORD) */}
      {/* ========================================================= */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsInviteOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-900 mb-1">Assign Team Member & Role</h3>
            <p className="text-xs text-slate-500 mb-4">Grant role-based access with email and dedicated login password.</p>

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
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* Login Password Field (User's Core Requirement) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Login Password *</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>🎲 Generate Random</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Set login password (min 6 characters)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  The team member will log in with this email & password at <strong className="text-slate-600">loctimize.in/login</strong>.
                </p>
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
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">
                  {isSubmitting ? 'Assigning...' : 'Assign Role & Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SUCCESS CREDENTIALS POPUP (COPY FOR WHATSAPP/EMAIL) */}
      {/* ========================================================= */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setCreatedCredentials(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Team Member Account Ready!</h3>
                <p className="text-xs text-slate-500">Share these login credentials with your team member.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-sans font-semibold">Staff Name:</span>
                <span className="font-bold text-slate-900">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-sans font-semibold">Login Email:</span>
                <span className="font-bold text-blue-600">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-sans font-semibold">Password:</span>
                <span className="font-bold text-amber-600">{createdCredentials.password}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-sans font-semibold">Role:</span>
                <span className="font-bold text-slate-900">{createdCredentials.role}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500 font-sans font-semibold">Login URL:</span>
                <span className="font-bold text-indigo-600">{createdCredentials.loginUrl}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleCopyCredentials}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy for WhatsApp / Email'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreatedCredentials(null)}
                className="text-xs font-bold rounded-xl"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RESET PASSWORD MODAL */}
      {/* ========================================================= */}
      {resetModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setResetModalMember(null)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">Reset Member Password</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter a new login password for <strong className="text-slate-800">{resetModalMember.invitedEmail}</strong>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-xs outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setResetModalMember(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isResetting || !resetPasswordValue.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isResetting ? 'Saving...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
