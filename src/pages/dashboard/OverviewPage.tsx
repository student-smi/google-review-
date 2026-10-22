import { useState, useEffect } from 'react';
import { useOutletContext, NavLink } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  QrCode,
  Sparkles,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  ShieldCheck,
  Layers,
  FileDown,
  MessageSquareQuote,
  Eye
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';

export function OverviewPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();

  // Mocked/API metrics state
  const [stats, setStats] = useState({
    scansToday: 48,
    draftsToday: 21,
    googleClicksToday: 18,
    conversionRate: 37.5,
    aiCallsToday: 5,
    aiDailyCap: 25
  });

  const [qrList, setQrList] = useState([
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

  // Checklist items
  const [checklist, setChecklist] = useState([
    { id: 'biz', label: 'Create business profile', done: true },
    { id: 'google_url', label: 'Verify official Google review link', done: true },
    { id: 'first_qr', label: 'Design dynamic QR code', done: true },
    { id: 'poster', label: 'Print or export table poster', done: false },
    { id: 'reply', label: 'Generate first AI review response', done: false }
  ]);

  const completedCount = checklist.filter((i) => i.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Overview
            </h1>
            <Badge variant="outline" className="text-xs">
              {activeBusiness?.name || 'Local Business'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Helping real customers share genuine Google reviews. Zero gating, zero fake reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NavLink to="/dashboard/qr">
            <Button variant="outline" size="sm" className="gap-2">
              <FileDown className="h-4 w-4" />
              <span>Poster Studio</span>
            </Button>
          </NavLink>
          <NavLink to="/dashboard/replies">
            <Button variant="saffron" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Reply Assistant</span>
            </Button>
          </NavLink>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Scans */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Scans Today</span>
              <QrCode className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.scansToday}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +14% vs yesterday
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Customer QR visits logged via non-blocking edge counter
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Help Me Write */}
        <Card className="hover:border-accent/40 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">AI Drafts Generated</span>
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.draftsToday}
              </span>
              <Badge variant="saffron" className="text-[10px] py-0 px-1.5">
                43% uptake
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Wording assistance provided strictly from customer chips & notes
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Google Clicks */}
        <Card className="hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Google Review Clicks</span>
              <ExternalLink className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.googleClicksToday}
              </span>
              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                Direct handoff
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Customers redirected to official Google rating box
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Funnel Conversion */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Scan → Google Rate</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.conversionRate}%
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {stats.googleClicksToday}/{stats.scansToday}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              High intent completion without review gating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Onboarding Checklist & Free-Tier Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Progress Ring (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Getting Started Checklist</CardTitle>
              <CardDescription>Follow these best practices to collect genuine Google reviews</CardDescription>
            </div>
            <ProgressRing progress={progressPercent} size={54} strokeWidth={5}>
              <span className="text-xs font-bold">{progressPercent}%</span>
            </ProgressRing>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'font-medium text-foreground'}`}>
                      {item.label}
                    </span>
                  </div>

                  {!item.done && (
                    <NavLink to={item.id === 'poster' ? '/dashboard/qr' : '/dashboard/replies'}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary">
                        <span>Do now</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Free Tier Usage & Limits Panel */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Usage & Limits</CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">Cloudflare Free</Badge>
            </div>
            <CardDescription className="text-xs">
              Daily budget safeguard per business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Calls */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground">Workers AI Calls</span>
                <span className="text-muted-foreground font-mono">{stats.aiCallsToday} / {stats.aiDailyCap} today</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${(stats.aiCallsToday / stats.aiDailyCap) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                20 AI review drafts remaining today before seamless template fallback.
              </p>
            </div>

            {/* D1 Storage & Writes */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground">D1 Daily Writes</span>
                <span className="text-muted-foreground font-mono">&lt; 0.1% of 100k</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '2%' }} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Upserted once daily per QR. Zero per-request KV writes.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-secondary/30 p-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Zero overages possible on Free Tier.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Dynamic QR Codes Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Active QR Codes</CardTitle>
            <CardDescription>Short-code URLs with instant Cloudflare KV cache resolution</CardDescription>
          </div>
          <NavLink to="/dashboard/qr">
            <Button size="sm" variant="primary" className="gap-1.5 text-xs">
              <QrCode className="h-3.5 w-3.5" />
              <span>Create New QR</span>
            </Button>
          </NavLink>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-5 py-3">Location / Label</th>
                <th className="px-5 py-3">Customer Link</th>
                <th className="px-5 py-3">Scans</th>
                <th className="px-5 py-3">AI Drafts</th>
                <th className="px-5 py-3">Google Clicks</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {qrList.map((qr) => (
                <tr key={qr.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    <div>{qr.label}</div>
                    <div className="text-xs text-muted-foreground font-mono">ID: {qr.id}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href={`/r/${qr.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
                    >
                      <span>/r/{qr.code}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">{qr.scans}</td>
                  <td className="px-5 py-3.5 text-foreground">{qr.drafts}</td>
                  <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">{qr.googleClicks}</td>
                  <td className="px-5 py-3.5 text-right">
                    <NavLink to="/dashboard/qr">
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Customize
                      </Button>
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
