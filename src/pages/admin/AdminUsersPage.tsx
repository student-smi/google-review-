import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Store,
  Activity,
  Search,
  RefreshCw,
  Ban,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Crown,
  KeyRound,
  ArrowLeft,
  Clock,
  Sparkles,
  Cpu,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  Trash2,
  FileText,
  FileEdit,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, isAdminUser } from '@/lib/auth';

interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  googlePlaceId?: string | null;
  city?: string | null;
}

interface EnrichedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner';
  isBlocked: boolean;
  blockReason?: string | null;
  lastLoginAt?: number | null;
  createdAt?: number | null;
  businesses: BusinessItem[];
  businessCount: number;
  activeSessionCount: number;
  isOnline: boolean;
}

interface AdminOverviewStats {
  totalUsers: number;
  activeUsersNow: number;
  blockedUsers: number;
  totalBusinesses: number;
  totalReviews: number;
  totalScans: number;
  totalEnquiries?: number;
  newEnquiries?: number;
}

export interface EnquiryItem {
  id: string;
  company: string;
  contactPerson: string;
  mobile: string;
  email: string;
  locations: number;
  quantity: string;
  product: string;
  message?: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'archived';
  notes?: string | null;
  source: string;
  createdAt: number;
  updatedAt: number;
}

interface AdminTelemetry {
  ai: {
    callsToday: number;
    neuronsUsedToday: number;
    neuronsLimitDaily: number;
    neuronsRemainingToday: number;
    neuronsPercentUsed: number;
    tokensEstimatedToday: number;
    allTimeCalls: number;
    allTimeNeurons: number;
    allTimeTokens: number;
  };
  database: {
    sizeBytes: number;
    usedMb: number;
    limitMb: number;
    remainingMb: number;
    percentUsed: number;
    status: string;
    tableCounts: {
      users: number;
      businesses: number;
      reviews: number;
      scans: number;
      sessions: number;
    };
  };
}

