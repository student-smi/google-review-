import React, { useState, useEffect } from 'react';
import {
  Search,
  Building,
  QrCode,
  Star,
  MessageSquare,
  MapPin,
  Calendar,
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  ExternalLink,
  MessageCircle,
  Clock,
  Layers,
  ArrowUpRight,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { TablePagination } from './TablePagination';
import { PlanItem } from './CrmPlansTab';

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: number;
  lastLoginAt?: number | null;
  businesses: { id: string; name: string; city?: string | null; slug: string }[];
  totalLocations: number;
  totalScans: number;
  totalReviews: number;
  totalReplies: number;
  plan: {
    id?: string | null;
    name: string;
    status: string;
    billingCycle: string;
    expiresAt: number;
  };
  billing: {
    invoiceCount: number;
    totalBilled: number;
    totalPaid: number;
  };
}

interface CrmCustomersTabProps {
  customers: CustomerItem[];
  plans?: PlanItem[];
  onSelectCustomerForBilling?: (customer: CustomerItem) => void;
  onRefresh?: () => Promise<void>;
  showNotice?: (text: string, type?: 'success' | 'error') => void;
}

export const CrmCustomersTab: React.FC<CrmCustomersTabProps> = ({
  customers,
  plans = [],
  onSelectCustomerForBilling,
  onRefresh,
  showNotice
}) => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Plan Switcher Modal State
  const [planModalCustomer, setPlanModalCustomer] = useState<CustomerItem | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const formatSafeDate = (d: any): string => {
    if (!d) return 'Recently';
    let dt: Date;
    if (d instanceof Date) dt = d;
    else if (typeof d === 'number') dt = new Date(d < 1e11 ? d * 1000 : d);
    else dt = new Date(d);
    return isNaN(dt.getTime())
      ? 'Recently'
      : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const openPlanModal = (customer: CustomerItem) => {
    setPlanModalCustomer(customer);
    setSelectedPlanName(customer.plan?.name || 'Starter');
    setSelectedPlanId(customer.plan?.id || null);
  };

  const handleUpdateCustomerPlan = async () => {
    if (!planModalCustomer || !selectedPlanName) return;
    setIsUpdatingPlan(true);

    try {
      await apiFetch(`/api/admin/crm/customers/${planModalCustomer.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({
          planId: selectedPlanId,
          planName: selectedPlanName
        })
      });

      showNotice?.(`Subscription plan for "${planModalCustomer.name}" updated to "${selectedPlanName}"!`);
      setPlanModalCustomer(null);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      showNotice?.(err?.message || 'Failed to update plan', 'error');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.businesses.some((b) => b.name.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q));

    const matchesPlan =
      planFilter === 'all' ||
      (planFilter === 'growth' && c.plan.name.toLowerCase().includes('growth')) ||
      (planFilter === 'enterprise' && c.plan.name.toLowerCase().includes('enterprise')) ||
      (planFilter === 'starter' && c.plan.name.toLowerCase().includes('starter'));

    return matchesSearch && matchesPlan;
  });

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, planFilter, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by merchant name, email, or business branch..."
            className="pl-9 h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            aria-label="Filter by subscription plan"
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Plans ({customers.length})</option>
            <option value="growth">Growth Plans</option>
            <option value="enterprise">Enterprise (Multi-Outlet)</option>
            <option value="starter">Starter / Hardware</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Merchant Customer</th>
                <th className="py-3 px-4">Active Plan & Status</th>
                <th className="py-3 px-4 text-center">Total Outlets</th>
                <th className="py-3 px-4 text-center">Live Scans</th>
                <th className="py-3 px-4 text-center">Reviews & AI Replies</th>
                <th className="py-3 px-4">Onboarding Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No customers found</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => {
                  const joinDate = formatSafeDate(cust.createdAt);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Merchant Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">{cust.email}</div>
                        {cust.businesses.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {cust.businesses.slice(0, 2).map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100"
                              >
                                <Building className="w-2.5 h-2.5" />
                                {b.name} {b.city ? `(${b.city})` : ''}
                              </span>
                            ))}
                            {cust.businesses.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-bold self-center">
                                +{cust.businesses.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Active Plan & Subscriptions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 border border-indigo-200">
                            <Zap className="w-3 h-3 text-indigo-600" />
                            <span>{cust.plan.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openPlanModal(cust)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer transition-colors"
                            title="Upgrade or Downgrade Subscription Plan"
                          >
                            Change
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              cust.isBlocked ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-semibold text-slate-600 capitalize">
                            {cust.isBlocked ? 'Suspended' : 'Subscription Active'}
                          </span>
                        </div>
                      </td>

                      {/* Total Outlets */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-xl font-bold font-mono text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          {cust.totalLocations} {cust.totalLocations === 1 ? 'Location' : 'Locations'}
                        </span>
                      </td>

                      {/* Live Scans */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          {cust.totalScans.toLocaleString()}
                        </div>
                      </td>

                      {/* Reviews & AI Replies */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-bold text-slate-800 text-xs flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          <span>{cust.totalReviews} Reviews</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                          <MessageSquare className="w-3 h-3 text-purple-600" />
                          <span>{cust.totalReplies} AI Replies</span>
                        </div>
                      </td>

                      {/* Onboarding Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{joinDate}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {cust.lastLoginAt ? 'Active Recently' : 'Account Created'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPlanModal(cust)}
                            className="h-7 px-2 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold gap-1 cursor-pointer"
                            title="Upgrade / Downgrade Plan"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>Plan</span>
                          </Button>
                          {onSelectCustomerForBilling && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectCustomerForBilling(cust)}
                              className="h-7 px-2.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
                            >
                              Create Bill
                            </Button>
                          )}
                          <a
                            href={`mailto:${cust.email}?subject=Loctimize ReviewQR Platform Support`}
                            className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Email Customer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
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
        <TablePagination
          currentPage={safeCurrentPage}
          pageSize={pageSize}
          totalItems={filteredCustomers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          colorScheme="indigo"
        />
      </div>

      {/* Plan Upgrade / Downgrade Modal */}
      {planModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Subscription Plan Manager
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Change Plan: {planModalCustomer.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{planModalCustomer.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setPlanModalCustomer(null)}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 block font-medium">Currently Active Plan:</span>
                <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                  {planModalCustomer.plan.name}
                </strong>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select New Plan (Upgrade / Downgrade)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(plans.length > 0 ? plans : [
                    { id: 'plan_starter', name: 'Starter', price: 999, badge: 'Hardware', maxLocations: 1 },
                    { id: 'plan_growth', name: 'Growth (NFC + Review Sync)', price: 2499, badge: 'Popular', maxLocations: 3 },
                    { id: 'plan_enterprise', name: 'Enterprise (Multi-Outlet)', price: 4999, badge: 'Bestseller', maxLocations: 10 }
                  ] as any[]).map((p) => {
                    const isSelected = selectedPlanName === p.name || selectedPlanId === p.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlanName(p.name);
                          setSelectedPlanId(p.id);
                        }}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{p.name}</span>
                            {p.badge && (
                              <Badge className="bg-indigo-100 text-indigo-700 border-none text-[9px] font-black h-4 px-1.5">
                                {p.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Up to {p.maxLocations || 1} Outlets • ₹{p.price?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPlanModalCustomer(null)}
                  className="h-10 px-4 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isUpdatingPlan || !selectedPlanName}
                  onClick={handleUpdateCustomerPlan}
                  className="h-10 px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {isUpdatingPlan ? 'Updating...' : 'Confirm Plan Update'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

