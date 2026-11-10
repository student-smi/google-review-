import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Building,
  User,
  Trash2,
  Eye,
  FileText,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { InvoiceData, PaymentReceiptModal } from './PaymentReceiptModal';
import { CustomerItem } from './CrmCustomersTab';
import { TablePagination } from './TablePagination';

interface CrmBillingTabProps {
  invoices: InvoiceData[];
  customers: CustomerItem[];
  onRefresh: () => Promise<void>;
  showNotice: (text: string, type?: 'success' | 'error') => void;
  preSelectedCustomer?: CustomerItem | null;
  onClearPreSelectedCustomer?: () => void;
}

export const CrmBillingTab: React.FC<CrmBillingTabProps> = ({
  invoices,
  customers,
  onRefresh,
  showNotice,
  preSelectedCustomer,
  onClearPreSelectedCustomer
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<InvoiceData | null>(null);

  // Create Invoice Modal State
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(Boolean(preSelectedCustomer));
  const [newInvoice, setNewInvoice] = useState({
    customerId: preSelectedCustomer?.id || '',
    customerName: preSelectedCustomer?.name || '',
    customerEmail: preSelectedCustomer?.email || '',
    customerPhone: '',
    businessName: preSelectedCustomer?.businesses[0]?.name || '',
    itemDescription: 'NFC + QR Smart Review Standee (Lifetime Hardware)',
    qty: 1,
    unitPrice: 999,
    status: 'paid' as 'paid' | 'pending',
    paymentMethod: 'upi',
    paymentId: `UPI_${Date.now()}`
  });
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // If preSelectedCustomer changes, update modal
  React.useEffect(() => {
    if (preSelectedCustomer) {
      setNewInvoice({
        customerId: preSelectedCustomer.id,
        customerName: preSelectedCustomer.name,
        customerEmail: preSelectedCustomer.email,
        customerPhone: '',
        businessName: preSelectedCustomer.businesses[0]?.name || '',
        itemDescription: 'NFC + QR Smart Review Standee (Lifetime Hardware)',
        qty: 1,
        unitPrice: 999,
        status: 'paid',
        paymentMethod: 'upi',
        paymentId: `UPI_${Date.now()}`
      });
      setIsCreateInvoiceOpen(true);
    }
  }, [preSelectedCustomer]);

  // Financial Stats
  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalPending = invoices.filter((i) => i.status !== 'paid').reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerEmail.toLowerCase().includes(q) ||
      (inv.businessName && inv.businessName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset pagination on search or status change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);

  // Create invoice handler
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.customerName || !newInvoice.customerEmail) {
      showNotice('Customer name and email are required', 'error');
      return;
    }
    setIsSubmittingInvoice(true);
    try {
      const items = [
        {
          description: newInvoice.itemDescription,
          qty: Number(newInvoice.qty) || 1,
          unitPrice: Number(newInvoice.unitPrice) || 999,
          amount: (Number(newInvoice.qty) || 1) * (Number(newInvoice.unitPrice) || 999)
        }
      ];

      await apiFetch('/api/admin/crm/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...newInvoice,
          items,
          subtotal: items[0].amount
        })
      });

      showNotice('Tax invoice generated successfully!');
      setIsCreateInvoiceOpen(false);
      if (onClearPreSelectedCustomer) onClearPreSelectedCustomer();
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to generate invoice', 'error');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  // Toggle paid status
  const handleToggleStatus = async (invoiceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      await apiFetch(`/api/admin/crm/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      showNotice(`Invoice marked as ${nextStatus.toUpperCase()}`);
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to update status', 'error');
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await apiFetch(`/api/admin/crm/invoices/${invoiceId}`, { method: 'DELETE' });
      showNotice('Invoice deleted successfully');
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to delete invoice', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Invoiced Volume</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1 block">
              ₹{totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Payments Collected</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 mt-1 block">
              ₹{totalPaid.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Pending Receivables</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 mt-1 block">
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, customer name, email, or business..."
            className="pl-9 h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Filter by invoice status"
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Invoices ({invoices.length})</option>
            <option value="paid">Paid & Verified ({invoices.filter((i) => i.status === 'paid').length})</option>
            <option value="pending">Pending ({invoices.filter((i) => i.status !== 'paid').length})</option>
          </select>

          <Button
            size="sm"
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 text-xs gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Invoice # & Date</th>
                <th className="py-3 px-4">Customer & Business</th>
                <th className="py-3 px-4">Amount Breakdown</th>
                <th className="py-3 px-4">Total (With 18% GST)</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Receipt & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No invoices generated yet</p>
                    <p className="text-[11px] text-slate-400">Click &quot;New Invoice&quot; to issue a professional tax invoice &amp; receipt.</p>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  const invDate = new Date(
                    inv.createdAt * (inv.createdAt < 10000000000 ? 1000 : 1)
                  ).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice # & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-indigo-700 text-sm">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{invDate}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                          Mode: {inv.paymentMethod}
                        </div>
                      </td>

                      {/* Customer & Business */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{inv.customerName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{inv.customerEmail}</div>
                        {inv.businessName && (
                          <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Building className="w-2.5 h-2.5 text-slate-400" />
                            {inv.businessName}
                          </div>
                        )}
                      </td>

                      {/* Amount Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-600">
                          Subtotal: <span className="font-mono font-semibold">₹{inv.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          GST (18%): <span className="font-mono">₹{inv.taxAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-sm text-slate-900">
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                          Inclusive of all taxes
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv.id, inv.status)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Click to toggle status"
                        >
                          {inv.status === 'paid' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span className="uppercase">{inv.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => setViewingReceipt(inv)}
                            className="h-7 px-2.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1 shadow-xs cursor-pointer"
                            title="View & Print Official Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Invoice"
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
        <TablePagination
          currentPage={safeCurrentPage}
          pageSize={pageSize}
          totalItems={filteredInvoices.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          colorScheme="indigo"
        />
      </div>

      {/* Printable Receipt Modal */}
      {viewingReceipt && (
        <PaymentReceiptModal
          invoice={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {/* Create Invoice Modal */}
      {isCreateInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Generate Customer Invoice</h3>
                <p className="text-xs text-slate-400">Issue an official tax invoice with 18% GST</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreateInvoiceOpen(false);
                  if (onClearPreSelectedCustomer) onClearPreSelectedCustomer();
                }}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
              {/* Customer Selector / Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer / Merchant Name *</label>
                  <Input
                    required
                    value={newInvoice.customerName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customerName: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Email *</label>
                  <Input
                    type="email"
                    required
                    value={newInvoice.customerEmail}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customerEmail: e.target.value })}
                    placeholder="merchant@gmail.com"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Business Outlet Name</label>
                <Input
                  value={newInvoice.businessName}
                  onChange={(e) => setNewInvoice({ ...newInvoice, businessName: e.target.value })}
                  placeholder="e.g. Royal Sweets & Bakery"
                  className="h-9 text-xs"
                />
              </div>

              {/* Line Items */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-[11px] block">Line Item Details</span>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Item Description</label>
                  <select
                    value={newInvoice.itemDescription}
                    onChange={(e) => {
                      const desc = e.target.value;
                      let price = 999;
                      if (desc.includes('499')) price = 499;
                      else if (desc.includes('1,499')) price = 1499;
                      setNewInvoice({ ...newInvoice, itemDescription: desc, unitPrice: price });
                    }}
                    aria-label="Select line item product"
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <option value="QR Review Standee (₹499 Lifetime)">QR Review Standee - ₹499</option>
                    <option value="NFC + QR Smart Review Standee (₹999 Bestseller)">NFC + QR Smart Standee - ₹999</option>
                    <option value="Premium Branded NFC Review Standee (₹1,499 Executive)">Premium Branded NFC Standee - ₹1,499</option>
                    <option value="Monthly Growth SaaS Plan (AI Review Sync)">Monthly Growth SaaS Plan - ₹999/mo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      value={newInvoice.qty}
                      onChange={(e) => setNewInvoice({ ...newInvoice, qty: Number(e.target.value) })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Unit Price (₹)</label>
                    <Input
                      type="number"
                      value={newInvoice.unitPrice}
                      onChange={(e) => setNewInvoice({ ...newInvoice, unitPrice: Number(e.target.value) })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Calculation preview */}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-xs text-slate-700 font-semibold">
                  <span>Subtotal: ₹{((newInvoice.qty || 1) * (newInvoice.unitPrice || 0)).toLocaleString('en-IN')}</span>
                  <span>GST 18%: ₹{Math.round(((newInvoice.qty || 1) * (newInvoice.unitPrice || 0) * 0.18)).toLocaleString('en-IN')}</span>
                  <span className="font-black text-indigo-700">
                    Total: ₹{Math.round(((newInvoice.qty || 1) * (newInvoice.unitPrice || 0) * 1.18)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Mode & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={newInvoice.paymentMethod}
                    onChange={(e) => setNewInvoice({ ...newInvoice, paymentMethod: e.target.value })}
                    aria-label="Payment method selection"
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="razorpay">Razorpay Online</option>
                    <option value="bank_transfer">NEFT / Bank Transfer</option>
                    <option value="cash">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Status</label>
                  <select
                    value={newInvoice.status}
                    onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value as any })}
                    aria-label="Payment status selection"
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <option value="paid">Paid & Verified</option>
                    <option value="pending">Pending Collection</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateInvoiceOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingInvoice}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSubmittingInvoice ? 'Generating...' : 'Create & Issue Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