export function AdminUsersPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [telemetry, setTelemetry] = useState<AdminTelemetry | null>(null);
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'blocked' | 'admins'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Active Admin View Tab: 'users' (Merchants) vs 'enquiries' (Business Leads)
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'enquiries'>('users');
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [enquiryFilter, setEnquiryFilter] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'converted' | 'archived'>('all');
  const [enquirySearch, setEnquirySearch] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // Reset pagination to page 1 on filter, search or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, pageSize]);

  // Block modal state
  const [blockingTarget, setBlockingTarget] = useState<EnrichedUser | null>(null);
  const [blockReason, setBlockReason] = useState('Violation of platform policy');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  // Status message notification
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 6000);
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, usersRes, enquiriesRes] = await Promise.all([
        apiFetch<{ success: boolean; stats: AdminOverviewStats; telemetry?: AdminTelemetry }>('/api/admin/overview'),
        apiFetch<{ success: boolean; users: EnrichedUser[] }>('/api/admin/users'),
        apiFetch<{ success: boolean; enquiries: EnquiryItem[] }>('/api/admin/enquiries').catch(() => ({ success: false, enquiries: [] }))
      ]);

      if (overviewRes?.stats) {
        setStats(overviewRes.stats);
        if (overviewRes.telemetry) {
          setTelemetry(overviewRes.telemetry);
        }
      }
      if (usersRes?.users) {
        setUsers(usersRes.users);
      }
      if (enquiriesRes?.enquiries) {
        setEnquiries(enquiriesRes.enquiries);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      showNotice(err?.message || 'Access denied or failed to load users.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEnquiryStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      showNotice(`Enquiry status updated to "${status}"`);
      await loadAdminData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to update enquiry status', 'error');
    }
  };

  const handleSaveEnquiryNotes = async (id: string) => {
    try {
      await apiFetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: tempNotes })
      });
      showNotice('Enquiry follow-up notes saved!');
      setEditingNotesId(null);
      await loadAdminData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to save notes', 'error');
    }
  };

  const handleDeleteEnquiry = async (id: string, company: string) => {
    if (!confirm(`Are you sure you want to permanently delete enquiry from "${company}"?`)) return;
    try {
      await apiFetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
      showNotice('Enquiry deleted successfully');
      await loadAdminData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to delete enquiry', 'error');
    }
  };

  useEffect(() => {
    // Check if user is logged in and is super admin
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isAdminUser()) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadAdminData();
  }, []);

  const handleConfirmBlock = async () => {
    if (!blockingTarget) return;
    setIsSubmittingBlock(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        `/api/admin/users/${blockingTarget.id}/block`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: blockReason })
        }
      );
      showNotice(res?.message || 'User suspended and logged out successfully!');
      setBlockingTarget(null);
      await loadAdminData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to block user', 'error');
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleUnblock = async (user: EnrichedUser) => {
    if (!confirm(`Are you sure you want to restore and unblock ${user.name} (${user.email})?`)) return;
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        `/api/admin/users/${user.id}/unblock`,
        { method: 'POST' }
      );
      showNotice(res?.message || 'User account unblocked successfully!');
      await loadAdminData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to unblock user', 'error');
    }
  };

  const handleToggleAdminRole = async (user: EnrichedUser) => {
    const nextRole = user.role === 'admin' ? 'owner' : 'admin';
    const actionName = nextRole === 'admin' ? 'promote to Super Admin' : 'demote to standard Store Owner';
    if (!confirm(`Are you sure you want to ${actionName} for ${user.name}?`)) return;

    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        `/api/admin/users/${user.id}/role`,
        {
          method: 'POST',
          body: JSON.stringify({ role: nextRole })
        }
      );
      showNotice(res?.message || `User role updated to ${nextRole}`);
      await loadAdminData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to update user role', 'error');
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.businesses.some((b) => b.name.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterMode === 'active') return !u.isBlocked;
    if (filterMode === 'blocked') return u.isBlocked;
    if (filterMode === 'admins') return u.role === 'admin';
    return true;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const formatTime = (ts?: number | null) => {
    if (!ts) return 'Never';
    const rawMs = ts < 10000000000 ? ts * 1000 : ts;
    const d = new Date(rawMs);
    const diff = Date.now() - d.getTime();
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredEnquiries = enquiries.filter((item) => {
    const q = enquirySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.company.toLowerCase().includes(q) ||
      item.contactPerson.toLowerCase().includes(q) ||
      item.mobile.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.product.toLowerCase().includes(q) ||
      (item.message && item.message.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (enquiryFilter !== 'all' && item.status !== enquiryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 sm:p-8 space-y-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Button>
            <Badge className="bg-indigo-600 text-white font-bold px-2.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
              <Crown className="w-3 h-3 text-amber-300" /> Super Admin
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
            User Control & Monitoring Center
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Live monitor registered merchants, active sessions, and suspend abusive accounts with instant logout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadAdminData}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2 bg-white text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="max-w-7xl mx-auto">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-xs animate-in fade-in ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card
          onClick={() => setActiveAdminTab('users')}
          className={`border-slate-200/80 bg-white shadow-xs cursor-pointer transition-all hover:border-indigo-400 ${
            activeAdminTab === 'users' ? 'ring-2 ring-indigo-600 border-indigo-500' : ''
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Users
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats?.totalUsers ?? users.length}
              </p>
              <span className="text-[11px] text-slate-400">All registered merchants</span>
            </div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Online Now
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {stats?.activeUsersNow ?? users.filter((u) => u.isOnline).length}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">🟢 Live active sessions</span>
            </div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Stores
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats?.totalBusinesses ?? 0}
              </p>
              <span className="text-[11px] text-slate-400">Google Places live</span>
            </div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Business Enquiries KPI Card */}
        <Card
          onClick={() => setActiveAdminTab('enquiries')}
          className={`border-slate-200/80 bg-white shadow-xs cursor-pointer transition-all hover:border-blue-400 hover:shadow-sm ${
            activeAdminTab === 'enquiries' ? 'ring-2 ring-blue-600 border-blue-500' : ''
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                Enquiries
                {(stats?.newEnquiries ?? enquiries.filter((e) => e.status === 'new').length) > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                )}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                {stats?.totalEnquiries ?? enquiries.length}
              </p>
              <span className="text-[11px] text-blue-600 font-medium">
                {stats?.newEnquiries ?? enquiries.filter((e) => e.status === 'new').length} New / Unhandled
              </span>
            </div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-xs col-span-2 md:col-span-1">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Suspended
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">
                {stats?.blockedUsers ?? users.filter((u) => u.isBlocked).length}
              </p>
              <span className="text-[11px] text-rose-500 font-medium">Access revoked</span>
            </div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure & Quota Telemetry (Workers AI & Cloudflare D1 Storage) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Widget 1: Cloudflare Workers AI Quota & Tokens */}
        <Card className="border-purple-200/80 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 dark:from-[#0f111a] dark:to-[#161926] shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-purple-100/70 dark:border-purple-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Cloudflare AI Quota & Tokens</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-purple-300 text-purple-700 bg-purple-100/60 font-mono">
                      Llama 3.2
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">
                    Daily 10,000 Neurons Free Quota • Resets at 00:00 UTC (5:30 AM IST)
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                🟢 Live Normal
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {telemetry?.ai.neuronsUsedToday?.toLocaleString() ?? 0}
                </span>
                <span className="text-sm font-bold text-slate-400 ml-1">
                  / {telemetry?.ai.neuronsLimitDaily?.toLocaleString() ?? '10,000'} Neurons
                </span>
              </div>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                {telemetry?.ai.neuronsPercentUsed ?? 0}% Used
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, telemetry?.ai.neuronsPercentUsed ?? 0))}%` }}
              />
            </div>

            {/* Sub-metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-purple-100/50 dark:border-purple-900/30 text-center">
              <div className="bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-purple-100/60">
                <span className="text-[10px] text-slate-500 font-medium block">Remaining Today</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600">
                  {telemetry?.ai.neuronsRemainingToday?.toLocaleString() ?? '10,000'}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-purple-100/60">
                <span className="text-[10px] text-slate-500 font-medium block">Tokens Processed</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  ~{telemetry?.ai.tokensEstimatedToday?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-purple-100/60">
                <span className="text-[10px] text-slate-500 font-medium block">Total AI Calls</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {telemetry?.ai.allTimeCalls?.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget 2: Cloudflare D1 Database Storage */}
        <Card className="border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 dark:from-[#0f111a] dark:to-[#161926] shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-blue-100/70 dark:border-blue-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Cloudflare D1 Storage</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-blue-300 text-blue-700 bg-blue-100/60 font-mono">
                      reviewqr-db
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">
                    Live database disk footprint & capacity
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                🟢 Healthy ({telemetry?.database.limitMb ?? 500} MB Plan)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {telemetry?.database.usedMb ?? 3.12} MB
                </span>
                <span className="text-sm font-bold text-slate-400 ml-1">
                  / {telemetry?.database.limitMb ?? 500} MB
                </span>
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                {telemetry?.database.percentUsed ?? 0.62}% Used
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-sky-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, telemetry?.database.percentUsed ?? 0.62))}%` }}
              />
            </div>

            {/* Sub-metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-blue-100/50 dark:border-blue-900/30 text-center">
              <div className="bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-blue-100/60">
                <span className="text-[10px] text-slate-500 font-medium block">Available Free</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600">
                  {telemetry?.database.remainingMb ?? 496.88} MB
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-blue-100/60">
                <span className="text-[10px] text-slate-500 font-medium block">Total Reviews</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {stats?.totalReviews?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-blue-100/60">
                <span className="text-[10px] text-slate-500 font-medium block">Total QR Scans</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {stats?.totalScans?.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Section Switcher: Users vs Enquiries */}
      <div className="max-w-7xl mx-auto flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Merchants ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('enquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeAdminTab === 'enquiries'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Business Leads & Enquiries ({enquiries.length})</span>
          {enquiries.filter((e) => e.status === 'new').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-amber-400 text-slate-900 shadow-2xs">
              {enquiries.filter((e) => e.status === 'new').length} New
            </span>
          )}
        </button>
      </div>

      {activeAdminTab === 'users' ? (
      /* Main Users Table Section */
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name, email, or store name..."
              className="pl-9 h-10 text-sm border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: `All Users (${users.length})` },
                { id: 'active', label: `Active (${users.filter((u) => !u.isBlocked).length})` },
                { id: 'blocked', label: `Blocked (${users.filter((u) => u.isBlocked).length})` },
                { id: 'admins', label: `Admins (${users.filter((u) => u.role === 'admin').length})` }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterMode === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Stores / Locations</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Loading user directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const initials =
                      user.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'U';

                    const isCurrentAdmin = currentUser?.id === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          user.isBlocked ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* User Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-slate-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                                <span>{user.name}</span>
                                {user.role === 'admin' && (
                                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] px-1.5 py-0 font-bold flex items-center gap-0.5">
                                    <Crown className="w-2.5 h-2.5 text-indigo-600" /> Admin
                                  </Badge>
                                )}
                                {isCurrentAdmin && (
                                  <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                                )}
                              </div>
                              <span className="text-slate-500 font-mono text-[11px]">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stores / Businesses */}
                        <td className="py-3 px-4">
                          {user.businesses.length === 0 ? (
                            <span className="text-slate-400 italic">No stores yet</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {user.businesses.map((b) => (
                                <Badge
                                  key={b.id}
                                  variant="outline"
                                  className="bg-slate-50 border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1"
                                >
                                  <Store className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>{b.name}</span>
                                  {b.city && <span className="text-slate-400">({b.city})</span>}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Last Active */}
                        <td className="py-3 px-4 text-slate-600">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatTime(user.lastLoginAt)}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Joined {formatTime(user.createdAt)}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {user.isBlocked ? (
                            <div className="space-y-0.5">
                              <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[11px] font-bold flex items-center gap-1 w-fit">
                                <Ban className="w-3 h-3 text-rose-600" /> Suspended
                              </Badge>
                              {user.blockReason && (
                                <p className="text-[10px] text-rose-600 max-w-xs truncate" title={user.blockReason}>
                                  {user.blockReason}
                                </p>
                              )}
                            </div>
                          ) : user.isOnline ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] font-bold flex items-center gap-1 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online Now
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-medium w-fit">
                              Active
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {user.isBlocked ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnblock(user)}
                                className="h-7 px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isCurrentAdmin || user.email === 'smitpanchal734@gmail.com' || user.email === 'info.upmark.in@gmail.com'}
                                onClick={() => {
                                  setBlockingTarget(user);
                                  setBlockReason('Violation of platform policy');
                                }}
                                className="h-7 px-2.5 text-xs text-rose-700 border-rose-300 hover:bg-rose-50 font-bold disabled:opacity-30"
                              >
                                <Ban className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                Block User
                              </Button>
                            )}

                            {/* Toggle Admin Role */}
                            {user.email !== 'smitpanchal734@gmail.com' && user.email !== 'info.upmark.in@gmail.com' && !isCurrentAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleAdminRole(user)}
                                className="h-7 px-2 text-[11px] text-slate-500 hover:text-indigo-600"
                                title={user.role === 'admin' ? 'Demote to Owner' : 'Promote to Admin'}
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200/80 bg-slate-50/60">
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 font-medium">
                <span>
                  Showing <strong className="text-slate-900 font-bold">{startIndex + 1}</strong> to{' '}
                  <strong className="text-slate-900 font-bold">{endIndex}</strong> of{' '}
                  <strong className="text-slate-900 font-bold">{filteredUsers.length}</strong> users
                </span>

                <span className="text-slate-300">|</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    aria-label="Items per page"
                    className="h-7 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page number buttons */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      if (totalPages <= 5) return true;
                      if (pageNum === 1 || pageNum === totalPages) return true;
                      return Math.abs(pageNum - safeCurrentPage) <= 1;
                    })
                    .map((pageNum, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && pageNum - prev > 1;

                      return (
                        <div key={pageNum} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-1 text-slate-400 select-none text-xs">...</span>
                          )}
                          <Button
                            size="sm"
                            variant={safeCurrentPage === pageNum ? 'primary' : 'outline'}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 min-w-[32px] px-2 text-xs font-bold transition-all cursor-pointer ${
                              safeCurrentPage === pageNum
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      ) : (
        /* Main Enquiries Management Section */
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
                placeholder="Search enquiry by company, contact person, mobile, email, product..."
                className="pl-9 h-10 text-sm border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'all', label: `All (${enquiries.length})` },
                  { id: 'new', label: `New (${enquiries.filter((e) => e.status === 'new').length})` },
                  { id: 'contacted', label: `Contacted (${enquiries.filter((e) => e.status === 'contacted').length})` },
                  { id: 'qualified', label: `Qualified (${enquiries.filter((e) => e.status === 'qualified').length})` },
                  { id: 'converted', label: `Converted (${enquiries.filter((e) => e.status === 'converted').length})` },
                  { id: 'archived', label: `Archived (${enquiries.filter((e) => e.status === 'archived').length})` }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEnquiryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    enquiryFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enquiries Table Card */}
          <Card className="border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Company & Contact</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Requirement / Volume</th>
                    <th className="py-3 px-4">Customer Request & Notes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Loading enquiries...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEnquiries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Building2 className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">No enquiries found</p>
                          <span className="text-[11px] text-slate-400">
                            {enquirySearch || enquiryFilter !== 'all'
                              ? 'Try adjusting your search criteria or filter pills'
                              : 'Incoming enquiries from the landing page will appear here immediately.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEnquiries.map((item) => {
                      const cleanPhone = item.mobile.replace(/[^0-9]/g, '');
                      const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;
                      const waText = encodeURIComponent(`Hi ${item.contactPerson}, thank you for your enquiry on Loctimize regarding ${item.product}!`);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Company & Contact */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{item.company}</span>
                              {item.status === 'new' && (
                                <span className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100 shrink-0" title="New unhandled lead" />
                              )}
                            </div>
                            <div className="text-slate-600 font-medium text-xs mt-0.5">
                              {item.contactPerson}
                            </div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium text-slate-600 border-slate-200 bg-slate-50">
                                🏢 {item.locations} {item.locations === 1 ? 'Location' : 'Locations'}
                              </Badge>
                            </div>
                          </td>

                          {/* Contact Info (WhatsApp, Call, Email) */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-800 font-semibold">{item.mobile}</span>
                                <a
                                  href={`https://wa.me/${waNumber}?text=${waText}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-6 px-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                                  <span>WhatsApp</span>
                                </a>
                                <a
                                  href={`tel:${item.mobile}`}
                                  className="h-6 w-6 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition inline-flex items-center justify-center text-[11px] cursor-pointer"
                                  title="Call number"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline truncate max-w-[180px]">
                                  {item.email}
                                </a>
                              </div>
                            </div>
                          </td>

                          {/* Requirement / Plan */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{item.product}</div>
                            <div className="mt-1">
                              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[10px] py-0 px-1.5">
                                Qty: {item.quantity}
                              </Badge>
                            </div>
                          </td>

                          {/* Message / Notes */}
                          <td className="py-3 px-4 max-w-[260px]">
                            {item.message ? (
                              <p className="text-slate-700 text-xs italic bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2" title={item.message}>
                                "{item.message}"
                              </p>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No specific requirements</span>
                            )}

                            {/* Internal Follow-up Notes */}
                            {editingNotesId === item.id ? (
                              <div className="mt-2 space-y-1.5">
                                <textarea
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  placeholder="Add follow-up notes (e.g. called owner, quote sent)..."
                                  className="w-full text-xs p-1.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 h-16 bg-white"
                                />
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleSaveEnquiryNotes(item.id)}
                                    className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingNotesId(null)}
                                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                                <span className="truncate max-w-[180px]">
                                  {item.notes ? `📝 ${item.notes}` : 'No notes'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNotesId(item.id);
                                    setTempNotes(item.notes || '');
                                  }}
                                  className="text-blue-600 hover:underline shrink-0 ml-1 font-semibold cursor-pointer"
                                >
                                  {item.notes ? 'Edit' : '+ Note'}
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Status Dropdown */}
                          <td className="py-3 px-4">
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateEnquiryStatus(item.id, e.target.value)}
                              className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-all cursor-pointer outline-none ${
                                item.status === 'new'
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : item.status === 'contacted'
                                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                                  : item.status === 'qualified'
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                  : item.status === 'converted'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}
                            >
                              <option value="new">🔵 New</option>
                              <option value="contacted">🟣 Contacted</option>
                              <option value="qualified">🔷 Qualified</option>
                              <option value="converted">🟢 Converted</option>
                              <option value="archived">⚪ Archived</option>
                            </select>
                          </td>

                          {/* Received Date */}
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            <div className="font-semibold text-slate-700">{formatTime(item.createdAt)}</div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.createdAt < 10000000000 ? item.createdAt * 1000 : item.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteEnquiry(item.id, item.company)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Enquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {blockingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Suspend & Block Account: {blockingTarget.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Email: <span className="font-mono text-slate-700">{blockingTarget.email}</span>
                </p>
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Blocking will <strong>immediately terminate all active sessions</strong> and revoke dashboard access.
                  </span>
                </div>
              </div>

              {/* Block Reason Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Reason for Suspension:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Violation of platform terms',
                    'Suspicious spam activity',
                    'Payment / billing overdue',
                    'Security investigation'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBlockReason(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        blockReason === preset
                          ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Custom suspension reason..."
                  className="mt-2 text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlockingTarget(null)}
                  disabled={isSubmittingBlock}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmBlock}
                  disabled={isSubmittingBlock}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 shadow-sm"
                >
                  <Ban className="w-3.5 h-3.5" />
                  {isSubmittingBlock ? 'Blocking...' : 'Confirm Suspension'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

