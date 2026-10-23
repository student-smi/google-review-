import { useState } from 'react';
import { useOutletContext, NavLink } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  Sparkles,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  Check,
  Plus,
  ShieldCheck,
  FileDown,
  MessageSquareQuote,
  Eye,
  Star,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  Store,
  MapPin
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';

export function OverviewPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();

  // Metrics state
  const [stats] = useState({
    scansToday: 48,
    draftsToday: 21,
    googleClicksToday: 18,
    conversionRate: 37.5,
    aiCallsToday: 5,
    aiDailyCap: 25,
    avgRating: '4.9',
    totalReviews: 84
  });

  // Recent reviews / tasks (ClickUp 4.0 Grouped Style)
  const [completedReviews] = useState([
    {
      id: 'rev-1',
      customer: 'Deep Patel',
      rating: 5,
      foodOrService: 'Crispy Dhokla & Soft Kaju Katli',
      time: '12m ago',
      channel: 'Main Billing Counter QR',
      reviewText: 'Visited Royal Sweets today. The kaju katli was freshly made and very soft. Staff was courteous and packaging was top-notch.',
      googleVerified: true
    },
    {
      id: 'rev-2',
      customer: 'Priya Shah',
      rating: 5,
      foodOrService: 'Quick Billing & Clean Ambience',
      time: '45m ago',
      channel: 'Table Tent #4',
      reviewText: 'Fast service and very clean seating area. Rasgulla was super fresh!',
      googleVerified: true
    },
    {
      id: 'rev-3',
      customer: 'Amit Varma',
      rating: 5,
      foodOrService: 'Motichoor Ladoo & Fafda',
      time: '1h ago',
      channel: 'Main Billing Counter QR',
      reviewText: 'Best farsan in the area. Freshly fried and great hospitality.',
      googleVerified: true
    }
  ]);

  const [activeScans] = useState([
    {
      id: 'scan-1',
      source: 'Table Tent #2 (Dining Room)',
      step: 'AI Drafts Generating (Gujarati, Hindi, English)',
      time: 'Just now'
    },
    {
      id: 'scan-2',
      source: 'Main Billing Counter QR',
      step: 'Customer copied 3-Draft to Clipboard',
      time: '3m ago'
    }
  ]);

  const [qrList] = useState([
    {
      id: 'qr-1',
      code: 'royal-counter',
      label: 'Main Billing Counter',
      scans: 32,
      drafts: 14,
      googleClicks: 12,
      isActive: true
    },
    {
      id: 'qr-2',
      code: 'royal-table4',
      label: 'Table Tent #4 (Family Dining)',
      scans: 16,
      drafts: 7,
      googleClicks: 6,
      isActive: true
    }
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. TOP HEADER & BREADCRUMB (ClickUp 4.0 Header Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-mono">
            <span>SPACES</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white flex items-center gap-1 font-bold">
              <span className="text-amber-500">⭐</span> {activeBusiness?.name || 'Royal Sweets & Restaurant'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Google Reviews Workspace
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
              ★ {stats.avgRating} ({stats.totalReviews} Reviews)
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <NavLink to="/dashboard/qr">
            <button className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs flex items-center gap-2">
              <FileDown className="h-3.5 w-3.5 text-slate-500" />
              <span>QR Poster Studio</span>
            </button>
          </NavLink>

          <NavLink to="/dashboard/replies">
            <button className="h-9 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" />
              <span>AI Reply Copilot</span>
            </button>
          </NavLink>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS (ClickUp 4.0 Grid Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] p-4 space-y-2 shadow-xs hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase font-mono">
            <span>Scans Today</span>
            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.scansToday}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-mono">
              <TrendingUp className="h-3 w-3" /> +14% vs avg
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Live non-blocking edge scans</p>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] p-4 space-y-2 shadow-xs hover:border-pink-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase font-mono">
            <span>AI Drafts</span>
            <div className="h-7 w-7 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.draftsToday}
            </span>
            <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-full font-mono">
              3-Option Drafts
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Multilingual EN, हिंदी, ગુજરાતી</p>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] p-4 space-y-2 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase font-mono">
            <span>Google Submissions</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.googleClicksToday}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-mono">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-500">1-Tap clipboard to Google Maps</p>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] p-4 space-y-2 shadow-xs hover:border-sky-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase font-mono">
            <span>Conversion Rate</span>
            <div className="h-7 w-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.conversionRate}%
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {stats.googleClicksToday}/{stats.scansToday} scans
            </span>
          </div>
          <p className="text-[11px] text-slate-500">High authentic completion</p>
        </div>
      </div>

      {/* 3. CLICKUP 4.0 GROUPED TASK & REVIEW BOARD */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] shadow-md overflow-hidden space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Live Google Review Feed & Tasks</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Real-time sync</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold">
              Tasks
            </span>
            <span className="px-2.5 py-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              Activity
            </span>
          </div>
        </div>

        {/* Section: DONE Group (Green Pill Header) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-5 px-2.5 rounded-md bg-emerald-600 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1">
              <Check className="h-3 w-3 stroke-[3]" />
              <span>DONE</span>
              <span className="ml-1 opacity-80 font-mono">{completedReviews.length}</span>
            </span>
            <span className="text-xs text-slate-400">Verified reviews submitted to Google</span>
          </div>

          <div className="space-y-2">
            {completedReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-3.5 space-y-2 hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {rev.customer}
                    </span>
                    <div className="flex items-center text-amber-500 text-xs">
                      {'★'.repeat(rev.rating)}
                    </div>
                    <span className="text-xs text-slate-500">• {rev.foodOrService}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">{rev.time}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> Posted on Google
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 pl-8 leading-relaxed">
                  "{rev.reviewText}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: IN PROGRESS Group (Sky Blue Header) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="h-5 px-2.5 rounded-md bg-sky-500 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1">
              <span>IN PROGRESS</span>
              <span className="ml-1 opacity-80 font-mono">{activeScans.length}</span>
            </span>
            <span className="text-xs text-slate-400">Active customer mobile draft flows</span>
          </div>

          <div className="space-y-2">
            {activeScans.map((scan) => (
              <div
                key={scan.id}
                className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {scan.source}
                  </span>
                  <span className="text-slate-500">• {scan.step}</span>
                </div>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-mono font-bold">
                  {scan.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. ACTIVE QR STANDEES & FREE TIER SAFEGUARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active QR Standees Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Active QR Standees
              </h3>
              <p className="text-xs text-slate-500">
                Cached on Cloudflare Edge KV for sub-10ms scan response
              </p>
            </div>
            <NavLink to="/dashboard/qr">
              <button className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Standee</span>
              </button>
            </NavLink>
          </div>

          <div className="space-y-2">
            {qrList.map((qr) => (
              <div
                key={qr.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{qr.label}</h4>
                    <p className="text-[11px] font-mono text-slate-500">/r/{qr.code}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">{qr.scans} scans</span>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {qr.googleClicks} Google Clicks
                    </p>
                  </div>

                  <a
                    href={`/r/${qr.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Test Flow</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cloudflare Free Tier Safeguard Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Resource Safeguards
              </h3>
              <p className="text-xs text-slate-500">Cloudflare Free Tier Budget</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-mono">
              ₹0 Forever
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Workers AI Progress */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span>Workers AI (Llama 3.1)</span>
                <span className="font-mono">{stats.aiCallsToday} / {stats.aiDailyCap} today</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                  style={{ width: `${(stats.aiCallsToday / stats.aiDailyCap) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">20 review drafts remaining before template fallback</p>
            </div>

            {/* D1 Database Writes */}
            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span>D1 Database Writes</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">&lt; 0.05% of 100k</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '2%' }} />
              </div>
              <p className="text-[10px] text-slate-500">KV cached — 0 D1 queries on customer scan</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Zero gating, zero fake reviews guaranteed.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
