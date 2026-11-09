import React from 'react';
import { X, Printer, CheckCircle2, Building, ShieldCheck, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface InvoiceItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  businessId?: string | null;
  businessName?: string | null;
  itemsJson: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  paymentMethod: string;
  paymentId?: string | null;
  paidAt?: number | null;
  dueDate?: number | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
}

interface PaymentReceiptModalProps {
  invoice: InvoiceData | null;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  let items: InvoiceItem[] = [];
  try {
    items = JSON.parse(invoice.itemsJson || '[]');
  } catch {
    items = [{ description: 'Loctimize NFC & Google Review Solution', qty: 1, unitPrice: invoice.subtotal, amount: invoice.subtotal }];
  }

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(invoice.createdAt * (invoice.createdAt < 10000000000 ? 1000 : 1)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const paidDate = invoice.paidAt
    ? new Date(invoice.paidAt * (invoice.paidAt < 10000000000 ? 1000 : 1)).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : invoiceDate;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 print:m-0 print:border-none print:shadow-none animate-in fade-in zoom-in-95">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wide text-indigo-400">TAX INVOICE & RECEIPT</span>
            <span className="text-xs text-slate-400">#{invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-1.5 h-8 text-xs cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 p-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 sm:p-10 space-y-6 text-slate-800 print:p-4 bg-white" id="printable-receipt">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  L
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">LOCTIMIZE</h1>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Smart Review & Local SEO Platform
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                <p>Begaindvs / Loctimize Solutions</p>
                <p>Ahmedabad, Gujarat, India</p>
                <p className="font-mono text-slate-600">Email: begaindvs@gmail.com | Phone: +91 8320699679</p>
                <p className="text-[11px] font-semibold text-slate-600">GSTIN: 24AAACL7340F1Z9</p>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{invoice.status === 'paid' ? 'PAYMENT RECEIVED' : invoice.status.toUpperCase()}</span>
              </div>
              <div className="mt-3 text-xs text-slate-500 space-y-1">
                <p className="text-slate-900 font-bold">
                  Invoice No: <span className="font-mono text-indigo-700">{invoice.invoiceNumber}</span>
                </p>
                <p>Invoice Date: <span className="font-semibold text-slate-700">{invoiceDate}</span></p>
                <p>Payment Date: <span className="font-semibold text-slate-700">{paidDate}</span></p>
                {invoice.paymentId && (
                  <p>Ref/Txn ID: <span className="font-mono text-slate-700">{invoice.paymentId}</span></p>
                )}
                <p>Payment Mode: <span className="font-bold uppercase text-slate-800">{invoice.paymentMethod}</span></p>
              </div>
            </div>
          </div>

          {/* Billed To / Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                BILLED TO / CUSTOMER
              </span>
              <p className="font-black text-sm text-slate-900">{invoice.customerName}</p>
              <p className="text-slate-600 mt-0.5">{invoice.customerEmail}</p>
              {invoice.customerPhone && <p className="text-slate-600">{invoice.customerPhone}</p>}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                BUSINESS / OUTLET
              </span>
              <p className="font-bold text-sm text-indigo-900">{invoice.businessName || 'Business Outlet'}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Google Review QR & NFC Standee Deployment</p>
              <p className="text-slate-500 text-[11px]">Authorized Merchant Client</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.description}</td>
                    <td className="py-3 px-3 text-center text-slate-600 font-mono">{item.qty || 1}</td>
                    <td className="py-3 px-3 text-right text-slate-600 font-mono">
                      ₹{(item.unitPrice || item.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                      ₹{(item.amount || (item.qty * item.unitPrice) || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 border-t border-slate-100">
                <span>CGST (9%):</span>
                <span className="font-mono font-semibold">₹{Math.round(invoice.taxAmount / 2).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>SGST (9%):</span>
                <span className="font-mono font-semibold">₹{Math.round(invoice.taxAmount / 2).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-slate-900 font-black text-sm">
                <span>Total Paid:</span>
                <span className="font-mono text-indigo-700">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer & Digital Guarantee */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Tax Compliant & Digitally Authenticated Receipt</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">Loctimize Accounts</div>
              <div className="text-[10px] text-slate-400">Authorized Digital Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

