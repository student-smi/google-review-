import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Check,
  Search,
  Tag,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Star,
  MessageSquare,
  HelpCircle,
  Plus,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';
import { apiFetch } from '@/lib/api';

interface ChecklistGroup {
  group: string;
  items: Array<{
    id: string;
    title: string;
    desc: string;
    tip: string;
    done: boolean;
  }>;
}

export interface LocalSeoKeywordSuggestion {
  keyword: string;
  type: 'local_seo' | 'product_service' | 'experience_topic';
  reason: string;
  source: 'place_data' | 'verified_business_data' | 'available_review_themes' | 'inference';
  confidence: 'high' | 'medium' | 'low';
}

export interface LocalSeoAnalysisOutput {
  businessName: string;
  businessCategory: string;
  location: string;
  keywordSuggestions: LocalSeoKeywordSuggestion[];
  customerQuestions: string[];
}

export function LocalSeoPage() {
  const { activeBusiness, refreshBusinesses } = useOutletContext<{
    activeBusiness: BusinessItem | null;
    refreshBusinesses?: () => Promise<void>;
  }>();

  // Keyword Engine State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [seoReport, setSeoReport] = useState<LocalSeoAnalysisOutput | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'local_seo' | 'product_service' | 'experience_topic'>('all');
  const [fromCache, setFromCache] = useState(false);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [chipActionMsg, setChipActionMsg] = useState<string | null>(null);

  // Sync activeChips when activeBusiness updates
  useEffect(() => {
    if (activeBusiness?.chipsJson) {
      try {
        const parsed = JSON.parse(activeBusiness.chipsJson);
        if (Array.isArray(parsed)) setActiveChips(parsed);
      } catch {
        setActiveChips([]);
      }
    } else {
      setActiveChips([]);
    }
  }, [activeBusiness?.id, activeBusiness?.chipsJson]);

  // Checklist State
  const [groups, setGroups] = useState<ChecklistGroup[]>([
    {
      group: 'Google Business Profile Completeness',
      items: [
        {
          id: 'hours',
          title: 'Accurate Opening & Festival Hours',
          desc: 'Ensure operating hours including Sunday/Holiday timings are current on Google Maps.',
          tip: 'Indian customers always check timings before travelling during Diwali, Eid & national holidays. Special hours preserve rating sentiment.',
          done: true
        },
        {
          id: 'photos',
          title: 'High-Resolution Store & Product Photos',
          desc: 'Upload at least 15 photos: storefront, interior dining/sales area, billing counter, and signature items.',
          tip: 'Profiles with storefront signage photos receive 42% more direction requests on Google Maps.',
          done: true
        },
        {
          id: 'category',
          title: 'Specific Primary Business Category',
          desc: 'Select the most specific category (e.g. "Indian Sweet Shop" or "Vegetarian Restaurant" instead of generic "Store").',
          tip: 'Google Map algorithms heavily favor exact primary categories for "near me" local pack queries.',
          done: false
        }
      ]
    },
    {
      group: 'Review Velocity & Engagement',
      items: [
        {
          id: 'reply_rate',
          title: 'Maintain 100% Review Reply Rate',
          desc: 'Acknowledge both glowing 5-star compliments and critical constructive feedback within 48 hours.',
          tip: 'Google explicitly confirms in official docs that merchant responses directly improve local SEO ranking prominence.',
          done: false
        },
        {
          id: 'counter_qr',
          title: 'Deploy Acrylic Standee at Billing Counter',
          desc: 'Invite happy customers to scan the QR while their bill or takeaway order is being packaged.',
          tip: 'Asking right after an enjoyable interaction yields an 8x higher submission completion rate.',
          done: true
        }
      ]
    }
  ]);

  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const toggleItem = (groupIdx: number, itemIdx: number) => {
    setGroups((prev) => {
      const copy = [...prev];
      copy[groupIdx].items[itemIdx].done = !copy[groupIdx].items[itemIdx].done;
      return copy;
    });
  };

  const totalItems = groups.flatMap((g) => g.items).length;
  const completedItems = groups.flatMap((g) => g.items).filter((i) => i.done).length;
  const percent = Math.round((completedItems / totalItems) * 100);

  // Fetch or Refresh Local SEO Keywords from API
  const handleAnalyzePlaceKeywords = async (forceRefresh: boolean = false) => {
    if (!activeBusiness) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setChipActionMsg(null);

    try {
      const payload = {
        businessId: activeBusiness.id,
        placeId: activeBusiness.googlePlaceId,
        businessName: activeBusiness.name,
        category: activeBusiness.category,
        city: activeBusiness.city,
        address: activeBusiness.address,
        refresh: forceRefresh
      };

      const res = await apiFetch<{
        success: boolean;
        data: LocalSeoAnalysisOutput;
        fromCache?: boolean;
        error?: string;
      }>('/api/ai/local-seo-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res?.success && res.data) {
        setSeoReport(res.data);
        setFromCache(Boolean(res.fromCache));
      } else {
        setAnalysisError(res?.error || 'Could not analyze place data. Please retry in a moment.');
      }
    } catch (err: any) {
      console.warn('Local SEO analysis request failed:', err);
      setAnalysisError(err?.message || 'Network error analyzing Google Places data. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add keyword directly to Standee chips
  const handleAddKeywordToStandee = async (keywordText: string) => {
    if (!activeBusiness?.id) return;
    const trimmed = keywordText.trim();
    if (!trimmed) return;

    if (activeChips.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setChipActionMsg(`"${trimmed}" is already on your standee.`);
      return;
    }

    const updated = [...activeChips, trimmed];
    setActiveChips(updated);

    try {
      await apiFetch(`/api/businesses/${activeBusiness.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          chipsJson: JSON.stringify(updated)
        })
      });
      refreshBusinesses?.();
      setChipActionMsg(`Added "${trimmed}" to active standee chips!`);
      setTimeout(() => setChipActionMsg(null), 3000);
    } catch (err) {
      console.warn('Failed to update chips:', err);
      setChipActionMsg('Failed to save to standee chips.');
    }
  };

  // Add all filtered suggestions to Standee chips
  const handleAddAllFilteredToStandee = async () => {
    if (!activeBusiness?.id || !seoReport) return;
    const filtered = (seoReport.keywordSuggestions || []).filter((item) =>
      filterType === 'all' ? true : item.type === filterType
    );

    const toAdd = filtered
      .map((item) => item.keyword.trim())
      .filter((k) => !activeChips.some((c) => c.toLowerCase() === k.toLowerCase()));

    if (toAdd.length === 0) {
      setChipActionMsg('All suggestions in this view are already active on your standee.');
      return;
    }

    const updated = [...activeChips, ...toAdd];
    setActiveChips(updated);

    try {
      await apiFetch(`/api/businesses/${activeBusiness.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          chipsJson: JSON.stringify(updated)
        })
      });
      refreshBusinesses?.();
      setChipActionMsg(`Added ${toAdd.length} new keywords to standee chips!`);
      setTimeout(() => setChipActionMsg(null), 3000);
    } catch (err) {
      console.warn('Failed to add all chips:', err);
      setChipActionMsg('Failed to save keywords.');
    }
  };

  const filteredSuggestions = (seoReport?.keywordSuggestions || []).filter((item) =>
    filterType === 'all' ? true : item.type === filterType
  );

  const localSeoCount = (seoReport?.keywordSuggestions || []).filter((k) => k.type === 'local_seo').length;
  const prodCount = (seoReport?.keywordSuggestions || []).filter((k) => k.type === 'product_service').length;
  const expCount = (seoReport?.keywordSuggestions || []).filter((k) => k.type === 'experience_topic').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Local SEO & Places Intelligence
            </h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
              Google Places API (New)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Analyze verified business signals to discover geo-targeted local keywords, product search phrases, and customer sentiment themes.
          </p>
        </div>

        {/* Readiness Score Pill */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <ProgressRing progress={percent} size={46} strokeWidth={4.5}>
            <span className="text-[11px] font-black">{percent}%</span>
          </ProgressRing>
          <div className="text-left pr-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {completedItems} of {totalItems} Completed
            </div>
            <div className="text-[10px] text-slate-400">Maps Readiness Score</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: AI-POWERED LOCAL SEO KEYWORD SUGGESTION ENGINE */}
      {/* ========================================================================= */}
      <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-sm overflow-hidden">
        <CardHeader className="p-6 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-[#0B101B] border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>AI-Powered Local SEO Keyword Engine</span>
                    <Badge variant="outline" className="text-[10px] bg-purple-100/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200">
                      Adaptive Places Signals
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Extracts real category, locality, and review themes using Google Places API (New) to suggest 8–15 deduplicated, explainable keywords.
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Action Trigger Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {seoReport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyzePlaceKeywords(true)}
                  disabled={isAnalyzing}
                  className="rounded-xl border-slate-200 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>Force Refresh API</span>
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => handleAnalyzePlaceKeywords(false)}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs gap-2 px-4 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing Google Place…</span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    <span>{seoReport ? 'Re-Analyze Place Data' : 'Analyze Google Place & Generate Keywords'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Business & Location Context Strip */}
          <div className="mt-4 pt-3 border-t border-purple-100/80 dark:border-slate-800/80 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
              <span className="text-slate-400">Active Business:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{activeBusiness?.name || 'Local Business'}</span>
            </div>
            {activeBusiness?.category && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="text-slate-400">• Category:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{activeBusiness.category}</span>
              </div>
            )}
            {activeBusiness?.city && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <MapPin className="h-3 w-3 text-purple-600" />
                <span>{activeBusiness.city}</span>
              </div>
            )}
            {activeBusiness?.googlePlaceId && (
              <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                <span>Place ID:</span>
                <code className="bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded font-mono text-[10px]">
                  {activeBusiness.googlePlaceId.substring(0, 14)}…
                </code>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Status Message or Toast */}
          {chipActionMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{chipActionMsg}</span>
              </div>
              <Link to="/dashboard/keyword-management" className="text-emerald-700 dark:text-emerald-300 underline font-bold text-[11px] flex items-center gap-1">
                <span>View Standee</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Error Banner with Retry */}
          {analysisError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900 dark:text-rose-200">Analysis Error</div>
                  <div className="mt-0.5">{analysisError}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAnalyzePlaceKeywords(true)}
                className="text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer shrink-0"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Initial Empty State (Before First Click) */}
          {!seoReport && !isAnalyzing && (
            <div className="py-12 px-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Search className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Discover Targeted Local SEO Keywords for "{activeBusiness?.name || 'Your Business'}"
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click the button below to retrieve verified Google Places API data. The AI engine classifies search intent into Local Discovery, Verified Products & Services, and Customer Experience Themes.
                </p>
              </div>
              <Button
                onClick={() => handleAnalyzePlaceKeywords(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-2 px-5 py-2 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Run Google Place Keyword Analysis</span>
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="py-16 text-center space-y-3 animate-in fade-in">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Retrieving Google Places API Signals…
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Validating business category, extracting locality from address, and analyzing review sentiment themes.
              </p>
            </div>
          )}

          {/* Report Display */}
          {seoReport && !isAnalyzing && (
            <div className="space-y-6 animate-in fade-in">
              {/* Report Metadata Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Detected Category:</span>
                  <Badge className="bg-purple-600 text-white text-xs font-bold">
                    {seoReport.businessCategory}
                  </Badge>
                  <span className="text-xs font-bold text-slate-500 ml-2">Location:</span>
                  <Badge variant="outline" className="text-xs font-semibold border-slate-300 dark:border-slate-700">
                    <MapPin className="h-3 w-3 mr-1 text-purple-600" />
                    {seoReport.location}
                  </Badge>
                  {fromCache && (
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200">
                      ⚡ KV Cached (24h)
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {seoReport.keywordSuggestions.length} Keywords Suggested
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddAllFilteredToStandee}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-purple-200 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add All ({filteredSuggestions.length}) to Standee</span>
                  </Button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  All Suggestions ({seoReport.keywordSuggestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('local_seo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'local_seo'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300'
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>Local SEO ({localSeoCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('product_service')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'product_service'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300'
                  }`}
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Products & Services ({prodCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('experience_topic')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'experience_topic'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  <Star className="h-3 w-3" />
                  <span>Customer Experience ({expCount})</span>
                </button>
              </div>

              {/* Keyword Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredSuggestions.map((item, idx) => {
                  const isAdded = activeChips.some((c) => c.toLowerCase() === item.keyword.toLowerCase());

                  let typeBadge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Local SEO
                    </span>
                  );
                  if (item.type === 'product_service') {
                    typeBadge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        Product / Service
                      </span>
                    );
                  } else if (item.type === 'experience_topic') {
                    typeBadge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        Experience Topic
                      </span>
                    );
                  }

                  let sourceText = 'AI Inference';
                  if (item.source === 'place_data') sourceText = 'Place API';
                  if (item.source === 'verified_business_data') sourceText = 'Verified Data';
                  if (item.source === 'available_review_themes') sourceText = 'Review Themes';

                  let confBadge = (
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      High Confidence
                    </span>
                  );
                  if (item.confidence === 'medium') {
                    confBadge = (
                      <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Medium Confidence
                      </span>
                    );
                  } else if (item.confidence === 'low') {
                    confBadge = (
                      <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        Low Confidence
                      </span>
                    );
                  }

                  return (
                    <div
                      key={`${item.keyword}-${idx}`}
                      className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-2xs flex flex-col justify-between hover:border-purple-300 transition-all group"
                    >
                      <div className="space-y-2">
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {typeBadge}
                            <span className="text-[10px] text-slate-400 font-medium">
                              {sourceText}
                            </span>
                          </div>
                          {confBadge}
                        </div>

                        {/* Keyword Name */}
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white capitalize pt-1">
                          "{item.keyword}"
                        </div>

                        {/* Digital Marketing Rationale */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                          "{item.reason}"
                        </p>
                      </div>

                      {/* Standee Action Button */}
                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {isAdded ? 'Active on standee' : 'Not on standee'}
                        </span>
                        <Button
                          size="sm"
                          variant={isAdded ? 'ghost' : 'outline'}
                          onClick={() => handleAddKeywordToStandee(item.keyword)}
                          disabled={isAdded}
                          className={`text-xs font-bold rounded-xl h-7 px-2.5 transition-all cursor-pointer ${
                            isAdded
                              ? 'text-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 cursor-default'
                              : 'text-purple-600 hover:text-white hover:bg-purple-600 border-purple-200'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-3 w-3 mr-1 text-emerald-600 stroke-[3]" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              <span>Add to Standee</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ========================================================================= */}
              {/* POLICY-SAFE CUSTOMER REVIEW WORKFLOW BOX */}
              {/* ========================================================================= */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900 p-5 space-y-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Policy-Safe Customer Review Flow</span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        Google Review Policy Compliant
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Google Maps guidelines strictly prohibit review gating, fake experiences, or forcing customers to use specific keywords. Keep Local SEO keyword analysis separate from review-writing.
                    </p>
                  </div>
                </div>

                {/* Open-Ended Customer Questions */}
                {seoReport.customerQuestions && seoReport.customerQuestions.length > 0 && (
                  <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                    <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Recommended Open-Ended Customer Questions:</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium list-disc list-inside">
                      {seoReport.customerQuestions.map((q, qIdx) => (
                        <li key={qIdx} className="leading-relaxed">
                          "{q}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Compliant Workflow Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">1. Open Questions</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Ask customers about their genuine, unforced experience.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">2. Natural AI Draft</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">AI organizes their own words into a natural, non-repetitive draft.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">3. Full Customer Edit</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Customers can freely edit or delete any sentence before copying.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">4. Voluntary Submit</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Customer voluntarily posts directly to Google from their own account.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 2: MAPS READINESS CHECKLIST */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Google Maps 3-Pack Optimization Checklist
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Essential verification factors that directly impact ranking prominence on Google Maps local pack.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {groups.map((group, groupIdx) => (
            <Card
              key={group.group}
              className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs"
            >
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-purple-600" />
                  <span>{group.group}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {group.items.map((item, itemIdx) => {
                  const isExpanded = expandedTip === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 transition-all ${
                        item.done
                          ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60'
                          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => toggleItem(groupIdx, itemIdx)}
                          className="flex items-start gap-3 text-left flex-1 cursor-pointer"
                        >
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                              item.done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-700 hover:border-purple-500'
                            }`}
                          >
                            {item.done && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <div
                              className={`text-xs sm:text-sm font-bold ${
                                item.done
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {item.desc}
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setExpandedTip(isExpanded ? null : item.id)}
                          className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline shrink-0 cursor-pointer pt-0.5"
                        >
                          <span>SEO Tip</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 bg-purple-50/60 dark:bg-purple-950/30 p-3 rounded-xl animate-in fade-in space-y-1">
                          <span className="font-bold text-purple-700 dark:text-purple-300">
                            Google Maps Insight:
                          </span>
                          <p className="leading-relaxed">{item.tip}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

