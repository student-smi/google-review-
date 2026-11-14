import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Tag,
  Clock,
  Trash2,
  Phone,
  Store,
  Check,
  ArrowUpRight,
  Info,
  Globe,
  Camera,
  TrendingUp,
  MapPin,
  Calendar,
  Share2,
  Lightbulb,
  Eye,
  SlidersHorizontal,
  Flame,
  Star
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { BusinessItem } from './DashboardLayout';

interface GooglePostDraft {
  id: string;
  topicType: 'STANDARD' | 'EVENT' | 'OFFER';
  headline: string;
  summary: string;
  callToAction: {
    type: 'CALL' | 'BOOK' | 'ORDER' | 'LEARN_MORE' | 'SIGN_UP';
    url: string;
    label: string;
  };
  couponCode?: string | null;
  suggestedPhoto: string;
  hashtags: string[];
}

interface SavedPostItem {
  id: string;
  businessId: string;
  branchId?: string | null;
  topicType: string;
  headline?: string | null;
  summary: string;
  couponCode?: string | null;
  callToActionType?: string | null;
  callToActionUrl?: string | null;
  googlePostId?: string | null;
  searchUrl?: string | null;
  status: string;
  errorMessage?: string | null;
  publishedAt?: number | null;
  createdAt: number;
}

interface GmbStatus {
  connected: boolean;
  meta?: {
    connectedEmail?: string;
    businessTitle?: string;
    locationName?: string;
  };
  requiresReauth?: boolean;
}

