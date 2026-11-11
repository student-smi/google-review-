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
  ArrowUpRight,
  Shield,
  Receipt,
  Menu
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, isAdminUser } from '@/lib/auth';
import { CrmLeadsTab, LeadItem } from '@/components/admin/CrmLeadsTab';
import { CrmCustomersTab, CustomerItem } from '@/components/admin/CrmCustomersTab';
import { CrmPlansTab, PlanItem } from '@/components/admin/CrmPlansTab';
import { CrmBillingTab } from '@/components/admin/CrmBillingTab';
import { CrmTeamTab, TeamMemberItem } from '@/components/admin/CrmTeamTab';
import { InvoiceData } from '@/components/admin/PaymentReceiptModal';
import { AdminSidebar, AdminTabType } from '@/components/admin/AdminSidebar';
import { TablePagination } from '@/components/admin/TablePagination';

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

  // Active CRM & Admin View Tabs: 'leads' | 'customers' | 'billing' | 'team' | 'users'
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabType>('leads');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crmLeads, setCrmLeads] = useState<LeadItem[]>([]);
  const [crmCustomers, setCrmCustomers] = useState<CustomerItem[]>([]);
  const [crmPlans, setCrmPlans] = useState<PlanItem[]>([]);
  const [crmInvoices, setCrmInvoices] = useState<InvoiceData[]>([]);
  const [crmTeam, setCrmTeam] = useState<TeamMemberItem[]>([]);
  const [preSelectedCustomer, setPreSelectedCustomer] = useState<CustomerItem | null>(null);

  // Reset pagination to page 1 on filter, search or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, pageSize]);

  // Block modal state
  const [blockingTarget, setBlockingTarget] = useState<EnrichedUser | null>(null);
  const [blockReason, setBlockReason] = useState('Violation of platform policy');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  // Delete modal state
  const [deletingTarget, setDeletingTarget] = useState<EnrichedUser | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Status message notification
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 6000);
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, usersRes, leadsRes, customersRes, plansRes, invoicesRes, teamRes] = await Promise.all([
        apiFetch<{ success: boolean; stats: AdminOverviewStats; telemetry?: AdminTelemetry }>('/api/admin/overview'),
        apiFetch<{ success: boolean; users: EnrichedUser[] }>('/api/admin/users'),
        apiFetch<{ success: boolean; leads: LeadItem[] }>('/api/admin/crm/leads').catch(() => ({ success: false, leads: [] })),
        apiFetch<{ success: boolean; customers: CustomerItem[] }>('/api/admin/crm/customers').catch(() => ({ success: false, customers: [] })),
        apiFetch<{ success: boolean; plans: PlanItem[] }>('/api/admin/crm/plans').catch(() => ({ success: false, plans: [] })),
        apiFetch<{ success: boolean; invoices: InvoiceData[] }>('/api/admin/crm/invoices').catch(() => ({ success: false, invoices: [] })),
        apiFetch<{ success: boolean; team: TeamMemberItem[] }>('/api/admin/crm/team').catch(() => ({ success: false, team: [] }))
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
      if (leadsRes?.leads) {
        setCrmLeads(leadsRes.leads);
      }
      if (customersRes?.customers) {
        setCrmCustomers(customersRes.customers);
      }
      if (plansRes?.plans) {
        setCrmPlans(plansRes.plans);
      }
      if (invoicesRes?.invoices) {
        setCrmInvoices(invoicesRes.invoices);
      }
      if (teamRes?.team) {
        setCrmTeam(teamRes.team);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      showNotice(err?.message || 'Access denied or failed to load CRM data.', 'error');
    } finally {
      setIsLoading(false);
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

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setIsSubmittingDelete(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        `/api/admin/users/${deletingTarget.id}`,
        { method: 'DELETE' }
      );
      showNotice(res?.message || 'User profile deleted successfully!');
      setDeletingTarget(null);
      setConfirmDeleteText('');
      await loadAdminData();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to delete user profile', 'error');
    } finally {
      setIsSubmittingDelete(false);
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



  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeAdminTab}
        onSelectTab={(tab) => setActiveAdminTab(tab)}
        leadsCount={crmLeads.length}
        newLeadsCount={crmLeads.filter((l) => (l.stage || l.status) === 'new').length}
        customersCount={crmCustomers.length}
        plansCount={crmPlans.length}
        invoicesCount={crmInvoices.length}
        teamCount={crmTeam.length}
        usersCount={users.length}
        dbUsedMb={telemetry?.database.usedMb ?? 3.1}
        neuronsPercent={telemetry?.ai.neuronsPercentUsed ?? 0}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Right Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-15 sm:h-16 px-3 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 z-30 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 shadow-2xs cursor-pointer"
              title="Open Navigation"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-400">
                <span>Admin</span>
                <span className="text-slate-300">/</span>
                <span className="text-indigo-600 truncate font-semibold">
                  {activeAdminTab === 'leads' && 'CRM Pipeline'}
                  {activeAdminTab === 'customers' && 'Customer 360'}
                  {activeAdminTab === 'plans' && 'Plan Management'}
                  {activeAdminTab === 'billing' && 'Billing'}
                  {activeAdminTab === 'team' && 'Roles & RBAC'}
                  {activeAdminTab === 'users' && 'Merchants'}
                </span>
              </div>
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
                {activeAdminTab === 'leads' && (
                  <>
                    <span className="hidden sm:inline">Leads CRM & Follow-Up Pipeline</span>
                    <span className="sm:hidden">Leads CRM Pipeline</span>
                  </>
                )}
                {activeAdminTab === 'customers' && (
                  <>
                    <span className="hidden sm:inline">Customer 360 & Outlets Directory</span>
                    <span className="sm:hidden">Customer 360 Outlets</span>
                  </>
                )}
                {activeAdminTab === 'plans' && (
                  <>
                    <span className="hidden sm:inline">Subscription Plans & Hardware Packages</span>
                    <span className="sm:hidden">Plan Management</span>
                  </>
                )}
                {activeAdminTab === 'billing' && (
                  <>
                    <span className="hidden sm:inline">Financial Ledger & Tax Receipts</span>
                    <span className="sm:hidden">Billing & Receipts</span>
                  </>
                )}
                {activeAdminTab === 'team' && (
                  <>
                    <span className="hidden sm:inline">Roles & Access Control (RBAC)</span>
                    <span className="sm:hidden">Roles & RBAC</span>
                  </>
                )}
                {activeAdminTab === 'users' && (
                  <>
                    <span className="hidden sm:inline">Merchant Accounts & Access Monitoring</span>
                    <span className="sm:hidden">Merchant Accounts</span>
                  </>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              onClick={loadAdminData}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="gap-1.5 bg-white text-slate-700 shadow-xs hover:bg-slate-50 text-xs h-9 px-2.5 sm:px-3 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-1.5 text-xs text-slate-700 hover:text-slate-900 h-9 px-3 hidden md:flex cursor-pointer bg-white shadow-xs border-slate-200"
              title="Open Merchant Store Application"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Store App</span>
            </Button>
            <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                S
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-800 leading-none">Super Admin</span>
                <span className="text-[9px] text-slate-400 font-mono">smitpanchal734@gmail.com</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
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


      {activeAdminTab === 'leads' && (
        <div className="max-w-7xl mx-auto">
          <CrmLeadsTab
            leads={crmLeads}
            plans={crmPlans}
            onLeadConverted={async () => {
              await loadAdminData();
              setActiveAdminTab('customers');
            }}
            executives={
              crmTeam
                .filter((t) => t.role === 'executive' || t.role === 'manager' || t.role === 'admin')
                .map((t) => t.name)
                .concat(['Smit Panchal'])
                .filter((v, i, a) => a.indexOf(v) === i)
            }
            onRefresh={loadAdminData}
            showNotice={showNotice}
          />
        </div>
      )}

      {activeAdminTab === 'customers' && (
        <div className="max-w-7xl mx-auto">
          <CrmCustomersTab
            customers={crmCustomers}
            plans={crmPlans}
            onRefresh={loadAdminData}
            showNotice={showNotice}
            onSelectCustomerForBilling={(cust) => {
              setPreSelectedCustomer(cust);
              setActiveAdminTab('billing');
            }}
          />
        </div>
      )}

      {activeAdminTab === 'plans' && (
        <div className="max-w-7xl mx-auto">
          <CrmPlansTab
            plans={crmPlans}
            onRefresh={loadAdminData}
            showNotice={showNotice}
          />
        </div>
      )}

      {activeAdminTab === 'billing' && (
        <div className="max-w-7xl mx-auto">
          <CrmBillingTab
            invoices={crmInvoices}
            customers={crmCustomers}
            onRefresh={loadAdminData}
            showNotice={showNotice}
            preSelectedCustomer={preSelectedCustomer}
            onClearPreSelectedCustomer={() => setPreSelectedCustomer(null)}
          />
        </div>
      )}

      {activeAdminTab === 'team' && (
        <div className="max-w-7xl mx-auto">
          <CrmTeamTab
            team={crmTeam}
            onRefresh={loadAdminData}
            showNotice={showNotice}
          />
        </div>
      )}


      {activeAdminTab === 'users' && (
        <div className="max-w-7xl mx-auto space-y-6">
      {/* KPI Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200/80 bg-white shadow-xs">
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

        {/* Business Enquiries & Leads KPI Card */}
        <Card
          onClick={() => setActiveAdminTab('leads')}
          className="border-slate-200/80 bg-white shadow-xs cursor-pointer transition-all hover:border-blue-400 hover:shadow-sm"
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                CRM Leads
                {crmLeads.filter((l) => (l.stage || l.status) === 'new').length > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                )}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                {crmLeads.length}
              </p>
              <span className="text-[11px] text-blue-600 font-medium">
                {crmLeads.filter((l) => (l.stage || l.status) === 'new').length} New Leads in Pipeline
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
                                disabled={isCurrentAdmin || user.email === 'smitpanchal734@gmail.com'}
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
                            {user.email !== 'smitpanchal734@gmail.com' && !isCurrentAdmin && (
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

                            {/* Delete User Profile */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrentAdmin || user.email === 'smitpanchal734@gmail.com'}
                              onClick={() => {
                                setDeletingTarget(user);
                                setConfirmDeleteText('');
                              }}
                              className="h-7 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold disabled:opacity-20"
                              title={
                                isCurrentAdmin
                                  ? 'You cannot delete yourself'
                                  : user.email === 'smitpanchal734@gmail.com'
                                  ? 'Super Admin cannot be deleted'
                                  : 'Permanently delete user profile'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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
          {/* Pagination */}
          {!isLoading && filteredUsers.length > 0 && (
            <TablePagination
              currentPage={safeCurrentPage}
              pageSize={pageSize}
              totalItems={filteredUsers.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              colorScheme="indigo"
            />
          )}
        </Card>
      </div>
        </div>
      )}
        </main>
      </div>

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

      {/* Delete User Confirmation Modal */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Delete User Profile: {deletingTarget.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Email: <span className="font-mono text-slate-700 font-semibold">{deletingTarget.email}</span>
                </p>
                <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Permanent Deletion:</strong> This will permanently delete the user account, their registered businesses, QR codes, scan analytics, and active sessions from the database. <strong>This action cannot be undone.</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Type <span className="font-mono text-rose-600 font-black">DELETE</span> to confirm:
                </label>
                <Input
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="DELETE"
                  className="text-xs h-9 font-mono uppercase tracking-wider"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeletingTarget(null);
                    setConfirmDeleteText('');
                  }}
                  disabled={isSubmittingDelete}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={isSubmittingDelete || confirmDeleteText.trim().toUpperCase() !== 'DELETE'}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 shadow-sm disabled:opacity-40"
                >
                  {isSubmittingDelete ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  {isSubmittingDelete ? 'Deleting...' : 'Permanently Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
