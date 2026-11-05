import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  CheckCircle2,
  Zap,
  CreditCard,
  Download,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHierarchy } from '@/context/HierarchyContext';

export function PackageBillingPage() {
  const navigate = useNavigate();
  const { currentLevel, activeBrand, activeBusiness, activeBranch, businesses, branches, roles } = useHierarchy();

  // Guard: Executive cannot access organizational billing
  if (roles.isExecutive) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Restricted Access</h2>
        <p className="text-xs text-slate-500">
          You are signed in as an Executive for <strong className="text-slate-800">{activeBranch?.name || 'your assigned branch'}</strong>. Package & billing management is restricted to organization owners.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer">
          Return to Branch Dashboard
        </Button>
      </div>
    );
  }

  const totalBranchesCount = branches.length;
  const totalBusinessesCount = businesses.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60 mb-1">
            <Crown className="h-3.5 w-3.5" />
            <span>Growth Plan Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {currentLevel === 'brand' ? 'Brand Package & Billing' : 'Business Subscription & Invoices'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your multi-branch enterprise quota, AI review copilot limits, and billing receipts.
          </p>
        </div>

        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer self-start sm:self-auto">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Upgrade to Enterprise</span>
        </Button>
      </div>

      {/* Quotas & Usage Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Businesses</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalBusinessesCount}</span>
            <span className="text-xs font-semibold text-slate-400">of 10 Max</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalBusinessesCount / 10) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Branch Locations</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalBranchesCount}</span>
            <span className="text-xs font-semibold text-slate-400">of 50 Max</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalBranchesCount / 50) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Reviews & Replies</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">Unlimited</span>
            <span className="text-xs font-semibold text-emerald-600 font-bold">Fair Usage Enabled</span>
          </div>
          <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* Plan Details Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-900">Current Plan Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Multi-entity 3-Tier Hierarchy (Brand → Business → Branch)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Membership-Based RBAC with Franchise Data Isolation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Real-time Google Places API Verified Sync & Place ID Link</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Multilingual AI Copilot (English, Hindi, Gujarati, Hinglish)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Unlimited QR Standee & Countertop Acrylic Card Generation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Private Negative Review Filter & Resolution Routing</span>
          </div>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">Recent Payment Receipts & Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">INV-2026-1101</td>
                <td className="py-3.5 px-4 text-slate-500">01 Nov 2026</td>
                <td className="py-3.5 px-4 font-bold text-slate-800">Growth Plan (Annual)</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">₹14,999</td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Paid</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="text-slate-500 hover:text-blue-600 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer">
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