export function GooglePostsPage() {
  const { activeBusiness } = useOutletContext<{
    activeBusiness: BusinessItem | null;
  }>();

  // Generator Controls
  const [postType, setPostType] = useState<'offer' | 'update' | 'festive'>('offer');
  const [customTopic, setCustomTopic] = useState('');
  const [tone, setTone] = useState<'persuasive' | 'friendly' | 'professional'>('persuasive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<GooglePostDraft[]>([]);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Editable Draft Text map
  const [editedSummaries, setEditedSummaries] = useState<{ [id: string]: string }>({});

  // Publishing State
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // History & Status
  const [savedPosts, setSavedPosts] = useState<SavedPostItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [gmbStatus, setGmbStatus] = useState<GmbStatus | null>(null);
  const [isConnectingGmb, setIsConnectingGmb] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Load GMB connection status & past posts
  useEffect(() => {
    if (!activeBusiness?.id) return;
    loadGmbStatus();
    loadPastPosts();
  }, [activeBusiness?.id]);

  const loadGmbStatus = async () => {
    if (!activeBusiness?.id) return;
    try {
      const res = await apiFetch<GmbStatus>(`/api/gmb/status?businessId=${activeBusiness.id}`);
      setGmbStatus(res || { connected: false });
    } catch {
      setGmbStatus({ connected: false });
    }
  };

  const loadPastPosts = async () => {
    if (!activeBusiness?.id) return;
    setIsLoadingPosts(true);
    try {
      const res = await apiFetch<{ success: boolean; posts: SavedPostItem[] }>(`/api/gmb/posts?businessId=${activeBusiness.id}`);
      if (res?.success && Array.isArray(res.posts)) {
        setSavedPosts(res.posts);
      }
    } catch (err) {
      console.warn('Failed to load past posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Quick 1-Click Idea Chips based on Goal
  const quickIdeaChips = useMemo(() => {
    if (postType === 'offer') {
      return [
        { label: '🎉 Flat 20% Weekend Promo', text: 'Flat 20% off on all services this weekend with priority booking' },
        { label: '🎁 Free Strategy Audit', text: 'Complimentary zero-cost local audit and consultation session' },
        { label: '⭐ VIP Client Privilege Package', text: 'Exclusive VIP privilege package with dedicated account support' },
        { label: '⚡ Priority Slot Voucher', text: 'Limited fast-track priority appointment voucher' }
      ];
    }
    if (postType === 'update') {
      return [
        { label: '🚀 Service Expansion', text: 'Announcing upgraded service packages and enhanced client deliverables' },
        { label: '🏆 5-Star Trust Milestone', text: 'Celebrating 5-star Google rating and client success milestones' },
        { label: '✨ Certified Team & Workflow', text: 'Showcasing our certified experts and modern high-tech workflow' },
        { label: '📈 Local ROI Case Study', text: 'Real client ROI results: how local businesses scaled reach with us' }
      ];
    }
    return [
      { label: '🎉 Weekend Walk-In Welcome', text: 'Weekend priority consultation welcome—visit our local office' },
      { label: '❤️ Customer Appreciation', text: 'Heartfelt thank you to our Ahmedabad customers for continuous trust' },
      { label: '🌟 Seasonal Festive Package', text: 'Special seasonal festive package with complimentary onboarding' },
      { label: '🤝 1-on-1 Discovery Meet', text: 'Face-to-face personalized strategy session with our senior team' }
    ];
  }, [postType]);

  // Generate AI Posts
  const handleGeneratePosts = async () => {
    if (!activeBusiness?.id) return;
    setIsGenerating(true);
    setNotice(null);

    try {
      const res = await apiFetch<{ success: boolean; drafts: GooglePostDraft[]; usedFallback: boolean }>(
        '/api/gmb/posts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            businessId: activeBusiness.id,
            postType,
            customTopic: customTopic.trim(),
            tone
          })
        }
      );

      if (res?.success && Array.isArray(res.drafts) && res.drafts.length > 0) {
        setDrafts(res.drafts);
        const initialMap: { [id: string]: string } = {};
        res.drafts.forEach((d) => {
          initialMap[d.id] = d.summary;
        });
        setEditedSummaries(initialMap);
        setNotice({
          message: '✨ 3 Brand-New AI Google Maps Posts Generated! Review on mobile cards below and hit publish.',
          type: 'success'
        });
      } else {
        setNotice({ message: 'Could not generate posts. Please try again.', type: 'error' });
      }
    } catch (err: any) {
      setNotice({ message: err?.message || 'Error generating posts with AI.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // 1-Click Direct Publish to Google Maps
  const handlePublishPost = async (draft: GooglePostDraft) => {
    if (!activeBusiness?.id) return;
    setPublishingId(draft.id);
    setNotice(null);

    const summaryToSend = editedSummaries[draft.id] || draft.summary;

    try {
      const res = await apiFetch<{
        success: boolean;
        post: SavedPostItem;
        googlePublished: boolean;
        message: string;
      }>('/api/gmb/posts/publish', {
        method: 'POST',
        body: JSON.stringify({
          businessId: activeBusiness.id,
          draft: {
            ...draft,
            summary: summaryToSend
          }
        })
      });

      if (res?.success) {
        if (res.googlePublished) {
          setNotice({
            message: '🎉 Awesome! Post is now LIVE directly on Google Maps and Google Search!',
            type: 'success'
          });
        } else {
          setNotice({
            message: `Post saved to dashboard! ${res.message || 'Connect Google account to enable 100% direct publishing.'}`,
            type: 'info'
          });
        }
        await loadPastPosts();
      }
    } catch (err: any) {
      setNotice({ message: err?.message || 'Failed to publish post.', type: 'error' });
    } finally {
      setPublishingId(null);
    }
  };

  // 1-Click Copy & Open Google Profile fallback
  const handleCopyAndOpenGoogle = (draft: GooglePostDraft) => {
    const textToCopy = editedSummaries[draft.id] || draft.summary;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(draft.id);
    setTimeout(() => setCopiedId(null), 3000);

    if (activeBusiness?.id) {
      apiFetch('/api/gmb/posts/publish', {
        method: 'POST',
        body: JSON.stringify({
          businessId: activeBusiness.id,
          draft: {
            ...draft,
            summary: textToCopy
          }
        })
      }).then(() => loadPastPosts()).catch(() => {});
    }

    const placeId = activeBusiness?.googlePlaceId || '';
    const googlePostUrl = placeId
      ? `https://search.google.com/local/posts?placeid=${placeId}`
      : 'https://business.google.com';
    window.open(googlePostUrl, '_blank', 'noopener,noreferrer');
  };

  // Connect Google Profile OAuth trigger
  const handleConnectGoogle = async () => {
    if (!activeBusiness?.id) return;
    setIsConnectingGmb(true);
    try {
      const res = await apiFetch<{ authUrl: string }>(`/api/gmb/connect?businessId=${activeBusiness.id}`, {
        method: 'POST'
      });
      if (res?.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err: any) {
      setNotice({ message: err?.message || 'Failed to initiate Google authorization.', type: 'error' });
    } finally {
      setIsConnectingGmb(false);
    }
  };

  // Delete past post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to remove this post from your dashboard history?')) return;
    try {
      await apiFetch(`/api/gmb/posts/${postId}`, { method: 'DELETE' });
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
      setNotice({ message: 'Post record removed from dashboard.', type: 'info' });
    } catch (err: any) {
      setNotice({ message: err?.message || 'Could not delete post.', type: 'error' });
    }
  };

  // Filtered past posts
  const filteredPosts = useMemo(() => {
    if (historyFilter === 'published') {
      return savedPosts.filter((p) => p.status === 'published');
    }
    if (historyFilter === 'draft') {
      return savedPosts.filter((p) => p.status !== 'published');
    }
    return savedPosts;
  }, [savedPosts, historyFilter]);

  const publishedCount = savedPosts.filter((p) => p.status === 'published').length;
  const draftCount = savedPosts.filter((p) => p.status !== 'published').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans">
      {/* Top Banner Notice */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : notice.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : notice.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Header & Google Connection Bar */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-lg border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 tracking-wide shadow-xs border-0">
                ⭐ GOOGLE MAPS RANK BOOSTER
              </Badge>
              <span className="text-[11px] text-indigo-200/80 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Active posts boost local search ranking by 2.4x
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              Google Posts & Updates Studio
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Create and publish weekly offers, announcements, and seasonal updates directly to {activeBusiness?.name || 'Your Business'} on Google Maps.
            </p>
          </div>

          {/* Connection Status Card */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/15 flex items-center gap-3">
            {gmbStatus?.connected ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Google Account Connected</span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono">
                  {gmbStatus.meta?.connectedEmail || '1-Click Direct Publish Live'}
                </p>
              </div>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                disabled={isConnectingGmb}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md gap-1.5 px-4 h-10 cursor-pointer border-0"
              >
                {isConnectingGmb ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting…</span>
                  </>
                ) : (
                  <>
                    <Store className="w-3.5 h-3.5" />
                    <span>Connect Google Profile</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* 3-Step Interactive Process Breadcrumb Bar */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Select Post Goal</p>
              <p className="text-[10px] text-indigo-200/70">Deal, New Service, or Walk-in</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
            <span className="w-6 h-6 rounded-full bg-indigo-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Review AI Mobile Previews</p>
              <p className="text-[10px] text-indigo-200/70">3 Local SEO optimized variations</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
            <span className="w-6 h-6 rounded-full bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-white">1-Click Publish Live</p>
              <p className="text-[10px] text-indigo-200/70">Instantly visible on Google Maps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Controls Card */}
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-purple-50/20 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900">
                  Step 1: Choose Your Post Goal & Topic
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Pick a goal or tap a quick idea chip. AI generates 3 tailored options with emojis and call buttons.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Goal Selector Cards */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Choose Post Category:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Offer */}
              <button
                type="button"
                onClick={() => setPostType('offer')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  postType === 'offer'
                    ? 'border-purple-600 bg-purple-50/80 text-purple-950 ring-2 ring-purple-600/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {postType === 'offer' && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-600" />
                )}
                <div className="flex items-center gap-2 font-black text-sm mb-1.5">
                  <span className="text-lg">🏷️</span>
                  <span>Special Offer / Deal</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Promote discounts, coupons, or limited packages with urgent "Call Now" buttons.
                </p>
              </button>

              {/* Option 2: Update */}
              <button
                type="button"
                onClick={() => setPostType('update')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  postType === 'update'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-600/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {postType === 'update' && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600" />
                )}
                <div className="flex items-center gap-2 font-black text-sm mb-1.5">
                  <span className="text-lg">📢</span>
                  <span>What's New & Upgrades</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Highlight new services, upgraded tools, or client case studies with "Book Online".
                </p>
              </button>

              {/* Option 3: Festive */}
              <button
                type="button"
                onClick={() => setPostType('festive')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  postType === 'festive'
                    ? 'border-amber-600 bg-amber-50/80 text-amber-950 ring-2 ring-amber-600/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {postType === 'festive' && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-600" />
                )}
                <div className="flex items-center gap-2 font-black text-sm mb-1.5">
                  <span className="text-lg">🌟</span>
                  <span>Trust & Community</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  5-star customer appreciation, walk-in welcomes, weekend specials, and festival greetings.
                </p>
              </button>
            </div>
          </div>

          {/* 1-Click Idea Chips (Zero Typing Needed) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Popular Ideas (Tap to Auto-Fill):</span>
              </label>
              <span className="text-[10px] text-slate-400">Zero typing required</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickIdeaChips.map((chip, idx) => {
                const isSelected = customTopic === chip.text;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomTopic(chip.text)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Details Input & Tone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Custom Offer / Focus Details (Optional):
              </label>
              <div className="relative">
                <Input
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Flat 20% off this weekend on all services (or tap an idea chip above)..."
                  className="h-11 rounded-xl text-xs sm:text-sm border-slate-200 focus-visible:ring-purple-500 pr-8"
                />
                {customTopic && (
                  <button
                    type="button"
                    onClick={() => setCustomTopic('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block">
                💡 Leave blank to let AI automatically generate the best high-ranking local post for your business category!
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Writing Tone:</label>
              <select
                value={tone}
                onChange={(e: any) => setTone(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="persuasive">Persuasive & High Click-Through</option>
                <option value="friendly">Warm, Welcoming & Friendly</option>
                <option value="professional">Formal & Authoritative</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <Button
              onClick={handleGeneratePosts}
              disabled={isGenerating}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-md gap-2 px-8 h-12 cursor-pointer transition-transform active:scale-98"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Crafting 3 Fresh Google Maps Posts…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate 3 Fresh AI Google Posts Now</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 & 3: Generated Google Maps Live Mobile Previews Section */}
      {drafts.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Step 2: Review Google Maps Live Previews
                </h2>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] px-2 py-0.5">
                  3 AI Variations Ready
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                See exactly how your update looks on a customer's phone on Google Maps. Edit text if desired, then hit Publish.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePosts}
              disabled={isGenerating}
              className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer h-9 px-3 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating Variations…' : '🔄 Generate Another Batch (Re-Roll)'}</span>
            </Button>
          </div>

          {/* 3 Mobile Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {drafts.map((draft, idx) => {
              const currentSummary = editedSummaries[draft.id] || draft.summary;
              const isPublishingThis = publishingId === draft.id;
              const isCopiedThis = copiedId === draft.id;
              const wordCount = currentSummary.split(/\s+/).filter(Boolean).length;

              return (
                <div
                  key={draft.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all ring-1 ring-slate-100"
                >
                  <div>
                    {/* Realistic Google Maps Card Header */}
                    <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {activeBusiness?.name?.substring(0, 1) || 'G'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-slate-900 leading-tight">
                              {activeBusiness?.name || 'Local Business'}
                            </p>
                            {/* Verified check */}
                            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center" title="Google Verified Profile">
                              ✓
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">
                            ★ 4.9 • Google Business Profile • Just now
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black uppercase px-2 py-0.5 tracking-wider ${
                          draft.topicType === 'OFFER'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {draft.topicType === 'OFFER' ? '🏷️ Special Offer' : '📢 What\'s New'}
                      </Badge>
                    </div>

                    {/* Photo Placeholder Visual Banner */}
                    <div className="p-3 bg-gradient-to-r from-purple-50/70 to-indigo-50/70 border-b border-slate-100 flex items-center justify-between text-[11px] text-indigo-900">
                      <div className="flex items-center gap-1.5 line-clamp-1 pr-2">
                        <Camera className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">
                          Photo: {draft.suggestedPhoto}
                        </span>
                      </div>
                      <span className="text-[9px] font-black bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-700 shrink-0">
                        High CTR
                      </span>
                    </div>

                    {/* Headline & Editable Text */}
                    <div className="p-4 space-y-3">
                      <div className="font-bold text-sm text-slate-900 leading-snug">
                        {draft.headline}
                      </div>

                      {/* Editable Textarea with Word Counter */}
                      <div className="space-y-1">
                        <textarea
                          rows={6}
                          value={currentSummary}
                          onChange={(e) =>
                            setEditedSummaries((prev) => ({
                              ...prev,
                              [draft.id]: e.target.value
                            }))
                          }
                          className="w-full text-xs text-slate-700 leading-relaxed p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/60 resize-none font-sans"
                          placeholder="Post summary text..."
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                          <span>~{wordCount} words (Optimal for Mobile)</span>
                          <span className="text-purple-600 font-bold flex items-center gap-0.5">
                            <span>✏️</span> Click text to edit
                          </span>
                        </div>
                      </div>

                      {/* Coupon Code Pill if Offer */}
                      {draft.couponCode && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Voucher Code:</span>
                          </div>
                          <span className="font-mono font-black tracking-widest text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                            {draft.couponCode}
                          </span>
                        </div>
                      )}

                      {/* Official Google CTA Mock Button */}
                      <div className="p-2.5 rounded-xl bg-slate-100 text-center font-bold text-xs text-slate-800 border border-slate-200 flex items-center justify-center gap-2">
                        {draft.callToAction.type === 'CALL' ? (
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>Google Action: {draft.callToAction.label}</span>
                      </div>

                      {/* Hashtags list */}
                      {draft.hashtags && draft.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {draft.hashtags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Publishing Actions Footer */}
                  <div className="p-4 pt-0 space-y-2 border-t border-slate-100 bg-slate-50/40">
                    <Button
                      onClick={() => handlePublishPost(draft)}
                      disabled={isPublishingThis}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs gap-1.5 h-10 cursor-pointer"
                    >
                      {isPublishingThis ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing to Google Maps…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish to Google Maps (1-Click)</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleCopyAndOpenGoogle(draft)}
                      className="w-full text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-xl gap-1.5 h-9 cursor-pointer"
                    >
                      {isCopiedThis ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied! Opening Google…</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy & Open Google Manually</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Published Posts History & Activity Timeline */}
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-5 sm:p-6 pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Recent Posts & Activity Timeline</span>
                <Badge variant="outline" className="text-xs font-mono font-bold text-slate-600">
                  {savedPosts.length} Total
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Log of published Google Maps updates and saved drafts for this outlet.
              </CardDescription>
            </div>

            {/* Filter Tabs & Refresh */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    historyFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All ({savedPosts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('published')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    historyFilter === 'published' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🟢 Live ({publishedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('draft')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    historyFilter === 'draft' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  📝 Drafts ({draftCount})
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadPastPosts}
                disabled={isLoadingPosts}
                className="text-xs font-bold rounded-xl gap-1 text-slate-600 hover:text-slate-900 cursor-pointer h-8 px-2.5"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingPosts ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingPosts ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-semibold">Loading your post history…</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Share2 className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
              <p className="text-xs font-bold text-slate-700">No posts in this view</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Use the AI Studio above to create your first Google Maps update! Regular posts increase search rankings by up to 2.4x.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPosts.map((post) => {
                const dateStr = new Date(post.createdAt * 1000).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={post.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-black px-2 py-0.5 ${
                            post.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {post.status === 'published' ? '🟢 Live on Google Maps' : '📝 Saved in App'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {dateStr}
                        </span>
                        {post.couponCode && (
                          <span className="text-[10px] font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Code: {post.couponCode}
                          </span>
                        )}
                      </div>

                      {post.headline && (
                        <p className="text-xs font-bold text-slate-900">{post.headline}</p>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {post.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {post.searchUrl && (
                        <a
                          href={post.searchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-3 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="View live post on Google Maps"
                        >
                          <span>View on Google</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(post.summary);
                          setNotice({ message: 'Post text copied to clipboard!', type: 'success' });
                        }}
                        className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600 font-bold cursor-pointer"
                        title="Copy post text"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePost(post.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete post record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pro Tips Educational Drawer */}
      <div className="bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Local SEO Best Practices for Maximum Google Maps Footfall</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>📸</span> Real Photos Win
            </p>
            <p className="text-[11px] text-slate-500 leading-snug">
              Posts with real photos of your office, store, or team get 2.4x more clicks than generic stock images.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>⏰</span> Post on Thursday/Friday
            </p>
            <p className="text-[11px] text-slate-500 leading-snug">
              Local searches surge before the weekend. Posting at the end of the week captures active buyers.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>📞</span> High-Intent Action Buttons
            </p>
            <p className="text-[11px] text-slate-500 leading-snug">
              Always use "Call Now" for deals or urgent requests, and "Book Online" for appointments and consultations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
