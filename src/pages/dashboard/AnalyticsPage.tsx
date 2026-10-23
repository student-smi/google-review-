import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  ArrowUpRight,
  BarChart2,
  ShieldAlert,
  Smartphone,
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export function AnalyticsPage() {
  const [funnel] = useState([
    {
      step: '1. QR Scans',
      count: 324,
      percent: '100%',
      desc: 'Physical QR scans detected at billing counters and table tents',
      color: 'bg-indigo-500'
    },
    {
      step: '2. "Help Me Write" Opened',
      count: 182,
      percent: '56.1%',
      desc: 'Customers who launched the 3-bullet guided draft assistant',
      color: 'bg-purple-500'
    },
    {
      step: '3. Google Review Page Clicks',
      count: 139,
      percent: '42.9%',
      desc: 'Direct handoffs into the official Google Maps 5-star submission box',
      color: 'bg-emerald-500'
    }
  ]);

  const [placements] = useState([
    { name: 'Main Billing Counter', code: 'royal-counter', scans: 218, conversion: '45.4%' },
    { name: 'Dining Table Tent #4', code: 'royal-table4', scans: 74, conversion: '39.1%' },
    { name: 'Delivery Box Flyer', code: 'royal-delivery', scans: 32, conversion: '34.3%' }
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Conversion Analytics & Funnel
            </h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
              ✓ Active 30 Days
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry measuring physical QR standee engagement to verified Google Review page completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Oct 1 – Oct 23, 2026</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards (ClickUp 4.0 Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <span>Total Standee Scans</span>
              <span className="flex items-center text-emerald-600 font-bold text-[10px]">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> +18.4%
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              324
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Unique mobile devices scanned</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <span>AI Draft Assistant</span>
              <span className="flex items-center text-purple-600 font-bold text-[10px]">
                <Sparkles className="h-3 w-3 mr-0.5" /> 56.1% rate
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              182
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Customers helped with review ideas</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <span>Google Page Clicks</span>
              <span className="flex items-center text-emerald-600 font-bold text-[10px]">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> +27.2%
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              139
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Direct handoffs to Google Maps</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <span>Overall Rating</span>
              <span className="rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-1.5 py-0.5">
                ★ 4.8 / 5.0
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              +48 Reviews
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Published on Google this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Funnel Visualization */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">
            Customer Review Conversion Funnel
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Step-by-step drop-off and conversion rate across the scan lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {funnel.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {item.step}
                  </span>
                  <span className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-2 py-0.5">
                    {item.percent}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {item.count}
                </div>
                {/* Visual Progress Bar */}
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: item.percent }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Breakdown Table by Placements */}
          <div className="pt-2 space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Performance by Standee Placement
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Standee Location</th>
                    <th className="px-4 py-3">Short-Code</th>
                    <th className="px-4 py-3">Total Scans</th>
                    <th className="px-4 py-3">Completion Rate</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {placements.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        /r/{p.code}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-bold">
                        {p.scans}
                      </td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">
                        {p.conversion}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Honest Google Disclaimer Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">
                Authentic Google Maps Data Transparency:
              </span>
              <p className="leading-relaxed">
                Google does not transmit customer personal IDs to third-party QR tools when a user hits "Submit" inside the native Google Maps app without direct Business Profile API synchronization. "Google Review Page Clicks" measures validated customer intent and verified handoff.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
