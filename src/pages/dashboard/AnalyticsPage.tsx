import { useState, useEffect } from 'react';
import { useOutletContext, NavLink } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  QrCode,
  FileDown,
  Plus
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';
import { apiFetch } from '@/lib/api';

interface DailyStat {
  day: string;
  scanCount: number;
  helpMeWriteCount: number;
  googleClickCount: number;
}

interface RealQrItem {
  id: string;
  code: string;
  label: string;
  scans?: number;
  drafts?: number;
  googleClicks?: number;
  isActive: boolean;
}

export function AnalyticsPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();
  const [placements, setPlacements] = useState<RealQrItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);

  useEffect(() => {
    if (!activeBusiness?.id) return;
    setIsLoading(true);

    // Fetch QR placements + scan stats
    apiFetch<{ qrCodes: any[] }>(`/api/qr/business/${activeBusiness.id}`)
      .then((data) => {
        if (data?.qrCodes) {
          const list = data.qrCodes.map((q) => ({
            id: q.id,
            code: q.code,
            label: q.label,
            scans: q.scans || 0,
            drafts: q.drafts || 0,
            googleClicks: q.googleClicks || 0,
            isActive: Boolean(q.isActive ?? true)
          }));
          setPlacements(list);
        } else {
          setPlacements([]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch analytics placements:', err);
        setPlacements([]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Fetch 30-day sparkline data
    apiFetch<{ stats: DailyStat[] }>(`/api/analytics/business/${activeBusiness.id}`)
      .then((data) => {
        if (data?.stats?.length) {
          // Sort ascending by date for chart
          const sorted = [...data.stats].sort((a, b) => a.day.localeCompare(b.day));
          setDailyStats(sorted);
        }
      })
      .catch(() => setDailyStats([]));
  }, [activeBusiness?.id]);

  // Real computed totals
  const totalScans = placements.reduce((acc, p) => acc + (p.scans || 0), 0);
  const totalDrafts = placements.reduce((acc, p) => acc + (p.drafts || 0), 0);
  const totalClicks = placements.reduce((acc, p) => acc + (p.googleClicks || 0), 0);

  const draftRate = totalScans > 0 ? ((totalDrafts / totalScans) * 100).toFixed(1) : '0.0';
  const clickRate = totalScans > 0 ? ((totalClicks / totalScans) * 100).toFixed(1) : '0.0';

  const funnel = [
    {
      step: '1. QR Scans',
      count: totalScans,
      percent: '100%',
      desc: 'Physical QR scans detected at billing counters and table tents',
      color: 'bg-indigo-500'
    },
    {
      step: '2. "Help Me Write" Opened',
      count: totalDrafts,
      percent: `${draftRate}%`,
      desc: 'Customers who launched the 3-bullet guided draft assistant',
      color: 'bg-purple-500'
    },
    {
      step: '3. Google Review Page Clicks',
      count: totalClicks,
      percent: `${clickRate}%`,
      desc: 'Direct handoffs into the official Google Maps 5-star submission box',
      color: 'bg-emerald-500'
    }
  ];

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
              ✓ Real-time Edge
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real customer scan progression for <span className="font-bold text-slate-700 dark:text-slate-200">{activeBusiness?.name || 'My Store'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink to="/dashboard/qr">
            <Button size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-bold text-xs rounded-xl shadow-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>New Standee</span>
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <span>Total Standee Scans</span>
              <span className="text-[10px] text-slate-400 font-mono">Live</span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalScans}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Unique mobile devices scanned</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <span>AI Draft Assistant</span>
              <span className="text-purple-600 font-bold text-[10px] font-mono">
                {draftRate}%
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalDrafts}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Customers assisted with review drafts</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <span>Google Page Clicks</span>
              <span className="text-emerald-600 font-bold text-[10px] font-mono">
                {clickRate}%
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalClicks}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Direct handoffs to Google rating box</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <span>Active Standees</span>
              <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] px-1.5 py-0.5">
                {placements.length} Total
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {placements.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Placements deployed in store</p>
          </CardContent>
        </Card>
      </div>

      {/* 30-Day Trend Sparkline */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                30-Day Scan Trend
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Daily QR scans, AI drafts & Google clicks over last 30 days
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-indigo-500 inline-block" />Scans</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-purple-500 inline-block" />Drafts</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-emerald-500 inline-block" />Clicks</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-5">
          {dailyStats.length === 0 ? (
            <div className="h-40 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">No scan data yet — standee scans will appear here in real-time.</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradDrafts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickFormatter={(v: string) => v.slice(5)}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f1f5f9',
                      padding: '8px 12px'
                    }}
                    labelFormatter={(l: string) => `Date: ${l}`}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="scanCount" name="Scans" stroke="#6366f1" strokeWidth={2} fill="url(#gradScans)" dot={false} />
                  <Area type="monotone" dataKey="helpMeWriteCount" name="Drafts" stroke="#a855f7" strokeWidth={2} fill="url(#gradDrafts)" dot={false} />
                  <Area type="monotone" dataKey="googleClickCount" name="Clicks" stroke="#10b981" strokeWidth={2} fill="url(#gradClicks)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Funnel Visualization */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">
            Customer Review Conversion Funnel
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Real customer drop-off and conversion rate for {activeBusiness?.name || 'this location'}
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
                  <span className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-2 py-0.5 font-mono">
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
                    style={{ width: totalScans > 0 ? item.percent : '0%' }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Breakdown Table by Standee Placements */}
          <div className="pt-2 space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Standee Placement Performance
            </div>
            {placements.length === 0 && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                <p className="text-xs text-slate-500">No standee placements created yet.</p>
                <NavLink to="/dashboard/qr">
                  <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Generate Your First Standee</span>
                  </Button>
                </NavLink>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Standee Label</th>
                      <th className="px-4 py-3">Short-Code</th>
                      <th className="px-4 py-3">Scans</th>
                      <th className="px-4 py-3">Google Clicks</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {placements.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {p.label}
                        </td>
                        <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400">
                          /r/{p.code}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-bold font-mono">
                          {p.scans || 0}
                        </td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          {p.googleClicks || 0}
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
            )}
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
