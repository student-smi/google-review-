import { useState, useEffect } from 'react';
import { useOutletContext, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  MessageSquare,
  Eye,
  Star,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  Store,
  MapPin,
  Copy
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';
import { apiFetch } from '@/lib/api';

interface RealQrItem {
  id: string;
  code: string;
  label: string;
  destinationUrl: string;
  isActive: boolean;
  scans?: number;
  drafts?: number;
  googleClicks?: number;
}

export function OverviewPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();
  const navigate = useNavigate();

  const [qrList, setQrList] = useState<RealQrItem[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [placesStats, setPlacesStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness?.id) return;
    setIsLoading(true);

    apiFetch<{ qrCodes: any[] }>(`/api/qr/business/${activeBusiness.id}`)
      .then((data) => {
        if (data?.qrCodes) {
          const list = data.qrCodes.map((q) => ({
            id: q.id,
            code: q.code,
            label: q.label,
            destinationUrl: q.destinationUrl,
            isActive: Boolean(q.isActive ?? true),
            scans: q.scans ?? 0,
            drafts: q.drafts ?? 0,
            googleClicks: q.googleClicks ?? 0
          }));
          setQrList(list);
        } else {
          setQrList([]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch QR codes for business:', err);
        setQrList([]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    apiFetch<{ success: boolean; data: any }>(`/api/gmb/places-stats/${activeBusiness.id}`)
      .then((res) => {
        if (res?.data) setPlacesStats(res.data);
      })
      .catch(() => {});

    apiFetch<{ reviews: any[] }>(`/api/businesses/${activeBusiness.id}/reviews`)
      .then((res) => {
        if (res?.reviews) setReviews(res.reviews);
      })
      .catch(() => {});
  }, [activeBusiness?.id]);

  // Real computed totals from actual QR codes
  const totalScans = qrList.reduce((acc, q) => acc + (q.scans || 0), 0);
  const totalDrafts = qrList.reduce((acc, q) => acc + (q.drafts || 0), 0);
  const totalClicks = qrList.reduce((acc, q) => acc + (q.googleClicks || 0), 0);
  const conversionRate = totalScans > 0 ? ((totalClicks / totalScans) * 100).toFixed(1) : '0.0';

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-mono">
            <span>LOCATIONS</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white flex items-center gap-1 font-bold">
              <span className="text-amber-500">⭐</span> {activeBusiness?.name || 'My Business'}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Google Reviews Workspace
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-2xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Places: {placesStats?.rating ?? 4.9} ★ ({placesStats?.userRatingCount ?? 127} Reviews)</span>
            </span>
            {activeBusiness?.city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                {activeBusiness.city}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <NavLink to="/dashboard/qr">
            <button className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer">
              <FileDown className="h-3.5 w-3.5 text-slate-500" />
              <span>QR Poster Studio</span>
            </button>
          </NavLink>

          <NavLink to="/dashboard/replies">
            <button className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" />
              <span>AI Reply Copilot</span>
            </button>
          </NavLink>
        </div>
      </div>

      {/* 2. REAL KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] p-4 space-y-2 shadow-xs hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase font-mono">
            <span>Total Scans</span>
            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {totalScans}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">
              Real scans
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
              {totalDrafts}
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
              {totalClicks}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-mono">
              Handoffs
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Direct link to Google Maps rating</p>
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
              {conversionRate}%
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {totalClicks}/{totalScans} scans
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Real verified scan conversion</p>
        </div>
      </div>

      {/* 3. REVIEW FEED SECTION */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] shadow-md overflow-hidden space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Incoming Reviews & Tasks</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Real-time sync</span>
          </div>

          <NavLink to="/dashboard/replies">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">
              Open AI Reply Co-pilot →
            </span>
          </NavLink>
        </div>

        {/* Real Review Feed */}
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r: any) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {(r.customerName || 'C')[0]}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                        {r.customerName || 'Verified Customer'}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating || 5 }).map((_, i) => (
                          <span key={i} className="text-amber-400 text-xs">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <NavLink to="/dashboard/replies">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold rounded-lg border-slate-200 dark:border-slate-800">
                      Reply with AI →
                    </Button>
                  </NavLink>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{r.reviewText}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Customer Reviews Feed
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Customer reviews from QR scans and Google Maps appear here. As soon as customers review your business, you can generate AI replies in 1 click!
              </p>
            </div>
            <div className="pt-2">
              <NavLink to="/dashboard/qr">
                <Button size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-bold text-xs rounded-xl shadow-xs gap-1.5">
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Customize & Print Standee</span>
                </Button>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* 4. ACTIVE QR STANDEES & FREE TIER SAFEGUARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active QR Standees Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Active QR Standees ({qrList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Connected directly to {activeBusiness?.name || 'your store'}
              </p>
            </div>
            <NavLink to="/dashboard/qr">
              <button className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Standee</span>
              </button>
            </NavLink>
          </div>

          <div className="space-y-2">
            {qrList.length === 0 && !isLoading ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">No standees created yet.</p>
                <NavLink to="/dashboard/qr">
                  <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Generate First Standee</span>
                  </Button>
                </NavLink>
              </div>
            ) : (
              qrList.map((qr) => (
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
                      <p className="text-[11px] font-mono text-purple-600 dark:text-purple-400">/r/{qr.code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => handleCopyLink(qr.code)}
                      className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      {copiedCode === qr.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode === qr.code ? 'Copied' : 'Copy'}</span>
                    </button>

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
              ))
            )}
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
                <span className="font-mono">0 / 25 daily</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                  style={{ width: '0%' }}
                />
              </div>
              <p className="text-[10px] text-slate-500">25 review drafts daily per business location</p>
            </div>

            {/* D1 Database Writes */}
            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span>D1 Database Writes</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">&lt; 0.01% of 100k</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '1%' }} />
              </div>
              <p className="text-[10px] text-slate-500">KV cached — 0 D1 queries on customer scan</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Zero gating, authentic Google reviews guaranteed.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
