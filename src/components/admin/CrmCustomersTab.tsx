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
  X,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Copy
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
  phone?: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: number;
  lastLoginAt?: number | null;
  businesses: { id: string; name: string; city?: string | null; slug: string; phone?: string | null }[];
  totalLocations: number;
  totalScans: number;
  totalReviews: number;
  totalReplies: number;
  plan: {
    id?: string | null;
    name: string;
    status: 'active' | 'expiring_soon' | 'expired';
    billingCycle: string;
    expiresAt: number;
    daysLeft: number;
    lastUpiRef?: string | null;
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'expiring_soon' | 'expired' | 'active'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Plan Switcher Modal State
  const [planModalCustomer, setPlanModalCustomer] = useState<CustomerItem | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  // UPI Renewal Modal State
  const [renewModalCustomer, setRenewModalCustomer] = useState<CustomerItem | null>(null);
  const [renewMonths, setRenewMonths] = useState<number>(1);
  const [renewAmount, setRenewAmount] = useState<number>(999);
  const [renewUpiRef, setRenewUpiRef] = useState<string>('');
  const [renewGenerateInvoice, setRenewGenerateInvoice] = useState<boolean>(true);
  const [isSubmittingRenew, setIsSubmittingRenew] = useState<boolean>(false);

  // WhatsApp Reminder Modal State
  const [remindModalCustomer, setRemindModalCustomer] = useState<CustomerItem | null>(null);
  const [remindPhone, setRemindPhone] = useState<string>('');
  const [remindMessage, setRemindMessage] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

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

  const openRenewModal = (customer: CustomerItem) => {
    setRenewModalCustomer(customer);
    setRenewMonths(1);
    setRenewUpiRef('');
    setRenewGenerateInvoice(true);
    
    // Find matching plan price
    const matchedPlan = plans.find((p) => p.name.toLowerCase() === customer.plan?.name?.toLowerCase());
    if (matchedPlan && matchedPlan.price) {
      setRenewAmount(matchedPlan.price);
    } else if (customer.plan?.name?.toLowerCase().includes('enterprise')) {
      setRenewAmount(2999);
    } else if (customer.plan?.name?.toLowerCase().includes('growth')) {
      setRenewAmount(999);
    } else {
      setRenewAmount(499);
    }
  };

  const openRemindModal = (cust: CustomerItem) => {
    setRemindModalCustomer(cust);
    const existingPhone = cust.phone || cust.businesses.find((b) => b.phone)?.phone || '';
    setRemindPhone(existingPhone);
    setCopiedMessage(false);

    const bizName = cust.businesses[0]?.name || cust.name;
    const planName = cust.plan?.name || 'Growth (NFC + Review Sync)';
    const expiryDate = formatSafeDate(cust.plan?.expiresAt);
    const isExpired = cust.plan?.status === 'expired' || cust.plan?.daysLeft < 0;
    
    const matchedPlan = plans.find((p) => p.name.toLowerCase() === cust.plan?.name?.toLowerCase());
    const amount = matchedPlan?.price || (planName.toLowerCase().includes('enterprise') ? 2999 : 999);

    const msg = isExpired
      ? `Namaste ${cust.name}! Aapke business "${bizName}" ka Loctimize (${planName}) subscription plan khatam ho chuka hai.\n\nUninterrupted review collection aur NFC standee features jari rakhne ke liye kripya direct UPI par payment karein:\n\n📱 UPI ID: smitpanchal@okaxis\n💰 Amount: ₹${amount}/month\n\nPayment karne ke baad screenshot share karein taaki hum account turant renew kar sakein. Thank you!`
      : `Namaste ${cust.name}! Aapke business "${bizName}" ka Loctimize (${planName}) subscription plan ${expiryDate} ko renew hona hai.\n\nService uninterrupted rakhne ke liye kripya direct UPI par renew karein:\n\n📱 UPI ID: smitpanchal@okaxis\n💰 Amount: ₹${amount}/month\n\nPayment ke baad screenshot share karein. Thank you!`;
    
    setRemindMessage(msg);
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remindPhone.trim()) {
      showNotice?.('Please enter the customer mobile number', 'error');
      return;
    }

    let cleanDigits = remindPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length === 10) {
      cleanDigits = '91' + cleanDigits;
    } else if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
      cleanDigits = '91' + cleanDigits.slice(1);
    }

    const url = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(remindMessage)}`;
    window.open(url, '_blank');
    setRemindModalCustomer(null);
    showNotice?.(`Opening WhatsApp for +${cleanDigits}`);
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

  const handleRenewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewModalCustomer) return;
    setIsSubmittingRenew(true);

    try {
      const res = await apiFetch<{ success: boolean; message: string; newExpiresAt: number; invoice?: any }>(
        `/api/admin/crm/customers/${renewModalCustomer.id}/renew`,
        {
          method: 'POST',
          body: JSON.stringify({
            monthsToAdd: renewMonths,
            upiRef: renewUpiRef.trim(),
            amount: Number(renewAmount),
            planId: renewModalCustomer.plan.id,
            planName: renewModalCustomer.plan.name,
            generateInvoice: renewGenerateInvoice
          })
        }
      );

      showNotice?.(res.message || `Subscription for "${renewModalCustomer.name}" successfully renewed via UPI!`);
      setRenewModalCustomer(null);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      showNotice?.(err?.message || 'Failed to renew subscription', 'error');
    } finally {
      setIsSubmittingRenew(false);
    }
  };

  // Expiry counts for alert banners
  const expiredCount = customers.filter((c) => c.plan?.status === 'expired' || c.plan?.daysLeft < 0).length;
  const expiringSoonCount = customers.filter(
    (c) => c.plan?.status === 'expiring_soon' || (c.plan?.daysLeft >= 0 && c.plan?.daysLeft <= 5)
  ).length;

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      c.businesses.some((b) => b.name.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q) || (b.phone && b.phone.includes(q)));

    const matchesPlan =
      planFilter === 'all' ||
      (planFilter === 'growth' && c.plan?.name.toLowerCase().includes('growth')) ||
      (planFilter === 'enterprise' && c.plan?.name.toLowerCase().includes('enterprise')) ||
      (planFilter === 'starter' && c.plan?.name.toLowerCase().includes('starter'));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'expired' && (c.plan?.status === 'expired' || c.plan?.daysLeft < 0)) ||
      (statusFilter === 'expiring_soon' && (c.plan?.status === 'expiring_soon' || (c.plan?.daysLeft >= 0 && c.plan?.daysLeft <= 5))) ||
      (statusFilter === 'active' && c.plan?.status === 'active' && c.plan?.daysLeft > 5);

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, planFilter, statusFilter, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      {/* Expiry & UPI Renewal Alert Banner */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expiredCount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">{expiredCount} Customer Subscriptions Expired!</h4>
                  <p className="text-xs text-rose-700">1 month ended. Record UPI payment or send WhatsApp reminder.</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
                className={`text-xs font-bold border-rose-300 cursor-pointer ${
                  statusFilter === 'expired' ? 'bg-rose-600 text-white' : 'text-rose-800 bg-white hover:bg-rose-100'
                }`}
              >
                {statusFilter === 'expired' ? 'Showing Expired' : 'Filter Expired'}
              </Button>
            </div>
          )}

          {expiringSoonCount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">{expiringSoonCount} Expiring Within 5 Days</h4>
                  <p className="text-xs text-amber-700">Monthly renewal coming up. Follow up for UPI payment.</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatusFilter(statusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
                className={`text-xs font-bold border-amber-300 cursor-pointer ${
                  statusFilter === 'expiring_soon' ? 'bg-amber-600 text-white' : 'text-amber-800 bg-white hover:bg-amber-100'
                }`}
              >
                {statusFilter === 'expiring_soon' ? 'Showing Expiring' : 'Filter Expiring'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone, email, or business branch..."
            className="pl-9 h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Chips */}
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('expiring_soon')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'expiring_soon' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-700 hover:text-amber-800'
              }`}
            >
              Expiring ({expiringSoonCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('expired')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'expired' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:text-rose-800'
              }`}
            >
              Expired ({expiredCount})
            </button>
          </div>

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
                <th className="py-3 px-4">Active Plan</th>
                <th className="py-3 px-4">Subscription Validity</th>
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
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No customers found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try resetting search or filter criteria</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => {
                  const joinDate = formatSafeDate(cust.createdAt);
                  const expiryDate = formatSafeDate(cust.plan?.expiresAt);
                  const daysLeft = cust.plan?.daysLeft ?? 30;
                  const isExpired = cust.plan?.status === 'expired' || daysLeft < 0;
                  const isExpiringSoon = cust.plan?.status === 'expiring_soon' || (daysLeft >= 0 && daysLeft <= 5);
                  const displayPhone = cust.phone || cust.businesses.find((b) => b.phone)?.phone;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Merchant Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">{cust.email}</div>
                        {displayPhone && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                            <Phone className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{displayPhone}</span>
                          </div>
                        )}
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
                            <span>{cust.plan?.name || 'Starter'}</span>
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
                        <div className="text-[10px] text-slate-400 mt-1 capitalize font-medium">
                          Billing: {cust.plan?.billingCycle || 'monthly'}
                        </div>
                      </td>

                      {/* Subscription Validity & Expiry Column */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Expired ({Math.abs(daysLeft)}d ago)
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              Ended: {expiryDate}
                            </div>
                          </div>
                        ) : isExpiringSoon ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Expiring in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}!
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                              Valid till: {expiryDate}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active ({daysLeft}d left)
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              Valid till: {expiryDate}
                            </div>
                          </div>
                        )}
                        {cust.plan?.lastUpiRef && (
                          <div className="text-[9px] text-indigo-600 font-mono font-semibold mt-0.5">
                            UTR: {cust.plan.lastUpiRef}
                          </div>
                        )}
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
                          {/* 1-Click Renew (+1M) Button */}
                          <Button
                            size="sm"
                            onClick={() => openRenewModal(cust)}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 cursor-pointer shadow-2xs"
                            title="Record UPI payment and renew subscription for +1 month"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Renew</span>
                          </Button>

                          {/* WhatsApp Reminder Button with Customer Phone */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRemindModal(cust)}
                            className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-bold gap-1 cursor-pointer"
                            title={`Send WhatsApp payment & renewal reminder to ${displayPhone || cust.name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden xl:inline">Remind</span>
                          </Button>

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
                              title="Create custom invoice for this customer"
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

      {/* WhatsApp Payment Reminder Modal */}
      {remindModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                  WhatsApp Payment Reminder
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Send to: {remindModalCustomer.name}
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{remindModalCustomer.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setRemindModalCustomer(null)}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendWhatsApp} className="p-6 space-y-4 text-xs">
              {/* Customer Mobile Number */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Customer WhatsApp Mobile Number
                  <span className="text-emerald-600 font-normal ml-1.5">(Customer ka phone number)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="tel"
                    value={remindPhone}
                    onChange={(e) => setRemindPhone(e.target.value)}
                    placeholder="e.g. 9876543210 or +919876543210"
                    className="pl-9 h-10 text-xs font-mono font-bold border-slate-200"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ye number lead form ya profile se liya gaya hai. Aap is number par WhatsApp chat open karenge.
                </p>
              </div>

              {/* Message Preview & Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    WhatsApp Message Preview
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(remindMessage);
                      setCopiedMessage(true);
                      setTimeout(() => setCopiedMessage(false), 3000);
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedMessage ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <textarea
                  value={remindMessage}
                  onChange={(e) => setRemindMessage(e.target.value)}
                  rows={6}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRemindModalCustomer(null)}
                  className="h-10 px-4 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp with this Number</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record UPI Payment & Renew Subscription Modal */}
      {renewModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                  Manual UPI Subscription Renewal
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Renew Plan: {renewModalCustomer.name}
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{renewModalCustomer.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setRenewModalCustomer(null)}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenewCustomer} className="p-6 space-y-4 text-xs">
              {/* Customer Current Status Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Active Plan:</span>
                  <span className="font-black text-emerald-900 text-sm">{renewModalCustomer.plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold block text-[11px]">Current Validity:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatSafeDate(renewModalCustomer.plan.expiresAt)}
                  </span>
                </div>
              </div>

              {/* Renewal Duration & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Renewal Extension Period</label>
                  <select
                    value={renewMonths}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setRenewMonths(m);
                      const base = 999;
                      setRenewAmount(m === 12 ? 9999 : m * base);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>+1 Month (30 Days)</option>
                    <option value={3}>+3 Months (90 Days)</option>
                    <option value={6}>+6 Months (180 Days)</option>
                    <option value={12}>+1 Year (365 Days - 2M Free)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount Received via UPI (₹)</label>
                  <Input
                    type="number"
                    value={renewAmount}
                    onChange={(e) => setRenewAmount(Number(e.target.value))}
                    className="h-10 text-xs font-mono font-bold border-slate-200"
                    placeholder="e.g. 999"
                    required
                  />
                </div>
              </div>

              {/* UPI UTR / Transaction ID */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  UPI Transaction ID / UTR Number
                  <span className="text-slate-400 font-normal ml-1">(From GPay / PhonePe / Paytm)</span>
                </label>
                <Input
                  value={renewUpiRef}
                  onChange={(e) => setRenewUpiRef(e.target.value)}
                  placeholder="e.g. 502938492041 or UPI/TRANSFER/..."
                  className="h-10 text-xs font-mono border-slate-200"
                />
              </div>

              {/* Auto-generate Receipt Checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="autoInvoice"
                  checked={renewGenerateInvoice}
                  onChange={(e) => setRenewGenerateInvoice(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="autoInvoice" className="text-slate-700 font-semibold cursor-pointer">
                  Automatically generate a Paid GST Tax Invoice & Receipt
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRenewModalCustomer(null)}
                  className="h-10 px-4 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingRenew}
                  className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5 shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isSubmittingRenew ? 'Renewing...' : `Confirm UPI & Renew (+${renewMonths} Mo)`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
