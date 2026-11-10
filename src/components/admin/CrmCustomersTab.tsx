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
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TablePagination } from './TablePagination';

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
  onSelectCustomerForBilling?: (customer: CustomerItem) => void;
}

export const CrmCustomersTab: React.FC<CrmCustomersTabProps> = ({
  customers,
  onSelectCustomerForBilling
}) => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
                  const joinDate = new Date(
                    cust.createdAt * (cust.createdAt < 10000000000 ? 1000 : 1)
                  ).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

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
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 border border-indigo-200">
                          <Zap className="w-3 h-3 text-indigo-600" />
                          <span>{cust.plan.name}</span>
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
                          {onSelectCustomerForBilling && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectCustomerForBilling(cust)}
                              className="h-7 px-2.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold"
                            >
                              Create Bill
                            </Button>
                          )}
                          <a
                            href={`mailto:${cust.email}?subject=Loctimize ReviewQR Platform Support`}
                            className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
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
    </div>
  );
};

